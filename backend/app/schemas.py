from datetime import date, time
from enum import Enum
from typing import Literal

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
    has_baccalaureate: bool
    baccalaureate_year: int | None = Field(default=None, ge=1950, le=2100)
    high_school_year_count: int | None = Field(default=None, ge=1, le=10)
    repeated_high_school_class: bool | None = None
    baccalaureate_average: str | None = Field(default=None, max_length=40)
    baccalaureate_track: str | None = Field(default=None, max_length=160)
    has_licence: bool
    licence_year: int | None = Field(default=None, ge=1950, le=2100)
    repeated_licence_class: bool | None = None
    licence_year_count: int | None = Field(default=None, ge=1, le=12)
    licence_average: str | None = Field(default=None, max_length=40)
    licence_field: str | None = Field(default=None, max_length=200)
    has_master: bool
    study_level: StudyLevel
    target_project: TargetProject
    immigration_attempt_count: int = Field(ge=0, le=20)
    school_type: SchoolType
    current_activity: str = Field(min_length=4, max_length=500)
    france_motivation: str = Field(min_length=20, max_length=4000)
    funding_source: str = Field(min_length=2, max_length=160)
    assistance_preference: AssistancePreference
    consultation_date: date
    consultation_time: time
    referrer_name: str = Field(min_length=2, max_length=160)
    can_invest: bool
    consent_resources: bool
    message: str = Field(min_length=20, max_length=4000)

    @field_validator(
        "first_name",
        "last_name",
        "phone_country_code",
        "phone",
        "country",
        "baccalaureate_average",
        "baccalaureate_track",
        "licence_average",
        "licence_field",
        "current_activity",
        "france_motivation",
        "funding_source",
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
        if not self.consent_resources:
            raise ValueError("Le consentement pour recevoir les ressources est requis.")
        if self.has_baccalaureate:
            if self.baccalaureate_year is None:
                raise ValueError("L'annee du bac est requise.")
            if self.high_school_year_count is None:
                raise ValueError("Le nombre d'annees au lycee est requis.")
            if self.repeated_high_school_class is None:
                raise ValueError("Le redoublement au lycee doit etre precise.")
            if not self.baccalaureate_average:
                raise ValueError("La moyenne du bac est requise.")
            if not self.baccalaureate_track:
                raise ValueError("La filiere du bac est requise.")
        if self.has_licence:
            if self.licence_year is None:
                raise ValueError("L'annee de licence est requise.")
            if self.repeated_licence_class is None:
                raise ValueError("Le redoublement en licence doit etre precise.")
            if self.licence_year_count is None:
                raise ValueError("Le nombre d'annees en licence est requis.")
            if not self.licence_average:
                raise ValueError("La moyenne de licence est requise.")
            if not self.licence_field:
                raise ValueError("La filiere de licence est requise.")
        return self

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def formatted_message(self) -> str:
        bac_status = "Oui" if self.has_baccalaureate else "Non"
        licence_status = "Oui" if self.has_licence else "Non"
        master_status = "Oui" if self.has_master else "Non"
        high_school_repeat = (
            "Oui" if self.repeated_high_school_class else "Non"
            if self.repeated_high_school_class is not None
            else "Non precise"
        )
        licence_repeat = (
            "Oui" if self.repeated_licence_class else "Non"
            if self.repeated_licence_class is not None
            else "Non precise"
        )

        lines = [
            "Profil academique",
            f"- Bac obtenu: {bac_status}",
            f"- Annee du bac: {self.baccalaureate_year or 'Non renseignee'}",
            f"- Annees au lycee: {self.high_school_year_count or 'Non renseigne'}",
            f"- Redoublement au lycee: {high_school_repeat}",
            f"- Moyenne du bac: {self.baccalaureate_average or 'Non renseignee'}",
            f"- Filiere du bac: {self.baccalaureate_track or 'Non renseignee'}",
            f"- Licence obtenue: {licence_status}",
            f"- Annee de licence: {self.licence_year or 'Non renseignee'}",
            f"- Redoublement en licence: {licence_repeat}",
            f"- Annees en licence: {self.licence_year_count or 'Non renseigne'}",
            f"- Moyenne de licence: {self.licence_average or 'Non renseignee'}",
            f"- Filiere de licence: {self.licence_field or 'Non renseignee'}",
            f"- Master obtenu: {master_status}",
            "",
            "Situation actuelle",
            self.current_activity,
            "",
            "Pourquoi la France",
            self.france_motivation,
            "",
            "Blocages ou precisions complementaires",
            self.message,
        ]

        return "\n".join(lines)


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


class AuthRefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=20, max_length=2048)


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
    source: Literal["cohere", "fallback"]


class AIPageInsightResponse(BaseModel):
    title: str
    summary: str
    bullets: list[str]
    cta_label: str
    cta_href: str
    source: Literal["cohere", "fallback"]


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
    source: Literal["cohere", "fallback"]


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
    question: str | None = None
    options: list[CommunityPollOptionItem] = Field(default_factory=list)
    comments: list[CommunityCommentItem] = Field(default_factory=list)
    viewer_has_liked: bool = False
    viewer_has_saved: bool = False
    viewer_poll_vote: int | None = None
    group_id: str | None = None


class CommunityBootstrapResponse(BaseModel):
    current_profile_id: str | None = None
    profiles: list[CommunityProfileItem] = Field(default_factory=list)
    posts: list[CommunityPostItem] = Field(default_factory=list)
    groups: list["CommunityGroupItem"] = Field(default_factory=list)
    events_calendar: list["CommunityEventCalendarItem"] = Field(default_factory=list)
    notifications: list["CommunityNotificationItem"] = Field(default_factory=list)
    unread_notifications: int = 0
    ads: list["CommunityAdItem"] = Field(default_factory=list)


class CommunityPostCreateRequest(BaseModel):
    post_type: Literal["text", "resource", "poll"] = "text"
    tag: str = Field(min_length=2, max_length=40)
    content: str = Field(min_length=4, max_length=4000)
    resource_name: str | None = Field(default=None, max_length=160)
    resource_type: Literal["pdf", "doc"] | None = None
    resource_size: str | None = Field(default=None, max_length=40)
    question: str | None = Field(default=None, max_length=300)
    options: list[str] = Field(default_factory=list, max_length=6)
    group_id: str | None = None

    @field_validator("tag", "content", "resource_name", "resource_size", "question", mode="before")
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


class CommunityCommentCreateRequest(BaseModel):
    text: str = Field(min_length=2, max_length=2000)

    @field_validator("text", mode="before")
    @classmethod
    def strip_community_comment(cls, value: str) -> str:
        return value.strip()


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
    source: Literal["cohere", "fallback"] | None = None


class StudentStepStatus(str, Enum):
    DONE = "done"
    CURRENT = "current"
    TODO = "todo"


class StudentDocumentStatus(str, Enum):
    APPROVED = "approved"
    REVIEW = "review"
    MISSING = "missing"


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
    name: str
    status: StudentDocumentStatus
    note: str


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


class CommunityGroupItem(BaseModel):
    id: int
    name: str
    description: str = ""
    icon: str = "👥"
    category: str = "general"
    member_count: int = 0
    is_official: bool = False
    is_member: bool = False
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
    source: Literal["cohere", "fallback"]
