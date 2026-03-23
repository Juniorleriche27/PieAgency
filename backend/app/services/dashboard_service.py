from datetime import datetime, timezone

from ..config import settings
from ..schemas import (
    AdminCaseItem,
    AdminCommunityCommentItem,
    AdminCommunityPostItem,
    AdminConversationItem,
    AdminDashboardResponse,
    AdminLeadItem,
    AdminPageItem,
    AdminPartnershipItem,
    AdminTaskItem,
    AuthUserProfile,
    DashboardMetric,
    StudentDashboardResponse,
    StudentDocumentItem,
    StudentDocumentStatus,
    StudentNoteItem,
    StudentStepItem,
    StudentStepStatus,
)
from .supabase_service import SupabaseConfigurationError, get_supabase_client


def _client_or_none(access_token: str | None = None):
    try:
        return get_supabase_client(access_token)
    except SupabaseConfigurationError:
        return None


def _format_datetime_label(raw_value: str | None) -> str:
    if not raw_value:
        return "A l'instant"

    normalized = raw_value.replace("Z", "+00:00")
    try:
        value = datetime.fromisoformat(normalized)
    except ValueError:
        return raw_value

    value = value.astimezone(timezone.utc)
    now = datetime.now(timezone.utc)
    delta = now - value

    if delta.days >= 1:
        return value.strftime("%d/%m/%Y %H:%M")
    if delta.seconds >= 3600:
        return f"Il y a {delta.seconds // 3600} h"
    if delta.seconds >= 60:
        return f"Il y a {delta.seconds // 60} min"
    return "A l'instant"


def _format_due_label(raw_value: str | None) -> str | None:
    if not raw_value:
        return None

    normalized = raw_value.replace("Z", "+00:00")
    try:
        value = datetime.fromisoformat(normalized)
    except ValueError:
        return raw_value

    return value.astimezone(timezone.utc).strftime("Echeance %d/%m/%Y")


def _normalize_step_status(value: str | None) -> StudentStepStatus:
    normalized = (value or "").strip().lower()
    if normalized in {"done", "completed", "complete"}:
        return StudentStepStatus.DONE
    if normalized in {"current", "in_progress", "review"}:
        return StudentStepStatus.CURRENT
    return StudentStepStatus.TODO


def _normalize_document_status(value: str | None) -> StudentDocumentStatus:
    normalized = (value or "").strip().lower()
    if normalized in {"approved", "done", "valid"}:
        return StudentDocumentStatus.APPROVED
    if normalized in {"review", "pending", "current"}:
        return StudentDocumentStatus.REVIEW
    return StudentDocumentStatus.MISSING


def _normalize_task_status(value: str | None) -> str:
    normalized = (value or "").strip().lower()
    if normalized in {"done", "completed"}:
        return "done"
    if normalized in {"in_progress", "current", "review"}:
        return "in_progress"
    return "todo"


def _normalize_audience(value: str | None) -> str:
    normalized = (value or "").strip().lower()
    if normalized in {"student", "admin"}:
        return normalized
    return "public"


def _truncate_text(value: str | None, length: int = 120) -> str:
    text = str(value or "").strip()
    if len(text) <= length:
        return text
    return f"{text[: length - 3].rstrip()}..."


def _labelize_case_status(value: str | None) -> str:
    mapping = {
        "new": "Nouveau dossier",
        "qualified": "Qualification effectuee",
        "in_progress": "Suivi actif",
        "submitted": "Soumis",
        "interview": "Entretien a preparer",
        "visa": "Procedure visa",
        "completed": "Clos",
    }
    normalized = (value or "").strip().lower()
    return mapping.get(normalized, "Suivi actif")


def _pick_student_name(current_user: AuthUserProfile) -> str:
    if current_user.full_name:
        return current_user.full_name
    if current_user.email:
        return current_user.email.split("@")[0]
    return "Etudiant PieAgency"


def _empty_student_dashboard(current_user: AuthUserProfile) -> StudentDashboardResponse:
    metrics = [
        DashboardMetric(
            label="Progression",
            value="0%",
            detail="Aucun dossier rattache pour le moment",
            tone="neutral",
        ),
        DashboardMetric(
            label="Compte",
            value="Actif",
            detail="Votre espace est pret",
            tone="good",
        ),
        DashboardMetric(
            label="Projet",
            value="A qualifier",
            detail="PieAgency doit encore rattacher votre procedure",
            tone="info",
        ),
        DashboardMetric(
            label="Prochaine action",
            value="Contacter un conseiller",
            detail="Demandez le rattachement du dossier a votre compte",
            tone="attention",
        ),
    ]

    notes = [
        StudentNoteItem(
            title="Compte cree",
            content="Votre espace est actif, mais aucun dossier n'est encore relie a ce compte. Un conseiller peut rattacher votre procedure apres verification.",
            created_at_label="Maintenant",
        )
    ]

    return StudentDashboardResponse(
        student_name=_pick_student_name(current_user),
        case_reference="En qualification",
        project_name="Aucun dossier actif",
        status_label="Compte actif",
        progress_percent=0,
        completed_steps=0,
        total_steps=0,
        assigned_counselor="A definir",
        next_action="Contactez PieAgency ou envoyez votre reference de dossier pour le rattachement.",
        last_update_label="Aucune donnee de dossier",
        metrics=metrics,
        steps=[],
        documents=[],
        notes=notes,
    )


def get_student_dashboard(
    current_user: AuthUserProfile,
    access_token: str | None = None,
) -> StudentDashboardResponse:
    client = _client_or_none(access_token)
    if client is None:
        return _empty_student_dashboard(current_user)

    try:
        case_response = (
            client.table("student_cases")
            .select(
                "id,public_reference,target_project,status,assigned_counselor,progress_percent,next_action,updated_at",
            )
            .eq("student_user_id", current_user.user_id)
            .order("updated_at", desc=True)
            .limit(1)
            .execute()
        )
    except Exception:
        return _empty_student_dashboard(current_user)
    case_rows = case_response.data or []
    if not case_rows:
        return _empty_student_dashboard(current_user)

    case_row = case_rows[0]
    case_id = str(case_row.get("id", ""))

    try:
        step_response = (
            client.table("case_steps")
            .select("title,description,status,due_at,position")
            .eq("case_id", case_id)
            .order("position")
            .execute()
        )
    except Exception:
        step_response = type("Response", (), {"data": []})()
    steps = [
        StudentStepItem(
            title=str(item.get("title", "Etape")),
            description=str(item.get("description", "")),
            status=_normalize_step_status(item.get("status")),
            due_label=_format_due_label(item.get("due_at")),
        )
        for item in (step_response.data or [])
    ]

    try:
        document_response = (
            client.table("case_documents")
            .select("name,status,note")
            .eq("case_id", case_id)
            .order("created_at")
            .execute()
        )
    except Exception:
        document_response = type("Response", (), {"data": []})()
    documents = [
        StudentDocumentItem(
            name=str(item.get("name", "Document")),
            status=_normalize_document_status(item.get("status")),
            note=str(item.get("note") or "Aucun commentaire pour le moment."),
        )
        for item in (document_response.data or [])
    ]

    try:
        note_response = (
            client.table("case_notes")
            .select("body,created_at")
            .eq("case_id", case_id)
            .eq("visibility", "student")
            .order("created_at", desc=True)
            .limit(6)
            .execute()
        )
    except Exception:
        note_response = type("Response", (), {"data": []})()
    notes = [
        StudentNoteItem(
            title="Note PieAgency",
            content=str(item.get("body", "")),
            created_at_label=_format_datetime_label(item.get("created_at")),
        )
        for item in (note_response.data or [])
        if str(item.get("body", "")).strip()
    ]

    completed_steps = len([step for step in steps if step.status == StudentStepStatus.DONE])
    total_steps = len(steps)
    raw_progress = int(case_row.get("progress_percent") or 0)
    progress_percent = raw_progress
    if total_steps:
        progress_percent = raw_progress or int((completed_steps / total_steps) * 100)

    next_action = str(
        case_row.get("next_action")
        or (
            "Suivre les prochaines etapes indiquees dans votre tableau de bord."
            if total_steps
            else "Attendre la prochaine mise a jour PieAgency."
        ),
    )

    metrics = [
        DashboardMetric(
            label="Progression",
            value=f"{progress_percent}%",
            detail=f"{completed_steps} etapes validees sur {total_steps}" if total_steps else "Aucune etape visible",
            tone="good" if progress_percent >= 50 else "info",
        ),
        DashboardMetric(
            label="Projet",
            value=str(case_row.get("target_project") or "Procedure"),
            detail=_labelize_case_status(case_row.get("status")),
            tone="info",
        ),
        DashboardMetric(
            label="Conseiller",
            value=str(case_row.get("assigned_counselor") or "A definir"),
            detail="Interlocuteur principal PieAgency",
            tone="neutral",
        ),
        DashboardMetric(
            label="Prochaine action",
            value=next_action[:30] + ("..." if len(next_action) > 30 else ""),
            detail=next_action,
            tone="attention",
        ),
    ]

    return StudentDashboardResponse(
        student_name=_pick_student_name(current_user),
        case_reference=str(case_row.get("public_reference") or "Dossier actif"),
        project_name=str(case_row.get("target_project") or "Procedure"),
        status_label=_labelize_case_status(case_row.get("status")),
        progress_percent=progress_percent,
        completed_steps=completed_steps,
        total_steps=total_steps,
        assigned_counselor=str(case_row.get("assigned_counselor") or "A definir"),
        next_action=next_action,
        last_update_label=_format_datetime_label(case_row.get("updated_at")),
        metrics=metrics,
        steps=steps,
        documents=documents,
        notes=notes,
    )


def _load_recent_leads(limit: int = 8) -> tuple[list[AdminLeadItem], int]:
    client = _client_or_none()
    if client is None:
        return [], 0

    try:
        response = (
            client.table(settings.supabase_contact_table)
            .select(
                "id,full_name,email,phone,country,study_level,target_project,created_at",
                count="exact",
            )
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
    except Exception:
        return [], 0
    data = response.data or []
    total = getattr(response, "count", None) or len(data)
    leads = [
        AdminLeadItem(
            id=str(item.get("id", "")),
            full_name=str(item.get("full_name", "Sans nom")),
            email=item.get("email"),
            phone=item.get("phone"),
            country=str(item.get("country", "Inconnu")),
            study_level=str(item.get("study_level", "Inconnu")),
            target_project=str(item.get("target_project", "Inconnu")),
            created_at_label=_format_datetime_label(item.get("created_at")),
        )
        for item in data
    ]
    return leads, int(total)


def _load_recent_partnerships(limit: int = 6) -> tuple[list[AdminPartnershipItem], int]:
    client = _client_or_none()
    if client is None:
        return [], 0

    try:
        response = (
            client.table("partnership_requests")
            .select(
                "id,organization_name,organization_type,contact_full_name,contact_role,email,phone,country,partnership_scope,status,created_at",
                count="exact",
            )
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
    except Exception:
        return [], 0

    data = response.data or []
    total = getattr(response, "count", None) or len(data)
    items = [
        AdminPartnershipItem(
            id=str(item.get("id", "")),
            organization_name=str(item.get("organization_name") or "Partenaire"),
            organization_type=str(item.get("organization_type") or "Autre"),
            contact_full_name=str(item.get("contact_full_name") or "Contact"),
            contact_role=str(item.get("contact_role") or "Responsable"),
            email=item.get("email"),
            phone=item.get("phone"),
            country=str(item.get("country") or "Inconnu"),
            partnership_scope=str(item.get("partnership_scope") or "Autre"),
            status=str(item.get("status") or "new"),
            created_at_label=_format_datetime_label(item.get("created_at")),
        )
        for item in data
    ]
    return items, int(total)


def _load_active_cases(limit: int = 6, access_token: str | None = None) -> list[AdminCaseItem]:
    client = _client_or_none(access_token)
    if client is None:
        return []

    try:
        response = (
            client.table("student_cases")
            .select(
                "id,student_id,public_reference,target_project,status,assigned_counselor,progress_percent,updated_at",
            )
            .order("updated_at", desc=True)
            .limit(limit)
            .execute()
        )
    except Exception:
        return []
    rows = response.data or []
    student_ids = [str(item.get("student_id")) for item in rows if item.get("student_id")]

    students_map: dict[str, str] = {}
    if student_ids:
        try:
            student_response = (
                client.table("students")
                .select("id,full_name")
                .in_("id", student_ids)
                .execute()
            )
            students_map = {
                str(item.get("id", "")): str(item.get("full_name", "Etudiant"))
                for item in (student_response.data or [])
            }
        except Exception:
            students_map = {}

    cases: list[AdminCaseItem] = []
    for row in rows:
        progress_percent = int(row.get("progress_percent") or 0)
        priority = "low"
        status_value = str(row.get("status") or "").lower()
        if progress_percent < 35 or status_value in {"new", "blocked"}:
            priority = "high"
        elif progress_percent < 70:
            priority = "medium"

        cases.append(
            AdminCaseItem(
                case_reference=str(row.get("public_reference") or "Dossier"),
                student_name=students_map.get(str(row.get("student_id")), "Etudiant"),
                track=str(row.get("target_project") or "Procedure"),
                stage=_labelize_case_status(row.get("status")),
                counselor=str(row.get("assigned_counselor") or "A definir"),
                progress_percent=progress_percent,
                priority=priority,
            ),
        )

    return cases


def _load_admin_tasks(limit: int = 8, access_token: str | None = None) -> list[AdminTaskItem]:
    client = _client_or_none(access_token)
    if client is None:
        return []

    try:
        response = (
            client.table("admin_tasks")
            .select("title,owner,status,due_at")
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
    except Exception:
        return []
    return [
        AdminTaskItem(
            title=str(item.get("title", "Tache")),
            owner=str(item.get("owner") or "Equipe admin"),
            due_label=_format_due_label(item.get("due_at")) or "Sans date",
            status=_normalize_task_status(item.get("status")),
        )
        for item in (response.data or [])
    ]


def _load_recent_chats(limit: int = 6, access_token: str | None = None) -> list[AdminConversationItem]:
    client = _client_or_none(access_token)
    if client is None:
        return []

    try:
        conversation_response = (
            client.table("chat_conversations")
            .select("id,user_id,page_path,title,status,updated_at")
            .order("updated_at", desc=True)
            .limit(limit)
            .execute()
        )
    except Exception:
        return []
    rows = conversation_response.data or []
    if not rows:
        return []

    conversation_ids = [str(item.get("id")) for item in rows if item.get("id")]
    user_ids = [str(item.get("user_id")) for item in rows if item.get("user_id")]

    profile_map: dict[str, str] = {}
    if user_ids:
        try:
            profile_response = (
                client.table("profiles")
                .select("user_id,full_name,email")
                .in_("user_id", user_ids)
                .execute()
            )
            profile_map = {
                str(item.get("user_id", "")): str(
                    item.get("full_name") or item.get("email") or "Utilisateur"
                )
                for item in (profile_response.data or [])
            }
        except Exception:
            profile_map = {}

    message_counts: dict[str, int] = {conversation_id: 0 for conversation_id in conversation_ids}
    try:
        message_response = (
            client.table("chat_messages")
            .select("conversation_id")
            .in_("conversation_id", conversation_ids)
            .execute()
        )
        for item in (message_response.data or []):
            conversation_id = str(item.get("conversation_id") or "")
            if conversation_id:
                message_counts[conversation_id] = message_counts.get(conversation_id, 0) + 1
    except Exception:
        pass

    return [
        AdminConversationItem(
            conversation_id=str(item.get("id", "")),
            title=str(item.get("title") or "Conversation chatbot"),
            user_label=profile_map.get(
                str(item.get("user_id")),
                "Visiteur anonyme" if not item.get("user_id") else "Utilisateur",
            ),
            page_path=str(item.get("page_path") or "/"),
            message_count=message_counts.get(str(item.get("id")), 0),
            status=str(item.get("status") or "open"),
            updated_at_label=_format_datetime_label(item.get("updated_at")),
        )
        for item in rows
    ]


def _load_managed_pages(limit: int = 8, access_token: str | None = None) -> list[AdminPageItem]:
    client = _client_or_none(access_token)
    if client is None:
        return []

    try:
        response = (
            client.table("site_pages")
            .select("id,title,route_path,audience,is_published,updated_at")
            .order("updated_at", desc=True)
            .limit(limit)
            .execute()
        )
    except Exception:
        return []
    return [
        AdminPageItem(
            id=str(item.get("id", "")),
            title=str(item.get("title") or "Page"),
            route_path=str(item.get("route_path") or "/"),
            audience=_normalize_audience(item.get("audience")),
            is_published=bool(item.get("is_published", False)),
            updated_at_label=_format_datetime_label(item.get("updated_at")),
        )
        for item in (response.data or [])
    ]


def _load_recent_community_posts(
    limit: int = 8,
    access_token: str | None = None,
) -> list[AdminCommunityPostItem]:
    client = _client_or_none(access_token)
    if client is None:
        return []

    try:
        response = (
            client.table("community_posts")
            .select(
                "id,author_profile_id,post_type,tag,content,resource_name,poll_question,is_archived,likes_count,created_at",
            )
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
    except Exception:
        return []

    rows = response.data or []
    if not rows:
        return []

    post_ids = [int(item.get("id") or 0) for item in rows if item.get("id") is not None]
    profile_ids = [str(item.get("author_profile_id")) for item in rows if item.get("author_profile_id")]

    profile_map: dict[str, tuple[str, str]] = {}
    if profile_ids:
        try:
            profile_response = (
                client.table("community_profiles")
                .select("id,display_name,handle")
                .in_("id", profile_ids)
                .execute()
            )
            profile_map = {
                str(item.get("id", "")): (
                    str(item.get("display_name") or "Membre PieHUB"),
                    str(item.get("handle") or "@piehub_member"),
                )
                for item in (profile_response.data or [])
            }
        except Exception:
            profile_map = {}

    save_counts = {post_id: 0 for post_id in post_ids}
    comments_count = {post_id: 0 for post_id in post_ids}
    poll_vote_counts = {post_id: 0 for post_id in post_ids}
    ai_reply_counts = {post_id: 0 for post_id in post_ids}

    if post_ids:
        try:
            reaction_response = (
                client.table("community_post_reactions")
                .select("post_id,reaction_kind")
                .in_("post_id", post_ids)
                .eq("reaction_kind", "save")
                .execute()
            )
            for item in (reaction_response.data or []):
                post_id = int(item.get("post_id") or 0)
                if post_id:
                    save_counts[post_id] = save_counts.get(post_id, 0) + 1
        except Exception:
            pass

        try:
            comment_response = (
                client.table("community_comments")
                .select("post_id,is_ai_generated")
                .in_("post_id", post_ids)
                .execute()
            )
            for item in (comment_response.data or []):
                post_id = int(item.get("post_id") or 0)
                if not post_id:
                    continue
                comments_count[post_id] = comments_count.get(post_id, 0) + 1
                if bool(item.get("is_ai_generated", False)):
                    ai_reply_counts[post_id] = ai_reply_counts.get(post_id, 0) + 1
        except Exception:
            pass

        try:
            vote_response = (
                client.table("community_poll_votes")
                .select("post_id")
                .in_("post_id", post_ids)
                .execute()
            )
            for item in (vote_response.data or []):
                post_id = int(item.get("post_id") or 0)
                if post_id:
                    poll_vote_counts[post_id] = poll_vote_counts.get(post_id, 0) + 1
        except Exception:
            pass

    items: list[AdminCommunityPostItem] = []
    for row in rows:
        post_id = int(row.get("id") or 0)
        author_name, author_handle = profile_map.get(
            str(row.get("author_profile_id") or ""),
            ("Membre PieHUB", "@piehub_member"),
        )
        excerpt_source = (
            row.get("content")
            or row.get("poll_question")
            or row.get("resource_name")
            or "Publication PieHUB"
        )
        items.append(
            AdminCommunityPostItem(
                id=post_id,
                author_name=author_name,
                author_handle=author_handle,
                post_type=str(row.get("post_type") or "text"),
                tag=str(row.get("tag") or "temoignage"),
                excerpt=_truncate_text(str(excerpt_source)),
                likes_count=int(row.get("likes_count") or 0),
                saves_count=save_counts.get(post_id, 0),
                comments_count=comments_count.get(post_id, 0),
                poll_votes_count=poll_vote_counts.get(post_id, 0),
                ai_reply_count=ai_reply_counts.get(post_id, 0),
                is_archived=bool(row.get("is_archived", False)),
                created_at_label=_format_datetime_label(row.get("created_at")),
            ),
        )
    return items


def _load_recent_community_comments(
    limit: int = 10,
    access_token: str | None = None,
) -> list[AdminCommunityCommentItem]:
    client = _client_or_none(access_token)
    if client is None:
        return []

    try:
        response = (
            client.table("community_comments")
            .select("id,post_id,author_profile_id,body,likes_count,is_official,is_ai_generated,created_at")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
    except Exception:
        return []

    rows = response.data or []
    if not rows:
        return []

    profile_ids = [str(item.get("author_profile_id")) for item in rows if item.get("author_profile_id")]
    post_ids = [int(item.get("post_id") or 0) for item in rows if item.get("post_id") is not None]

    author_map: dict[str, str] = {}
    if profile_ids:
        try:
            profile_response = (
                client.table("community_profiles")
                .select("id,display_name")
                .in_("id", profile_ids)
                .execute()
            )
            author_map = {
                str(item.get("id", "")): str(item.get("display_name") or "Membre PieHUB")
                for item in (profile_response.data or [])
            }
        except Exception:
            author_map = {}

    post_excerpt_map: dict[int, str] = {}
    if post_ids:
        try:
            post_response = (
                client.table("community_posts")
                .select("id,content,poll_question,resource_name")
                .in_("id", post_ids)
                .execute()
            )
            post_excerpt_map = {
                int(item.get("id") or 0): _truncate_text(
                    str(
                        item.get("content")
                        or item.get("poll_question")
                        or item.get("resource_name")
                        or "Publication PieHUB",
                    ),
                    90,
                )
                for item in (post_response.data or [])
                if item.get("id") is not None
            }
        except Exception:
            post_excerpt_map = {}

    return [
        AdminCommunityCommentItem(
            id=int(item.get("id") or 0),
            post_id=int(item.get("post_id") or 0),
            author_name=author_map.get(
                str(item.get("author_profile_id") or ""),
                "Membre PieHUB",
            ),
            post_excerpt=post_excerpt_map.get(
                int(item.get("post_id") or 0),
                "Publication PieHUB",
            ),
            body=str(item.get("body") or ""),
            likes_count=int(item.get("likes_count") or 0),
            is_official=bool(item.get("is_official", False)),
            is_ai_generated=bool(item.get("is_ai_generated", False)),
            created_at_label=_format_datetime_label(item.get("created_at")),
        )
        for item in rows
    ]


def get_admin_dashboard(
    current_user: AuthUserProfile,
    access_token: str | None = None,
) -> AdminDashboardResponse:
    recent_leads, total_leads = _load_recent_leads()
    recent_partnerships, total_partnerships = _load_recent_partnerships()
    active_cases = _load_active_cases(access_token=access_token)
    tasks = _load_admin_tasks(access_token=access_token)
    recent_chats = _load_recent_chats(access_token=access_token)
    managed_pages = _load_managed_pages(access_token=access_token)
    community_posts = _load_recent_community_posts(access_token=access_token)
    community_comments = _load_recent_community_comments(access_token=access_token)

    metrics = [
        DashboardMetric(
            label="Leads recus",
            value=str(total_leads),
            detail="Demandes publiques enregistrees",
            tone="info",
        ),
        DashboardMetric(
            label="Dossiers actifs",
            value=str(len(active_cases)),
            detail="Procedures visibles dans le cockpit",
            tone="good",
        ),
        DashboardMetric(
            label="Partenariats",
            value=str(total_partnerships),
            detail="Demandes de partenariat recues",
            tone="info",
        ),
        DashboardMetric(
            label="Actions ouvertes",
            value=str(len([task for task in tasks if task.status != "done"])),
            detail="Taches a traiter par l'equipe",
            tone="attention",
        ),
        DashboardMetric(
            label="Conversations IA",
            value=str(len(recent_chats)),
            detail="Sessions chatbot recentes",
            tone="info",
        ),
        DashboardMetric(
            label="Pages cataloguees",
            value=str(len(managed_pages)),
            detail="Pages repertoriees dans site_pages",
            tone="neutral",
        ),
        DashboardMetric(
            label="Admin connecte",
            value=current_user.full_name or current_user.email or "Admin",
            detail="Session validee via Supabase Auth",
            tone="good",
        ),
    ]

    return AdminDashboardResponse(
        metrics=metrics,
        recent_leads=recent_leads,
        recent_partnerships=recent_partnerships,
        active_cases=active_cases,
        tasks=tasks,
        recent_chats=recent_chats,
        managed_pages=managed_pages,
        community_posts=community_posts,
        community_comments=community_comments,
    )
