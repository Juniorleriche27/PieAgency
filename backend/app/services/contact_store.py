import logging
import re
import unicodedata
from urllib.parse import quote

import httpx
from supabase import create_client

from ..config import settings
from ..schemas import ContactRequestCreate, PartnershipRequestCreate

logger = logging.getLogger(__name__)


class ContactStoreNotConfiguredError(RuntimeError):
    pass


class SupabaseNotConfiguredError(ContactStoreNotConfiguredError):
    pass


class ContactStoreIntegrationError(RuntimeError):
    pass


AIRTABLE_CONTACT_FIELD_ALIASES: dict[str, tuple[str, ...]] = {
    "primary_name": (
        "Nom et prenom",
        "Nom complet",
    ),
    "respondent_type": (
        "Qui remplit ce formulaire ?",
        "Qui remplit le formulaire ?",
        "Qui renseigne le formulaire ?",
        "Type de repondant",
        "Repondant",
    ),
    "respondent_full_name": (
        "Nom complet du repondant",
        "Nom du repondant",
        "Nom et prenom du repondant",
    ),
    "student_full_name": (
        "Nom complet de l'etudiant concerne",
        "Nom de l'etudiant concerne",
        "Nom de l'etudiant",
    ),
    "email": (
        "Adresse e-mail",
        "Adresse email",
        "Email",
        "E-mail",
    ),
    "phone_country_code": (
        "Indicatif regional",
        "Indicatif",
    ),
    "phone": (
        "Telephone / WhatsApp",
        "Telephone WhatsApp",
        "Numero de telephone",
        "Telephone",
        "Phone",
    ),
    "country": (
        "Pays de residence",
        "Pays",
    ),
    "study_level": (
        "Dernier diplome obtenu",
        "Quel est son dernier diplome ?",
        "Dernier diplome",
        "Niveau d'etudes",
    ),
    "school_type": (
        "Quel type d'ecole visez-vous ?",
        "Quelle type d'ecole visez-vous ?",
        "Type d'ecole vise",
        "Type d'ecole",
    ),
    "target_project": (
        "Projet vise / formation recherchee",
        "Projet vise",
        "Formation recherchee",
    ),
    "assistance_preference": (
        "Quel type d'assistance souhaitez-vous ?",
        "Assistance souhaitee",
        "Type d'assistance",
    ),
    "funding_source": (
        "Qui financera les etudes en France ?",
        "Qui financera ses etudes ?",
        "Financement",
        "Source de financement",
    ),
    "financial_situation": (
        "Situation financiere actuelle",
        "Situation financiere",
    ),
    "guarantor_informed": (
        "Le garant est-il deja informe ?",
        "Le garant financier est deja informe de son projet d'immigration ?",
        "Garant deja informe",
    ),
    "guarantor_full_name": (
        "Nom complet du garant",
        "Nom du garant",
    ),
    "guarantor_phone": (
        "Numero du garant",
        "Telephone du garant",
    ),
    "referrer_name": (
        "Qui vous a envoye le lien du formulaire ?",
        "Qui vous a envoye le lien",
    ),
    "consultation_date": (
        "Date de consultation / RDV",
        "Date de consultation",
        "Jour disponible",
    ),
    "consultation_time": (
        "Heure de consultation",
        "Heure disponible",
    ),
    "consent_contact": (
        "Consentement de contact",
        "Consentement",
    ),
    "message": (
        "Resume du formulaire",
        "Resume",
        "Message",
        "Notes",
    ),
}


def _get_supabase_client():
    if not settings.supabase_enabled:
        raise SupabaseNotConfiguredError(
            "Supabase n'est pas configure. Renseignez SUPABASE_URL et une cle serveur.",
        )
    return create_client(settings.supabase_url, settings.supabase_key)


def _normalize_field_name(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_value = ascii_value.lower().replace("&", " et ")
    ascii_value = re.sub(r"[^a-z0-9]+", " ", ascii_value)
    return " ".join(ascii_value.split())


def _get_airtable_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.airtable_api_token.strip()}",
        "Content-Type": "application/json",
    }


def _get_airtable_base_url() -> str:
    return settings.airtable_api_base_url.rstrip("/")


def _extract_airtable_error_message(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except Exception:
        return response.text.strip() or f"Erreur Airtable HTTP {response.status_code}."

    if isinstance(payload, dict):
        error = payload.get("error")
        if isinstance(error, dict):
            error_type = str(error.get("type", "")).strip()
            error_message = str(error.get("message", "")).strip()
            if error_type and error_message:
                return f"{error_type}: {error_message}"
            if error_message:
                return error_message
            if error_type:
                return error_type

        detail = str(payload.get("message", "")).strip() or str(payload.get("detail", "")).strip()
        if detail:
            return detail

    return response.text.strip() or f"Erreur Airtable HTTP {response.status_code}."


def _raise_for_airtable_response(response: httpx.Response, fallback: str) -> None:
    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        detail = _extract_airtable_error_message(exc.response)
        raise ContactStoreIntegrationError(f"{fallback} {detail}".strip()) from exc


def _list_airtable_tables() -> list[dict]:
    if not settings.airtable_enabled:
        raise ContactStoreNotConfiguredError(
            "Airtable n'est pas configure. Renseignez AIRTABLE_API_TOKEN, AIRTABLE_BASE_ID et AIRTABLE_TABLE_NAME.",
        )

    schema_url = f"{_get_airtable_base_url()}/meta/bases/{settings.airtable_base_id.strip()}/tables"
    try:
        response = httpx.get(
            schema_url,
            headers=_get_airtable_headers(),
            timeout=settings.airtable_request_timeout_seconds,
        )
    except httpx.RequestError as exc:
        raise ContactStoreIntegrationError(
            "Impossible de contacter Airtable pour lire la structure de la base.",
        ) from exc

    _raise_for_airtable_response(
        response,
        "Impossible de lire la structure Airtable.",
    )
    payload = response.json()
    return payload.get("tables", [])


def _find_airtable_table_schema() -> dict:
    requested_table = settings.airtable_table_name.strip()
    requested_table_normalized = _normalize_field_name(requested_table)

    for table in _list_airtable_tables():
        table_id = str(table.get("id", "")).strip()
        table_name = str(table.get("name", "")).strip()
        if (
            requested_table == table_id
            or requested_table == table_name
            or requested_table_normalized == _normalize_field_name(table_name)
        ):
            return table

    raise RuntimeError(
        f"Table Airtable introuvable: {requested_table}. Verifiez AIRTABLE_TABLE_NAME.",
    )


def _resolve_airtable_field_names(table_schema: dict) -> dict[str, str]:
    available_fields = [
        (
            _normalize_field_name(str(field.get("name", ""))),
            str(field.get("name", "")).strip(),
        )
        for field in table_schema.get("fields", [])
        if str(field.get("name", "")).strip()
    ]

    resolved: dict[str, str] = {}
    for internal_key, aliases in AIRTABLE_CONTACT_FIELD_ALIASES.items():
        normalized_aliases = [_normalize_field_name(alias) for alias in aliases]

        for alias_normalized in normalized_aliases:
            for field_normalized, field_name in available_fields:
                if field_normalized == alias_normalized:
                    resolved[internal_key] = field_name
                    break
            if internal_key in resolved:
                break

        if internal_key in resolved:
            continue

        for alias in aliases:
            alias_normalized = _normalize_field_name(alias)
            for field_normalized, field_name in available_fields:
                if (
                    field_normalized.startswith(alias_normalized)
                    or alias_normalized.startswith(field_normalized)
                ):
                    resolved[internal_key] = field_name
                    break
            if internal_key in resolved:
                break

    return resolved


def _build_airtable_contact_fields(
    payload: ContactRequestCreate,
    field_names: dict[str, str],
    field_types: dict[str, str],
) -> dict[str, object]:
    student_name = payload.effective_student_full_name
    respondent_name = payload.effective_respondent_full_name
    consent_field_name = field_names.get("consent_contact", "")
    consent_field_type = field_types.get(consent_field_name, "")
    consent_contact_value: object = payload.consent_contact

    if consent_field_type != "checkbox":
        consent_contact_value = "Oui" if payload.consent_contact else "Non"

    values_by_key: dict[str, object] = {
        "primary_name": student_name,
        "respondent_type": payload.respondent_type,
        "respondent_full_name": respondent_name,
        "student_full_name": student_name,
        "phone_country_code": payload.phone_country_code,
        "phone": payload.phone,
        "email": str(payload.email),
        "country": payload.country,
        "study_level": payload.study_level,
        "school_type": payload.school_type,
        "target_project": payload.target_project,
        "assistance_preference": payload.assistance_preference,
        "funding_source": payload.funding_source,
        "financial_situation": payload.financial_situation,
        "guarantor_informed": "Oui" if payload.guarantor_informed else "Non",
        "guarantor_full_name": payload.guarantor_full_name,
        "guarantor_phone": payload.guarantor_phone,
        "referrer_name": payload.referrer_name,
        "consultation_date": payload.consultation_date.isoformat(),
        "consultation_time": payload.consultation_time.strftime("%H:%M"),
        "consent_contact": consent_contact_value,
        "message": payload.summary_message,
    }

    fields: dict[str, object] = {}
    for internal_key, field_name in field_names.items():
        value = values_by_key.get(internal_key)
        if value is None or value == "":
            continue
        fields[field_name] = value

    if not fields:
        raise RuntimeError(
            "Aucune colonne Airtable compatible n'a ete trouvee. Verifiez les noms de champs de la table.",
        )

    return fields


def _store_contact_request_in_airtable(payload: ContactRequestCreate) -> str:
    table_schema = _find_airtable_table_schema()
    requested_table = settings.airtable_table_name.strip()
    table_id = str(table_schema.get("id", "")).strip()
    table_name = str(table_schema.get("name", "")).strip()
    table_identifier = table_id if requested_table == table_id else table_name or requested_table
    field_names = _resolve_airtable_field_names(table_schema)
    field_types = {
        str(field.get("name", "")).strip(): str(field.get("type", "")).strip()
        for field in table_schema.get("fields", [])
        if str(field.get("name", "")).strip()
    }
    fields = _build_airtable_contact_fields(payload, field_names, field_types)

    encoded_table_identifier = quote(table_identifier, safe="")
    records_url = (
        f"{_get_airtable_base_url()}/{settings.airtable_base_id.strip()}/{encoded_table_identifier}"
    )
    try:
        response = httpx.post(
            records_url,
            headers=_get_airtable_headers(),
            json={
                "records": [{"fields": fields}],
                "typecast": True,
            },
            timeout=settings.airtable_request_timeout_seconds,
        )
    except httpx.RequestError as exc:
        raise ContactStoreIntegrationError(
            "Impossible de contacter Airtable pour creer la ligne du formulaire.",
        ) from exc

    _raise_for_airtable_response(
        response,
        "Airtable a refuse la creation de la ligne.",
    )
    payload_json = response.json()
    records = payload_json.get("records", [])
    if not records:
        raise RuntimeError("Airtable n'a pas retourne l'entree creee.")
    return str(records[0].get("id", ""))


def _store_contact_request_in_supabase(payload: ContactRequestCreate) -> str:
    client = _get_supabase_client()
    response = (
        client.table(settings.supabase_contact_table)
        .insert(
            {
                "full_name": payload.full_name,
                "first_name": payload.first_name,
                "last_name": payload.last_name,
                "email": payload.email,
                "phone_country_code": payload.phone_country_code,
                "phone": payload.phone,
                "country": payload.country,
                "study_level": payload.study_level,
                "target_project": payload.target_project,
                "immigration_attempt_count": 0,
                "school_type": payload.school_type,
                "funding_source": payload.funding_source,
                "assistance_preference": payload.assistance_preference,
                "consultation_date": payload.consultation_date.isoformat(),
                "consultation_time": payload.consultation_time.isoformat(),
                "referrer_name": payload.referrer_name,
                "can_invest": payload.guarantor_informed is True,
                "consent_resources": payload.consent_contact,
                "message": payload.summary_message,
            },
        )
        .execute()
    )

    if not response.data:
        raise RuntimeError("Supabase did not return the inserted contact row.")

    return str(response.data[0].get("id", ""))


def store_contact_request(payload: ContactRequestCreate) -> str:
    stored_contact_id = ""

    if settings.airtable_enabled:
        stored_contact_id = _store_contact_request_in_airtable(payload)
        if settings.supabase_enabled:
            try:
                _store_contact_request_in_supabase(payload)
            except Exception:
                logger.exception("Unable to mirror contact request to Supabase")
        return stored_contact_id

    if settings.supabase_enabled:
        return _store_contact_request_in_supabase(payload)

    raise ContactStoreNotConfiguredError(
        "Aucun stockage de formulaire n'est configure. Renseignez Airtable ou Supabase.",
    )


def store_partnership_request(payload: PartnershipRequestCreate) -> str:
    client = _get_supabase_client()
    response = (
        client.table("partnership_requests")
        .insert(
            {
                "organization_name": payload.organization_name,
                "organization_type": payload.organization_type.value,
                "contact_full_name": payload.contact_full_name,
                "contact_role": payload.contact_role,
                "email": payload.email,
                "phone": payload.phone,
                "country": payload.country,
                "website": payload.website,
                "partnership_scope": payload.partnership_scope.value,
                "objectives": payload.objectives,
                "additional_notes": payload.additional_notes,
                "consent_contact": payload.consent_contact,
            },
        )
        .execute()
    )

    if not response.data:
        raise RuntimeError("Supabase did not return the inserted partnership row.")

    return str(response.data[0].get("id", ""))
