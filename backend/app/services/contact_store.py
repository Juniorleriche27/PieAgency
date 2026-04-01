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


AIRTABLE_CONTACT_FIELD_ALIASES: dict[str, tuple[str, ...]] = {
    "primary_name": (
        "Nom et prénom",
        "Nom et prenom",
        "Nom et prénom de l'étudiant",
        "Nom et prenom de l'etudiant",
        "Nom complet",
    ),
    "email": (
        "Adresse e-mail",
        "Adresse email",
        "Email",
        "E-mail",
    ),
    "phone_country_code": (
        "Indicatif régional",
        "Indicatif regional",
        "Indicatif",
    ),
    "phone": (
        "Numéro de téléphone",
        "Numero de telephone",
        "Téléphone",
        "Telephone",
        "Phone",
    ),
    "respondent_type": (
        "Qui remplit le formulaire ?",
        "Qui renseigne le formulaire ?",
        "Type de répondant",
        "Type de repondant",
        "Répondant",
        "Repondant",
    ),
    "respondent_full_name": (
        "Nom du répondant",
        "Nom du repondant",
        "Nom & prénom du répondant",
        "Nom & prenom du repondant",
    ),
    "student_full_name": (
        "Nom de l'étudiant concerné",
        "Nom de l'etudiant concerne",
        "Nom de l'étudiant",
        "Nom de l'etudiant",
    ),
    "country": ("Pays",),
    "study_level": (
        "Quel est son dernier diplôme ?",
        "Quel est son dernier diplome ?",
        "Dernier diplôme",
        "Dernier diplome",
        "Niveau d'études",
        "Niveau d'etudes",
    ),
    "funding_source": (
        "Qui financera ses études ?",
        "Qui financera ses etudes ?",
        "Financement",
        "Source de financement",
    ),
    "target_project": (
        "Campus France ou Belgique",
        "Projet visé",
        "Projet vise",
        "Intéressé par Campus France ou Belgique",
        "Interesse par Campus France ou Belgique",
    ),
    "guarantor_informed": (
        "Le garant financier est déjà informé de son projet d'immigration ?",
        "Le garant financier est deja informe de son projet d'immigration ?",
        "Garant déjà informé",
        "Garant deja informe",
    ),
    "guarantor_full_name": (
        "Nom du garant",
        "Nom complet du garant",
    ),
    "guarantor_phone": (
        "Numéro du garant",
        "Numero du garant",
        "Téléphone du garant",
        "Telephone du garant",
    ),
    "consultation_date": (
        "Date de consultation",
        "Jour disponible",
    ),
    "consultation_time": (
        "Heure de consultation",
        "Heure disponible",
    ),
    "message": (
        "Message",
        "Résumé",
        "Resume",
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


def _list_airtable_tables() -> list[dict]:
    if not settings.airtable_enabled:
        raise ContactStoreNotConfiguredError(
            "Airtable n'est pas configure. Renseignez AIRTABLE_API_TOKEN, AIRTABLE_BASE_ID et AIRTABLE_TABLE_NAME.",
        )

    schema_url = f"{_get_airtable_base_url()}/meta/bases/{settings.airtable_base_id.strip()}/tables"
    response = httpx.get(
        schema_url,
        headers=_get_airtable_headers(),
        timeout=settings.airtable_request_timeout_seconds,
    )
    response.raise_for_status()
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
    available_fields = {
        _normalize_field_name(str(field.get("name", ""))): str(field.get("name", "")).strip()
        for field in table_schema.get("fields", [])
        if str(field.get("name", "")).strip()
    }

    resolved: dict[str, str] = {}
    for internal_key, aliases in AIRTABLE_CONTACT_FIELD_ALIASES.items():
        for alias in aliases:
            match = available_fields.get(_normalize_field_name(alias))
            if match:
                resolved[internal_key] = match
                break

    return resolved


def _build_airtable_contact_fields(payload: ContactRequestCreate, field_names: dict[str, str]) -> dict[str, object]:
    student_name = payload.full_name
    respondent_name = payload.respondent_full_name or student_name

    values_by_key: dict[str, object] = {
        "primary_name": student_name,
        "email": str(payload.email),
        "phone_country_code": payload.phone_country_code,
        "phone": payload.phone,
        "respondent_type": payload.respondent_type or "Etudiant",
        "respondent_full_name": respondent_name,
        "student_full_name": payload.student_full_name or student_name,
        "country": payload.country,
        "study_level": payload.study_level.value,
        "funding_source": payload.funding_source,
        "target_project": payload.target_project.value,
        "guarantor_informed": (
            "Oui"
            if payload.guarantor_informed is True
            else "Non"
            if payload.guarantor_informed is False
            else None
        ),
        "guarantor_full_name": payload.guarantor_full_name,
        "guarantor_phone": payload.guarantor_phone,
        "consultation_date": payload.consultation_date.isoformat(),
        "consultation_time": payload.consultation_time.strftime("%H:%M:%S"),
        "message": payload.message,
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
    table_name = str(table_schema.get("name", "")).strip() or settings.airtable_table_name.strip()
    field_names = _resolve_airtable_field_names(table_schema)
    fields = _build_airtable_contact_fields(payload, field_names)

    encoded_table_name = quote(table_name, safe="")
    records_url = f"{_get_airtable_base_url()}/{settings.airtable_base_id.strip()}/{encoded_table_name}"
    response = httpx.post(
        records_url,
        headers=_get_airtable_headers(),
        json={
            "records": [{"fields": fields}],
            "typecast": True,
        },
        timeout=settings.airtable_request_timeout_seconds,
    )
    response.raise_for_status()
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
                "study_level": payload.study_level.value,
                "target_project": payload.target_project.value,
                "immigration_attempt_count": payload.immigration_attempt_count,
                "school_type": payload.school_type.value,
                "funding_source": payload.funding_source,
                "assistance_preference": payload.assistance_preference.value,
                "consultation_date": payload.consultation_date.isoformat(),
                "consultation_time": payload.consultation_time.isoformat(),
                "referrer_name": payload.referrer_name,
                "can_invest": payload.can_invest,
                "consent_resources": payload.consent_resources,
                "message": payload.message,
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
