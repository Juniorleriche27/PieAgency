from datetime import date, time
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class StudyLevel(str, Enum):
    BACCALAUREAT = "Baccalaureat"
    LICENCE = "Licence / Bachelor"
    MASTER = "Master"
    DOCTORAT = "Doctorat"
    AUTRE = "Autre"


class TargetProject(str, Enum):
    CAMPUS_FRANCE = "Campus France"
    VISA = "Procedure Visa"
    BELGIQUE = "Campus Belgique"
    PARIS_SACLAY = "Paris-Saclay"
    PARCOURSUP = "Parcoursup"
    ECOLES = "Ecoles privees France"
    AUTRE = "Autre"


class SchoolType(str, Enum):
    ECOLE_COMMERCE = "Ecole de commerce"
    ECOLE_INGENIEUR = "Ecole d'ingenieur"
    UNIVERSITE_PRIVEE = "Universite privee"
    UNIVERSITE_PUBLIQUE = "Universite publique"
    REFLEXION = "Je reflechis pour le moment"


class AssistancePreference(str, Enum):
    DIAGNOSTIC = "Diagnostic complet du projet"
    CAMPUS = "Accompagnement Campus France"
    VISA = "Accompagnement procedure visa"
    BELGIQUE = "Accompagnement Belgique"
    PARCOURSUP = "Accompagnement Parcoursup"
    ECOLES = "Accompagnement ecoles privees"
    COACHING = "Coaching et relecture de dossier"


class PartnershipOrganizationType(str, Enum):
    UNIVERSITE = "Universite"
    ECOLE = "Ecole"
    ENTREPRISE = "Entreprise"
    ASSOCIATION = "Association"
    INSTITUTION = "Institution publique"
    AUTRE = "Autre"


class PartnershipScope(str, Enum):
    RECRUTEMENT = "Recrutement etudiant"
    VISIBILITE = "Visibilite et communication"
    EVENEMENT = "Evenement ou webinaire"
    REPRESENTATION = "Representation locale"
    ACCORD = "Accord institutionnel"
    AUTRE = "Autre"


class ContactRequestCreate(BaseModel):
    first_name: str = Field(min_length=2, max_length=80)
    last_name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    phone_country_code: str = Field(min_length=2, max_length=8)
    phone: str = Field(min_length=6, max_length=32)
    country: str = Field(min_length=2, max_length=80)
    respondent_type: Literal["Etudiant", "Parent"]
    respondent_full_name: str = Field(min_length=3, max_length=160)
    student_full_name: str | None = Field(default=None, max_length=160)
    study_level: str = Field(min_length=2, max_length=160)
    school_type: str = Field(min_length=2, max_length=200)
    target_project: str = Field(min_length=2, max_length=300)
    assistance_preference: str = Field(min_length=2, max_length=200)
    funding_source: str = Field(min_length=2, max_length=160)
    financial_situation: str = Field(min_length=2, max_length=1000)
    guarantor_informed: bool | None = None
    guarantor_full_name: str = Field(min_length=3, max_length=160)
    guarantor_phone: str = Field(min_length=6, max_length=32)
    referrer_name: str = Field(min_length=2, max_length=160)
    consultation_date: date
    consultation_time: time
    consent_contact: bool
    message: str | None = Field(default=None, max_length=4000)

    @field_validator(
        "first_name",
        "last_name",
        "phone_country_code",
        "phone",
        "country",
        "respondent_full_name",
        "student_full_name",
        "study_level",
        "school_type",
        "target_project",
        "assistance_preference",
        "funding_source",
        "financial_situation",
        "guarantor_full_name",
        "guarantor_phone",
        "referrer_name",
        "message",
        mode="before",
    )
    @classmethod
    def strip_required_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @model_validator(mode="after")
    def validate_payload(self) -> "ContactRequestCreate":
        if not self.phone_country_code.startswith("+"):
            raise ValueError("L'indicatif du numero doit commencer par +.")
        if not self.consent_contact:
            raise ValueError("Le consentement de contact est requis.")
        if self.respondent_type == "Parent" and not self.student_full_name:
            raise ValueError("Le nom complet de l'etudiant concerne est requis.")
        if self.guarantor_informed is None:
            raise ValueError("Le statut du garant doit etre precise.")
        return self

    @property
    def full_name(self) -> str:
        return (
            self.student_full_name
            or self.respondent_full_name
            or f"{self.first_name} {self.last_name}"
        ).strip()

    @property
    def effective_respondent_full_name(self) -> str:
        return (self.respondent_full_name or f"{self.first_name} {self.last_name}").strip()

    @property
    def effective_student_full_name(self) -> str:
        if self.respondent_type == "Parent":
            return (self.student_full_name or self.full_name).strip()
        return (self.student_full_name or self.respondent_full_name or self.full_name).strip()

    @property
    def summary_message(self) -> str:
        if self.message:
            return self.message

        guarantor_informed = "Oui" if self.guarantor_informed else "Non"
        consent_contact = "Oui" if self.consent_contact else "Non"

        lines = [
            "Resume du formulaire",
            "",
            f"- Qui remplit ce formulaire ? {self.respondent_type}",
            f"- Nom complet du repondant : {self.effective_respondent_full_name}",
            f"- Nom complet de l'etudiant concerne : {self.effective_student_full_name}",
            f"- Telephone / WhatsApp : {self.phone_country_code} {self.phone}".strip(),
            f"- Adresse e-mail : {self.email}",
            f"- Pays de residence : {self.country}",
            f"- Dernier diplome obtenu : {self.study_level}",
            f"- Quel type d'ecole visez-vous ? {self.school_type}",
            f"- Projet vise / formation recherchee : {self.target_project}",
            f"- Quel type d'assistance souhaitez-vous ? {self.assistance_preference}",
            f"- Qui financera les etudes en France ? {self.funding_source}",
            f"- Situation financiere actuelle : {self.financial_situation}",
            f"- Le garant est-il deja informe ? {guarantor_informed}",
            f"- Nom complet du garant : {self.guarantor_full_name}",
            f"- Numero du garant : {self.guarantor_phone}",
            f"- Qui vous a envoye le lien du formulaire ? {self.referrer_name}",
            f"- Date de consultation / RDV : {self.consultation_date.isoformat()}",
            f"- Heure de consultation : {self.consultation_time.strftime('%H:%M')}",
            f"- Consentement de contact : {consent_contact}",
        ]
        return "\n".join(lines)

    @property
    def formatted_message(self) -> str:
        return self.summary_message


class ContactRequestResponse(BaseModel):
    id: str
    status: str
    message: str


class PaymentConfigResponse(BaseModel):
    enabled: bool
    provider: Literal["maketou"]
    merchant_label: str
    display_currency: str
    instructions: str
    status_check_enabled: bool = False


class PaymentIntentCreateRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=6, max_length=32)
    amount: float = Field(gt=0, le=100_000_000)
    service_slug: str | None = Field(default=None, max_length=60)
    dossier_reference: str | None = Field(default=None, max_length=120)
    reason: str = Field(min_length=4, max_length=240)

    @field_validator(
        "full_name",
        "phone",
        "service_slug",
        "dossier_reference",
        "reason",
        mode="before",
    )
    @classmethod
    def strip_payment_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("phone")
    @classmethod
    def validate_payment_phone(cls, value: str) -> str:
        normalized = value.replace(" ", "").replace("-", "").replace("(", "").replace(")", "").replace(".", "")
        if normalized.startswith("00"):
            normalized = f"+{normalized[2:]}"
        if not normalized.startswith("+") or not normalized[1:].isdigit() or len(normalized) < 9:
            raise ValueError(
                "Le numero doit etre renseigne au format international, par exemple +22899159953.",
            )
        return normalized


class PaymentIntentCreateResponse(BaseModel):
    provider: Literal["maketou"]
    status: Literal["waiting_payment", "completed", "abandoned", "payment_failed", "unknown"]
    message: str
    cart_id: str | None = None
    redirect_url: str | None = None
    payment_id: str | None = None
    reference: str | None = None
    status_check_enabled: bool = False


class PaymentStatusResponse(BaseModel):
    provider: Literal["maketou"]
    cart_id: str
    status: Literal["waiting_payment", "completed", "abandoned", "payment_failed", "unknown"]
    message: str
    payment_id: str | None = None
    reference: str | None = None
    service_slug: str | None = None
    user_id: str | None = None


class PaymentReceiptRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=120)
    amount: float = Field(gt=0)
    currency: str = Field(default="XOF", max_length=10)
    service_label: str = Field(default="Accompagnement PieAgency", max_length=200)
    reference: str | None = Field(default=None, max_length=100)
    payment_id: str | None = Field(default=None, max_length=100)


class PartnershipRequestCreate(BaseModel):
    organization_name: str = Field(min_length=2, max_length=160)
    organization_type: PartnershipOrganizationType
    contact_full_name: str = Field(min_length=2, max_length=120)
    contact_role: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=6, max_length=32)
    country: str = Field(min_length=2, max_length=80)
    website: str | None = Field(default=None, max_length=200)
    partnership_scope: PartnershipScope
    objectives: str = Field(min_length=20, max_length=4000)
    additional_notes: str | None = Field(default=None, max_length=4000)
    consent_contact: bool

    @field_validator(
        "organization_name",
        "contact_full_name",
        "contact_role",
        "phone",
        "country",
        "website",
        "objectives",
        "additional_notes",
        mode="before",
    )
    @classmethod
    def strip_partnership_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @model_validator(mode="after")
    def validate_partnership_payload(self) -> "PartnershipRequestCreate":
        if not self.consent_contact:
            raise ValueError("Le consentement de contact est requis.")
        return self


class PartnershipRequestResponse(BaseModel):
    id: str
    status: str
    message: str


class PlatformRole(str, Enum):
    STUDENT = "student"
    ADMIN = "admin"


class AuthUserProfile(BaseModel):
    user_id: str
    email: EmailStr | None = None
    full_name: str | None = None
    phone: str | None = None
    country: str | None = None
    role: PlatformRole = PlatformRole.STUDENT
    is_active: bool = True


class AuthSessionResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    expires_at: int | None = None
    token_type: str
    user: AuthUserProfile


class AuthSignUpResponse(BaseModel):
    status: Literal["ok", "pending_confirmation"]
    message: str
    session: AuthSessionResponse | None = None
    user: AuthUserProfile | None = None


class AuthSignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=120)
    phone: str | None = Field(default=None, min_length=7, max_length=32)
    country: str | None = Field(default=None, min_length=2, max_length=80)

    @field_validator("full_name", "country", mode="before")
    @classmethod
    def strip_auth_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_auth_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class AuthSignInRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class AuthForgotPasswordRequest(BaseModel):
    email: EmailStr


class AuthRefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=20, max_length=2048)


class AuthResetPasswordRequest(BaseModel):
    access_token: str = Field(min_length=20, max_length=4096)
    refresh_token: str = Field(min_length=20, max_length=4096)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("access_token", "refresh_token", mode="before")
    @classmethod
    def strip_reset_tokens(cls, value: str) -> str:
        return value.strip()


class AuthMessageResponse(BaseModel):
    message: str


class SSOAuthorizeRequest(BaseModel):
    client_id: str = Field(min_length=3, max_length=120)
    redirect_uri: str = Field(min_length=10, max_length=500)


class SSOAuthorizeResponse(BaseModel):
    code: str
    expires_in: int


class SSOExchangeRequest(BaseModel):
    code: str = Field(min_length=20, max_length=512)
    client_id: str = Field(min_length=3, max_length=120)
    client_secret: str = Field(min_length=16, max_length=512)
    redirect_uri: str = Field(min_length=10, max_length=500)


class AIMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)

    @field_validator("content", mode="before")
    @classmethod
    def strip_content(cls, value: str) -> str:
        return value.strip()


class AIChatRequest(BaseModel):
    page_path: str = Field(default="/", max_length=200)
    conversation_id: str | None = Field(default=None, max_length=80)
    messages: list[AIMessage] = Field(min_length=1, max_length=12)


class AIChatResponse(BaseModel):
    answer: str
    conversation_id: str | None = None
    suggested_actions: list[str] = []
    escalation_recommended: bool = False
    source: Literal["cohere", "ai_gateway", "fallback"]


class AIPageInsightResponse(BaseModel):
    title: str
    summary: str
    bullets: list[str]
    cta_label: str
    cta_href: str
    source: Literal["cohere", "ai_gateway", "fallback"]


class CommunityAIReplyRequest(BaseModel):
    message: str = Field(min_length=2, max_length=2000)
    thread_context: list[str] = Field(default_factory=list, max_length=6)

    @field_validator("message", mode="before")
    @classmethod
    def strip_community_message(cls, value: str) -> str:
        return value.strip()

    @field_validator("thread_context", mode="before")
    @classmethod
    def normalize_thread_context(cls, value: list[str] | None) -> list[str]:
        if not value:
            return []
        return [item.strip() for item in value if item and item.strip()]


class CommunityAIReplyResponse(BaseModel):
    reply: str
    source: Literal["cohere", "ai_gateway", "fallback"]


class CommunityProfileItem(BaseModel):
    id: str
    name: str
    tag: str
    country: str
    city: str
    bio: str
    avatar: str
    color: str
    followers: int = 0
    following: int = 0
    posts: int = 0
    tags: list[str] = Field(default_factory=list)
    is_official: bool = False
    is_ai: bool = False
    viewer_is_following: bool = False
    stage_label: str = "Membre PieHUB"
    activity_label: str = "Nouveau membre"
    last_active_label: str | None = None


class CommunityFollowResponse(BaseModel):
    profile: CommunityProfileItem
    current_profile: CommunityProfileItem | None = None
    is_following: bool


class CommunityPollOptionItem(BaseModel):
    text: str
    votes: int = 0


class CommunityCommentItem(BaseModel):
    id: int
    user_id: str
    text: str
    time: str
    likes: int = 0
    is_official: bool = False
    is_ai_generated: bool = False
    is_pinned: bool = False
    trust_label: str | None = None
    viewer_has_liked: bool = False
    viewer_can_edit: bool = False


class CommunityPostItem(BaseModel):
    id: int
    user_id: str
    post_type: Literal["text", "resource", "poll"]
    tag: str
    time: str
    likes: int = 0
    shares: int = 0
    content: str = ""
    resource_name: str | None = None
    resource_type: Literal["pdf", "doc"] | None = None
    resource_size: str | None = None
    resource_url: str | None = None
    resource_mime_type: str | None = None
    media_urls: list[str] = Field(default_factory=list)
    question: str | None = None
    options: list[CommunityPollOptionItem] = Field(default_factory=list)
    comments: list[CommunityCommentItem] = Field(default_factory=list)
    viewer_has_liked: bool = False
    viewer_has_saved: bool = False
    viewer_poll_vote: int | None = None
    group_id: str | None = None
    is_question: bool = False
    question_status: str | None = None
    answer_count: int = 0
    has_official_answer: bool = False
    official_answer_count: int = 0
    resolved_by_official: bool = False
    trust_label: str | None = None
    pinned_official_comment: CommunityCommentItem | None = None
    viewer_can_edit: bool = False


class CommunityStoryItem(BaseModel):
    id: str
    user_id: str
    content: str = ""
    media_url: str | None = None
    media_mime_type: str | None = None
    created_at: str
    expires_at: str
    viewer_can_delete: bool = False


class CommunityBootstrapResponse(BaseModel):
    current_profile_id: str | None = None
    profiles: list[CommunityProfileItem] = Field(default_factory=list)
    posts: list[CommunityPostItem] = Field(default_factory=list)
    groups: list["CommunityGroupItem"] = Field(default_factory=list)
    events_calendar: list["CommunityEventCalendarItem"] = Field(default_factory=list)
    notifications: list["CommunityNotificationItem"] = Field(default_factory=list)
    unread_notifications: int = 0
    ads: list["CommunityAdItem"] = Field(default_factory=list)
    stories: list[CommunityStoryItem] = Field(default_factory=list)


class CommunityPostCreateRequest(BaseModel):
    post_type: Literal["text", "resource", "poll"] = "text"
    tag: str = Field(min_length=2, max_length=40)
    content: str = Field(min_length=4, max_length=4000)
    resource_name: str | None = Field(default=None, max_length=160)
    resource_type: Literal["pdf", "doc"] | None = None
    resource_size: str | None = Field(default=None, max_length=40)
    resource_storage_path: str | None = Field(default=None, max_length=500)
    resource_url: str | None = Field(default=None, max_length=1000)
    resource_mime_type: str | None = Field(default=None, max_length=160)
    media_urls: list[str] = Field(default_factory=list, max_length=4)
    question: str | None = Field(default=None, max_length=300)
    options: list[str] = Field(default_factory=list, max_length=6)
    group_id: str | None = None
    is_question: bool = False

    @field_validator("tag", "content", "resource_name", "resource_size", "resource_storage_path", "resource_url", "resource_mime_type", "question", mode="before")
    @classmethod
    def strip_community_post_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("options", mode="before")
    @classmethod
    def normalize_community_options(cls, value: list[str] | None) -> list[str]:
        if not value:
            return []
        return [item.strip() for item in value if item and item.strip()]


class CommunityPostUpdateRequest(BaseModel):
    tag: str | None = Field(default=None, min_length=2, max_length=40)
    content: str | None = Field(default=None, min_length=4, max_length=4000)
    question: str | None = Field(default=None, max_length=300)

    @field_validator("tag", "content", "question", mode="before")
    @classmethod
    def strip_community_post_update(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else None


class CommunityCommentCreateRequest(BaseModel):
    text: str = Field(min_length=2, max_length=2000)

    @field_validator("text", mode="before")
    @classmethod
    def strip_community_comment(cls, value: str) -> str:
        return value.strip()


class CommunityCommentUpdateRequest(BaseModel):
    text: str = Field(min_length=2, max_length=2000)

    @field_validator("text", mode="before")
    @classmethod
    def strip_community_comment_update(cls, value: str) -> str:
        return value.strip()


class CommunityAssetItem(BaseModel):
    storage_path: str
    public_url: str
    filename: str
    mime_type: str
    size: int


class CommunityStoryCreateRequest(BaseModel):
    content: str = Field(default="", max_length=1000)
    media_storage_path: str | None = Field(default=None, max_length=500)
    media_url: str | None = Field(default=None, max_length=1000)
    media_mime_type: str | None = Field(default=None, max_length=160)

    @field_validator("content", "media_storage_path", "media_url", "media_mime_type", mode="before")
    @classmethod
    def strip_story_strings(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else None


class CommunityPollVoteRequest(BaseModel):
    option_index: int = Field(ge=0, le=20)


class CommunityMutationResponse(BaseModel):
    post: CommunityPostItem
    assistant_comment: CommunityCommentItem | None = None
    assistant_replied: bool = False


class CommunityAssistantMessageRequest(BaseModel):
    message: str = Field(min_length=2, max_length=4000)
    conversation_id: str | None = Field(default=None, max_length=80)

    @field_validator("message", mode="before")
    @classmethod
    def strip_community_assistant_message(cls, value: str) -> str:
        return value.strip()


class CommunityAssistantThreadMessageItem(BaseModel):
    id: str
    from_role: Literal["me", "them"]
    text: str
    time: str


class CommunityAssistantThreadResponse(BaseModel):
    conversation_id: str | None = None
    messages: list[CommunityAssistantThreadMessageItem] = Field(default_factory=list)
    source: Literal["cohere", "ai_gateway", "fallback"] | None = None




class CommunityDirectMessageCreateRequest(BaseModel):
    target_profile_id: str = Field(min_length=2, max_length=120)
    body: str = Field(min_length=1, max_length=2000)

    @field_validator("target_profile_id", "body", mode="before")
    @classmethod
    def strip_direct_message_fields(cls, value: str) -> str:
        return value.strip()


class CommunityDirectMessageItem(BaseModel):
    id: str
    from_role: Literal["me", "them"]
    text: str
    time: str
    read_at: str | None = None


class CommunityDirectThreadItem(BaseModel):
    id: str
    target_profile: CommunityProfileItem
    last_message: CommunityDirectMessageItem | None = None
    unread_count: int = 0
    updated_at: str


class CommunityDirectThreadResponse(BaseModel):
    thread: CommunityDirectThreadItem
    messages: list[CommunityDirectMessageItem] = Field(default_factory=list)


class CommunityDirectThreadListResponse(BaseModel):
    threads: list[CommunityDirectThreadItem] = Field(default_factory=list)

class StudentStepStatus(str, Enum):
    DONE = "done"
    CURRENT = "current"
    TODO = "todo"


class StudentDocumentStatus(str, Enum):
    APPROVED = "approved"
    REVIEW = "review"
    MISSING = "missing"
    REJECTED = "rejected"


class StudentEducationLevel(str, Enum):
    LYCEE = "lycee"
    UNIVERSITE = "universite"
    BTS = "bts"
    AUTRE = "autre"


class StudentGradingSystem(str, Enum):
    TRIMESTRE = "trimestre"
    SEMESTRE = "semestre"


class OnboardingStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    VALIDATED = "validated"
    REJECTED = "rejected"


class CandidateAssistantResourceItem(BaseModel):
    id: str | None = None
    title: str
    type: str | None = None
    access: Literal["free", "included", "premium_locked"] | None = None
    target_path: str | None = None
    summary: str | None = None


class CandidateAssistantChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=3000)
    context_source: str | None = Field(default="progressive_path", max_length=80)
    current_step_id: str | None = Field(default=None, max_length=80)
    conversation_id: str | None = Field(default=None, max_length=64)
    requested_action: str = Field(default="general_chat", max_length=80)
    document_id: str | None = Field(default=None, max_length=120)

    @field_validator("message", mode="before")
    @classmethod
    def strip_candidate_assistant_message(cls, value: str) -> str:
        return str(value).strip()


class CandidateAssistantChatResponse(BaseModel):
    answer: str
    conversation_id: str | None = None
    used_prompt: str | None = None
    used_context: dict[str, bool] = Field(default_factory=dict)
    rag: dict[str, Any] = Field(default_factory=dict)


class AssistantContextStudentV1(BaseModel):
    full_name: str | None = None
    country: str | None = None
    project_name: str | None = None
    status_label: str | None = None


class AssistantContextStepV1(BaseModel):
    id: str
    title: str
    order: int
    status: str
    short_description: str | None = None
    progress_percent: int | None = None


class AssistantContextDossierV1(BaseModel):
    case_reference: str | None = None
    project_name: str | None = None
    status_label: str | None = None
    next_action: str | None = None
    document_status_counts: dict[str, int] = Field(default_factory=dict)
    official_deposit_declared: bool = False
    official_deposit_status: str | None = None


class AssistantContextSnapshotV1(BaseModel):
    contract_version: Literal["pieagency.context.v1"] = "pieagency.context.v1"
    source: Literal["pieagency_private"] = "pieagency_private"
    requested_action: str = "general_chat"
    generated_at: str
    student: AssistantContextStudentV1
    current_step: AssistantContextStepV1 | None = None
    dossier: AssistantContextDossierV1 | None = None
    retrieval_hints: list[str] = Field(default_factory=list)


class ProgressivePathStepStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    NEEDS_REVIEW = "needs_review"
    COMPLETED = "completed"
    BLOCKED = "blocked"


class OfficialDepositPlatformType(str, Enum):
    CAMPUS_FRANCE = "campus_france"
    PRIVATE_SCHOOL = "private_school"
    PARCOURSUP = "parcoursup"
    BELGIUM = "belgium"
    VISA = "visa"
    OTHER = "other"


class OfficialDepositStatus(str, Enum):
    DECLARED = "declared"
    UNDER_REVIEW = "under_review"
    ACCEPTED = "accepted"
    REFUSED = "refused"
    WAITING = "waiting"
    OTHER = "other"


class DashboardMetric(BaseModel):
    label: str
    value: str
    detail: str
    tone: Literal["neutral", "good", "attention", "info"] = "neutral"


class StudentStepItem(BaseModel):
    title: str
    description: str
    status: StudentStepStatus
    due_label: str | None = None


class StudentDocumentItem(BaseModel):
    id: str = ""
    name: str
    status: StudentDocumentStatus
    note: str


class AddDocumentRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Le nom du document est requis.")
        return cleaned


class AddDocumentResponse(BaseModel):
    name: str
    status: Literal["approved", "review", "missing"]
    note: str


class AdminDocumentUpdateRequest(BaseModel):
    status: Literal["approved", "review", "missing", "rejected"]
    note: str = ""


class PrivateProfileResponse(BaseModel):
    education_level: StudentEducationLevel | None = None
    grading_system: StudentGradingSystem | None = None


class PrivateProfileUpdateRequest(BaseModel):
    education_level: StudentEducationLevel | None = None
    grading_system: StudentGradingSystem | None = None


class PrivateOnboardingStatusResponse(BaseModel):
    onboarding_status: OnboardingStatus = OnboardingStatus.NOT_STARTED


class AdminOnboardingStatusUpdateRequest(BaseModel):
    onboarding_status: OnboardingStatus


class StudentNoteItem(BaseModel):
    title: str
    content: str
    created_at_label: str


class StudentDashboardResponse(BaseModel):
    student_name: str
    case_reference: str
    project_name: str
    status_label: str
    progress_percent: int = Field(ge=0, le=100)
    completed_steps: int
    total_steps: int
    assigned_counselor: str
    next_action: str
    last_update_label: str
    metrics: list[DashboardMetric]
    steps: list[StudentStepItem]
    documents: list[StudentDocumentItem]
    notes: list[StudentNoteItem]


class ProgressivePathStepItem(BaseModel):
    id: str
    title: str
    order: int
    status: ProgressivePathStepStatus
    short_description: str
    is_current: bool
    is_locked: bool
    target_module: str | None = None
    target_path: str | None = None


class OfficialDepositItem(BaseModel):
    has_declared: bool = False
    platform_type: OfficialDepositPlatformType | None = None
    platform_name: str | None = None
    official_deposit_date: str | None = None
    official_reference: str | None = None
    status: OfficialDepositStatus | None = None
    comment: str | None = None


class OfficialDepositRequest(BaseModel):
    platform_type: OfficialDepositPlatformType
    platform_name: str | None = Field(default=None, max_length=160)
    official_deposit_date: str | None = Field(default=None, max_length=20)
    official_reference: str | None = Field(default=None, max_length=160)
    status: OfficialDepositStatus = OfficialDepositStatus.DECLARED
    comment: str | None = Field(default=None, max_length=1000)

    @field_validator(
        "platform_name",
        "official_deposit_date",
        "official_reference",
        "comment",
        mode="before",
    )
    @classmethod
    def strip_optional_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = str(value).strip()
        return cleaned or None


class ProgressivePathRecommendationAction(BaseModel):
    title: str
    description: str
    target_module: str
    target_path: str


class ProgressivePathProductRecommendation(ProgressivePathRecommendationAction):
    requires_purchase: bool = True


class ProgressivePathRecommendations(BaseModel):
    current_step_id: str | None = None
    free_action: ProgressivePathRecommendationAction | None = None
    recommended_product: ProgressivePathProductRecommendation | None = None
    assistant_action: ProgressivePathRecommendationAction | None = None
    document_action: ProgressivePathRecommendationAction | None = None


class ProgressivePathResponse(BaseModel):
    candidate_id: str
    current_step: ProgressivePathStepItem | None = None
    progress_percent: int = Field(ge=0, le=100)
    steps: list[ProgressivePathStepItem] = Field(default_factory=list)
    official_deposit: OfficialDepositItem = Field(default_factory=OfficialDepositItem)
    recommendations: ProgressivePathRecommendations = Field(
        default_factory=ProgressivePathRecommendations
    )


class PrivateProductItem(BaseModel):
    id: str
    title: str
    description: str
    category: str
    price: float
    currency: str = "EUR"
    target_audience: str
    what_you_get: list[str] = Field(default_factory=list)
    badge: Literal["recommended", "popular", "included"] | None = None
    service_slug: str
    included_resource_ids: list[str] = Field(default_factory=list)


class PrivateProductListResponse(BaseModel):
    products: list[PrivateProductItem]


class PrivateResourceVideoItem(BaseModel):
    id: str
    title: str
    url: str
    provider: Literal["youtube"] = "youtube"
    source_label: str | None = None


class PrivateResourceItem(BaseModel):
    id: str
    title: str
    description: str
    category: str
    resource_type: Literal["guide", "template", "video", "checklist", "example", "exercise", "link"]
    badge_label: str
    action_label: str = "Ouvrir"
    duration_label: str | None = None
    access_level: Literal["free", "student", "premium"] = "student"
    url: str | None = None
    video_url: str | None = None
    video_title: str | None = None
    video_provider: str | None = None
    sidebar_videos: list[PrivateResourceVideoItem] = Field(default_factory=list)


class PrivateResourceListResponse(BaseModel):
    resources: list[PrivateResourceItem]


class PrivateResourceSectionItem(BaseModel):
    id: str
    screen_number: int
    section_type: Literal[
        "preview",
        "paywall",
        "chapter",
        "timeline",
        "checklist",
        "mistakes",
        "video",
        "example",
        "exercise",
        "sources",
    ]
    title: str
    subtitle: str | None = None
    body: str | None = None
    items: list[str] = Field(default_factory=list)
    is_preview: bool = False
    is_locked: bool = False
    video_url: str | None = None
    video_title: str | None = None
    video_provider: str | None = None
    video_source_label: str | None = None


class PrivateResourceDetailResponse(BaseModel):
    id: str
    title: str
    slug: str
    description: str
    category: str
    resource_type: Literal["tunnel_guide"] = "tunnel_guide"
    access_mode: Literal["preview_free_then_paid"] = "preview_free_then_paid"
    badge_label: str = "Guide interactif"
    action_label: str = "Ouvrir"
    reading_minutes: int = 30
    current_screen: int = 1
    total_screens: int
    has_access: bool = False
    requires_payment: bool = True
    checkout_service_slug: str | None = None
    watermark_label: str
    sections: list[PrivateResourceSectionItem]


class PrivateProductAccessActivateRequest(BaseModel):
    cart_id: str = Field(min_length=3, max_length=200)
    service_slug: str | None = Field(default=None, max_length=80)


class PrivateProductAccessResponse(BaseModel):
    product_id: str
    service_slug: str
    included_resource_ids: list[str] = Field(default_factory=list)
    unlocked_resource_ids: list[str] = Field(default_factory=list)
    has_access: bool = False
    storage_ready: bool = True
    message: str

class PrivateSubscriptionPlanItem(BaseModel):
    id: str
    title: str
    description: str
    price: float
    currency: str = "EUR"
    billing_period: Literal["one_time", "monthly", "yearly"] = "monthly"
    features: list[str] = Field(default_factory=list)
    recommended: bool = False
    service_slug: str
    is_active: bool = True
    sort_order: int = 0


class PrivateSubscriptionListResponse(BaseModel):
    plans: list[PrivateSubscriptionPlanItem]


class CurrentSubscriptionResponse(BaseModel):
    current_plan_id: str | None = None
    plan: PrivateSubscriptionPlanItem | None = None


class SubscriptionPlanSelectRequest(BaseModel):
    plan_id: str | None = None


class SubscriptionPlanCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str = ""
    price: float = Field(default=0, ge=0)
    currency: str = "EUR"
    billing_period: Literal["one_time", "monthly", "yearly"] = "monthly"
    features: list[str] = Field(default_factory=list)
    recommended: bool = False
    service_slug: str = Field(min_length=1, max_length=160)
    is_active: bool = True
    sort_order: int = 0


class SubscriptionPlanUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = None
    price: float | None = Field(default=None, ge=0)
    currency: str | None = None
    billing_period: Literal["one_time", "monthly", "yearly"] | None = None
    features: list[str] | None = None
    recommended: bool | None = None
    service_slug: str | None = Field(default=None, min_length=1, max_length=160)
    is_active: bool | None = None
    sort_order: int | None = None


class StudentDocumentListResponse(BaseModel):
    documents: list[StudentDocumentItem]


class PrivateOnboardingSubmitRequest(BaseModel):
    data: dict[str, str] = Field(default_factory=dict)

    @field_validator("data")
    @classmethod
    def validate_onboarding_data(cls, value: dict[str, str]) -> dict[str, str]:
        cleaned = {
            str(key).strip(): str(item).strip()
            for key, item in value.items()
            if str(key).strip() and str(item).strip()
        }
        if not cleaned:
            raise ValueError("Les donnees d'onboarding sont requises.")
        return cleaned


class PrivateDiagnosticResponse(BaseModel):
    current_priority: str
    main_risk: str
    next_action: str
    recommended_products: list[str] = Field(default_factory=list)
    adapted_checklist: list[str] = Field(default_factory=list)


class AdminLeadItem(BaseModel):
    id: str
    full_name: str
    email: str | None = None
    phone: str | None = None
    country: str
    study_level: str
    target_project: str
    created_at_label: str


class AdminPartnershipItem(BaseModel):
    id: str
    organization_name: str
    organization_type: str
    contact_full_name: str
    contact_role: str
    email: str | None = None
    phone: str | None = None
    country: str
    partnership_scope: str
    status: str
    created_at_label: str


class AdminCaseItem(BaseModel):
    case_reference: str
    student_name: str
    track: str
    stage: str
    counselor: str
    progress_percent: int = Field(ge=0, le=100)
    priority: Literal["low", "medium", "high"]


class AdminTaskItem(BaseModel):
    title: str
    owner: str
    due_label: str
    status: Literal["todo", "in_progress", "done"]


class AdminConversationItem(BaseModel):
    conversation_id: str
    title: str
    user_label: str
    page_path: str
    message_count: int = Field(ge=0)
    status: str
    updated_at_label: str


class AdminPageItem(BaseModel):
    id: str
    title: str
    route_path: str
    audience: Literal["public", "student", "admin"]
    is_published: bool
    updated_at_label: str


class AdminPageUpdateRequest(BaseModel):
    is_published: bool
    audience: Literal["public", "student", "admin"]


class AdminCommunityPostItem(BaseModel):
    id: int
    author_name: str
    author_handle: str
    post_type: Literal["text", "resource", "poll"]
    tag: str
    excerpt: str
    likes_count: int = Field(ge=0)
    saves_count: int = Field(ge=0)
    comments_count: int = Field(ge=0)
    poll_votes_count: int = Field(ge=0)
    ai_reply_count: int = Field(ge=0)
    is_archived: bool
    created_at_label: str


class AdminCommunityCommentItem(BaseModel):
    id: int
    post_id: int
    author_name: str
    post_excerpt: str
    body: str
    likes_count: int = Field(ge=0)
    is_official: bool = False
    is_ai_generated: bool = False
    created_at_label: str


class AdminCommentModerationResponse(BaseModel):
    id: int
    status: str
    message: str


class ChatMessageItem(BaseModel):
    id: str
    sender_role: Literal["user", "assistant", "admin"]
    body: str
    model_source: str | None = None
    created_at_label: str


class AdminConversationDetailResponse(BaseModel):
    conversation: AdminConversationItem
    messages: list[ChatMessageItem]


class AdminExportCatalogItem(BaseModel):
    key: str
    label: str
    row_count: int | None = None


class AdminDashboardResponse(BaseModel):
    metrics: list[DashboardMetric]
    recent_leads: list[AdminLeadItem]
    recent_partnerships: list[AdminPartnershipItem] = Field(default_factory=list)
    active_cases: list[AdminCaseItem]
    tasks: list[AdminTaskItem]
    recent_chats: list[AdminConversationItem]
    managed_pages: list[AdminPageItem]
    community_posts: list[AdminCommunityPostItem] = Field(default_factory=list)
    community_comments: list[AdminCommunityCommentItem] = Field(default_factory=list)


class AdminCandidateItem(BaseModel):
    id: str
    full_name: str
    email: str | None = None
    phone: str | None = None
    country: str
    procedure: str
    stage: str
    subscription: str
    status: str
    onboarding_status: OnboardingStatus | None = None
    progress_percent: int = Field(ge=0, le=100)
    created_at_label: str
    source: Literal["case", "lead", "profile"]


class AdminCandidatesResponse(BaseModel):
    candidates: list[AdminCandidateItem]


class CommunityGroupItem(BaseModel):
    id: int
    name: str
    description: str = ""
    icon: str = "👥"
    category: str = "general"
    member_count: int = 0
    is_official: bool = False
    is_member: bool = False
    viewer_role: Literal["owner", "moderator", "member"] | None = None
    created_by_profile_id: str | None = None
    created_at: str = ""


class CommunityGroupCreateRequest(BaseModel):
    name: str = Field(min_length=3, max_length=80)
    description: str = Field(min_length=4, max_length=400)
    icon: str = Field(default="👥", min_length=1, max_length=8)
    category: str = Field(default="general", min_length=2, max_length=40)

    @field_validator("name", "description", "icon", "category", mode="before")
    @classmethod
    def strip_group_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None


class CommunityGroupMembershipResponse(BaseModel):
    group: CommunityGroupItem
    is_member: bool


class CommunityGroupMemberItem(BaseModel):
    profile: CommunityProfileItem
    role: Literal["owner", "moderator", "member"] = "member"
    joined_at: str = ""


class CommunityGroupMemberRoleRequest(BaseModel):
    role: Literal["moderator", "member"]


class CommunityBlockResponse(BaseModel):
    target_profile_id: str
    is_blocked: bool


class CommunityBlockListResponse(BaseModel):
    blocked_profile_ids: list[str] = Field(default_factory=list)


class CommunityEventCalendarItem(BaseModel):
    id: int
    name: str
    description: str = ""
    event_date: str
    event_time: str = ""
    location_type: str = "online"
    location_detail: str = ""
    attendee_count: int = 0
    is_official: bool = False
    is_attending: bool = False
    created_by_profile_id: str | None = None
    created_at: str = ""


class CommunityEventCreateRequest(BaseModel):
    name: str = Field(min_length=4, max_length=160)
    description: str = Field(min_length=4, max_length=1000)
    event_date: str = Field(min_length=10, max_length=10)
    event_time: str = Field(default="", max_length=20)
    location_type: str = Field(default="online", max_length=20)
    location_detail: str = Field(default="", max_length=200)

    @field_validator("name", "description", "event_date", "event_time", "location_detail", mode="before")
    @classmethod
    def strip_event_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None


class CommunityEventAttendanceResponse(BaseModel):
    event: CommunityEventCalendarItem
    is_attending: bool


class CommunityNotificationItem(BaseModel):
    id: str
    type: str
    title: str
    body: str
    is_read: bool = False
    created_at: str = ""


class CommunityNotificationsResponse(BaseModel):
    notifications: list[CommunityNotificationItem] = Field(default_factory=list)
    unread_count: int = 0


class CommunityAdItem(BaseModel):
    id: int
    title: str
    body: str = ""
    image_url: str | None = None
    cta_label: str = "En savoir plus"
    cta_url: str = ""
    category: str = "general"
    moderation_status: str = "pending"
    created_by_profile_id: str | None = None
    created_at: str = ""
    is_own: bool = False


class CommunityAdCreateRequest(BaseModel):
    title: str = Field(min_length=4, max_length=120)
    body: str = Field(min_length=8, max_length=1200)
    image_url: str | None = Field(default=None, max_length=500)
    cta_label: str = Field(default="En savoir plus", max_length=60)
    cta_url: str = Field(default="", max_length=300)
    category: str = Field(default="general", max_length=40)

    @field_validator("title", "body", "cta_label", "cta_url", "category", mode="before")
    @classmethod
    def strip_ad_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None


class CommunityAdsResponse(BaseModel):
    ads: list[CommunityAdItem] = Field(default_factory=list)
    pending_count: int = 0


class CommunityReportCreateRequest(BaseModel):
    target_type: str = Field(pattern="^(post|comment|ad|profile)$")
    target_id: str = Field(min_length=1, max_length=80)
    reason: str = Field(default="contenu_inapproprie", max_length=80)
    details: str | None = Field(default=None, max_length=1000)

    @field_validator("target_type", "target_id", "reason", "details", mode="before")
    @classmethod
    def strip_report_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None


class CommunityReportItem(BaseModel):
    id: str
    target_type: str
    target_id: str
    reason: str
    details: str | None = None
    status: str = "pending"
    created_by_profile_id: str | None = None
    created_at: str = ""


class CommunityReportResponse(BaseModel):
    report: CommunityReportItem
    message: str = "Signalement reçu."


class CommunityModerationQueueResponse(BaseModel):
    reports: list[CommunityReportItem] = Field(default_factory=list)
    pending_count: int = 0


class CommunityModerationResolveRequest(BaseModel):
    status: str = Field(pattern="^(reviewed|resolved|rejected|archived)$")
    admin_note: str | None = Field(default=None, max_length=1000)

    @field_validator("status", "admin_note", mode="before")
    @classmethod
    def strip_moderation_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None


class CommunityAIRewriteRequest(BaseModel):
    text: str = Field(min_length=4, max_length=2000)
    context: str = Field(default="publication", max_length=60)

    @field_validator("text", "context", mode="before")
    @classmethod
    def strip_rewrite_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None


class CommunityAIRewriteResponse(BaseModel):
    rewritten: str
    source: Literal["cohere", "ai_gateway", "fallback"]
