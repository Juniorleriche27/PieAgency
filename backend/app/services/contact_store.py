from supabase import create_client

from ..config import settings
from ..schemas import ContactRequestCreate, PartnershipRequestCreate


class SupabaseNotConfiguredError(RuntimeError):
    pass


def _get_client():
    if not settings.supabase_enabled:
        raise SupabaseNotConfiguredError(
            "Supabase n'est pas configure. Renseignez SUPABASE_URL et une cle serveur.",
        )
    return create_client(settings.supabase_url, settings.supabase_key)


def store_contact_request(payload: ContactRequestCreate) -> str:
    client = _get_client()
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


def store_partnership_request(payload: PartnershipRequestCreate) -> str:
    client = _get_client()
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
