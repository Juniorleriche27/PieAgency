import csv
import io
import json
from datetime import datetime, timezone
from typing import Literal

from openpyxl import Workbook

from ..schemas import (
    AdminCommentModerationResponse,
    AdminCommunityPostItem,
    AdminConversationDetailResponse,
    AdminConversationItem,
    AdminExportCatalogItem,
    AdminPageItem,
    AdminPageUpdateRequest,
    AuthUserProfile,
    ChatMessageItem,
)
from .supabase_service import SupabaseConfigurationError, get_supabase_client


class AdminDataUnavailableError(RuntimeError):
    pass


EXPORT_DATASETS: dict[str, tuple[str, str]] = {
    "contact_requests": ("contact_requests", "Demandes de contact"),
    "partnership_requests": ("partnership_requests", "Demandes de partenariat"),
    "profiles": ("profiles", "Profils plateforme"),
    "students": ("students", "Etudiants"),
    "student_cases": ("student_cases", "Dossiers etudiants"),
    "case_steps": ("case_steps", "Etapes dossier"),
    "case_documents": ("case_documents", "Documents dossier"),
    "case_notes": ("case_notes", "Notes dossier"),
    "case_activity_logs": ("case_activity_logs", "Activite dossier"),
    "case_appointments": ("case_appointments", "Rendez-vous"),
    "admin_tasks": ("admin_tasks", "Taches admin"),
    "notifications": ("notifications", "Notifications"),
    "chat_conversations": ("chat_conversations", "Conversations"),
    "chat_messages": ("chat_messages", "Messages"),
    "site_pages": ("site_pages", "Pages"),
    "page_sections": ("page_sections", "Sections de page"),
    "community_profiles": ("community_profiles", "Profils PieHUB"),
    "community_posts": ("community_posts", "Posts PieHUB"),
    "community_comments": ("community_comments", "Commentaires PieHUB"),
    "community_post_reactions": ("community_post_reactions", "Reactions PieHUB"),
    "community_poll_votes": ("community_poll_votes", "Votes sondages PieHUB"),
    "community_follows": ("community_follows", "Abonnements PieHUB"),
    "community_ai_events": ("community_ai_events", "Evenements IA PieHUB"),
}


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


def _get_client(access_token: str | None = None):
    try:
        return get_supabase_client(access_token)
    except SupabaseConfigurationError as exc:
        raise AdminDataUnavailableError(str(exc)) from exc


def _load_profile_labels(client, user_ids: list[str]) -> dict[str, str]:
    if not user_ids:
        return {}

    try:
        response = (
            client.table("profiles")
            .select("user_id,full_name,email")
            .in_("user_id", user_ids)
            .execute()
        )
    except Exception as exc:
        raise AdminDataUnavailableError(
            "La table profiles n'est pas encore disponible dans Supabase.",
        ) from exc

    return {
        str(item.get("user_id", "")): str(item.get("full_name") or item.get("email") or "Utilisateur")
        for item in (response.data or [])
    }


def _build_conversation_item(client, row: dict) -> AdminConversationItem:
    conversation_id = str(row.get("id", ""))
    user_id = str(row.get("user_id", "")) if row.get("user_id") else ""
    profile_map = _load_profile_labels(client, [user_id] if user_id else [])

    message_count_response = (
        client.table("chat_messages")
        .select("id", count="exact")
        .eq("conversation_id", conversation_id)
        .execute()
    )
    message_count = int(getattr(message_count_response, "count", None) or len(message_count_response.data or []))

    return AdminConversationItem(
        conversation_id=conversation_id,
        title=str(row.get("title") or "Conversation chatbot"),
        user_label=profile_map.get(user_id, "Visiteur anonyme" if not user_id else "Utilisateur"),
        page_path=str(row.get("page_path") or "/"),
        message_count=message_count,
        status=str(row.get("status") or "open"),
        updated_at_label=_format_datetime_label(row.get("updated_at")),
    )


def list_admin_pages(limit: int = 50, access_token: str | None = None) -> list[AdminPageItem]:
    client = _get_client(access_token)

    try:
        response = (
            client.table("site_pages")
            .select("id,title,route_path,audience,is_published,updated_at")
            .order("route_path")
            .limit(limit)
            .execute()
        )
    except Exception as exc:
        raise AdminDataUnavailableError(
            "La table site_pages n'est pas encore disponible dans Supabase.",
        ) from exc

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


def update_admin_page(
    page_id: str,
    payload: AdminPageUpdateRequest,
    current_user: AuthUserProfile,
    access_token: str | None = None,
) -> AdminPageItem:
    client = _get_client(access_token)

    try:
        response = (
            client.table("site_pages")
            .update(
                {
                    "is_published": payload.is_published,
                    "audience": payload.audience,
                    "updated_by": current_user.user_id,
                },
            )
            .eq("id", page_id)
            .execute()
        )
    except Exception as exc:
        raise AdminDataUnavailableError(
            "Impossible de mettre a jour cette page tant que site_pages n'est pas disponible.",
        ) from exc

    rows = response.data or []
    if not rows:
        raise LookupError("Page introuvable.")

    row = rows[0]
    return AdminPageItem(
        id=str(row.get("id", "")),
        title=str(row.get("title") or "Page"),
        route_path=str(row.get("route_path") or "/"),
        audience=_normalize_audience(row.get("audience")),
        is_published=bool(row.get("is_published", False)),
        updated_at_label=_format_datetime_label(row.get("updated_at")),
    )


def get_admin_conversation_detail(
    conversation_id: str,
    access_token: str | None = None,
) -> AdminConversationDetailResponse:
    client = _get_client(access_token)

    try:
        conversation_response = (
            client.table("chat_conversations")
            .select("id,user_id,page_path,title,status,updated_at")
            .eq("id", conversation_id)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        raise AdminDataUnavailableError(
            "La table chat_conversations n'est pas encore disponible dans Supabase.",
        ) from exc

    conversation_rows = conversation_response.data or []
    if not conversation_rows:
        raise LookupError("Conversation introuvable.")

    conversation = _build_conversation_item(client, conversation_rows[0])

    try:
        message_response = (
            client.table("chat_messages")
            .select("id,sender_role,body,model_source,created_at")
            .eq("conversation_id", conversation_id)
            .order("created_at")
            .execute()
        )
    except Exception as exc:
        raise AdminDataUnavailableError(
            "La table chat_messages n'est pas encore disponible dans Supabase.",
        ) from exc

    messages = [
        ChatMessageItem(
            id=str(item.get("id", "")),
            sender_role=str(item.get("sender_role") or "assistant"),
            body=str(item.get("body") or ""),
            model_source=item.get("model_source"),
            created_at_label=_format_datetime_label(item.get("created_at")),
        )
        for item in (message_response.data or [])
    ]

    return AdminConversationDetailResponse(conversation=conversation, messages=messages)


def set_admin_community_post_archived(
    post_id: int,
    is_archived: bool,
    access_token: str | None = None,
) -> AdminCommunityPostItem:
    client = _get_client(access_token)

    try:
        response = (
            client.table("community_posts")
            .update({"is_archived": is_archived})
            .eq("id", post_id)
            .execute()
        )
    except Exception as exc:
        raise AdminDataUnavailableError(
            "Impossible de moderer cette publication tant que community_posts n'est pas disponible.",
        ) from exc

    rows = response.data or []
    if not rows:
        raise LookupError("Publication communautaire introuvable.")

    row = rows[0]
    profile_name = "Membre PieHUB"
    profile_handle = "@piehub_member"
    try:
        profile_response = (
            client.table("community_profiles")
            .select("display_name,handle")
            .eq("id", str(row.get("author_profile_id") or ""))
            .limit(1)
            .execute()
        )
        profile_rows = profile_response.data or []
        if profile_rows:
            profile_name = str(profile_rows[0].get("display_name") or profile_name)
            profile_handle = str(profile_rows[0].get("handle") or profile_handle)
    except Exception:
        pass

    save_count = 0
    comments_count = 0
    poll_votes_count = 0
    ai_reply_count = 0
    try:
        save_response = (
            client.table("community_post_reactions")
            .select("id", count="exact")
            .eq("post_id", post_id)
            .eq("reaction_kind", "save")
            .execute()
        )
        save_count = int(getattr(save_response, "count", None) or len(save_response.data or []))
    except Exception:
        pass
    try:
        comment_response = (
            client.table("community_comments")
            .select("id,is_ai_generated")
            .eq("post_id", post_id)
            .execute()
        )
        comments = list(comment_response.data or [])
        comments_count = len(comments)
        ai_reply_count = len([item for item in comments if bool(item.get("is_ai_generated", False))])
    except Exception:
        pass
    try:
        vote_response = (
            client.table("community_poll_votes")
            .select("id", count="exact")
            .eq("post_id", post_id)
            .execute()
        )
        poll_votes_count = int(getattr(vote_response, "count", None) or len(vote_response.data or []))
    except Exception:
        pass

    excerpt_source = (
        row.get("content")
        or row.get("poll_question")
        or row.get("resource_name")
        or "Publication PieHUB"
    )
    return AdminCommunityPostItem(
        id=int(row.get("id") or 0),
        author_name=profile_name,
        author_handle=profile_handle,
        post_type=str(row.get("post_type") or "text"),
        tag=str(row.get("tag") or "temoignage"),
        excerpt=_truncate_text(str(excerpt_source)),
        likes_count=int(row.get("likes_count") or 0),
        saves_count=save_count,
        comments_count=comments_count,
        poll_votes_count=poll_votes_count,
        ai_reply_count=ai_reply_count,
        is_archived=bool(row.get("is_archived", False)),
        created_at_label=_format_datetime_label(row.get("created_at")),
    )


def delete_admin_community_comment(
    comment_id: int,
    access_token: str | None = None,
) -> AdminCommentModerationResponse:
    client = _get_client(access_token)

    try:
        response = (
            client.table("community_comments")
            .delete()
            .eq("id", comment_id)
            .execute()
        )
    except Exception as exc:
        raise AdminDataUnavailableError(
            "Impossible de supprimer ce commentaire tant que community_comments n'est pas disponible.",
        ) from exc

    rows = response.data or []
    if not rows:
        raise LookupError("Commentaire communautaire introuvable.")

    return AdminCommentModerationResponse(
        id=comment_id,
        status="deleted",
        message="Le commentaire a ete supprime.",
    )


def _safe_count_rows(client, table_name: str) -> int | None:
    try:
        response = client.table(table_name).select("id", count="exact").limit(1).execute()
        return int(getattr(response, "count", None) or 0)
    except Exception:
        return None


def list_admin_export_catalog(access_token: str | None = None) -> list[AdminExportCatalogItem]:
    client = _get_client(access_token)
    items: list[AdminExportCatalogItem] = [
        AdminExportCatalogItem(
            key="all_data",
            label="Toutes les donnees",
            row_count=None,
        ),
    ]
    for dataset_key, (table_name, label) in EXPORT_DATASETS.items():
        items.append(
            AdminExportCatalogItem(
                key=dataset_key,
                label=label,
                row_count=_safe_count_rows(client, table_name),
            ),
        )
    return items


def _fetch_rows(client, table_name: str) -> list[dict]:
    try:
        response = client.table(table_name).select("*").limit(5000).execute()
    except Exception as exc:
        raise AdminDataUnavailableError(
            f"Impossible de lire la table {table_name}. Rejouez schema.sql si besoin.",
        ) from exc

    return list(response.data or [])


def _try_fetch_rows(client, table_name: str) -> tuple[list[dict], str | None]:
    try:
        return _fetch_rows(client, table_name), None
    except AdminDataUnavailableError as exc:
        return [], str(exc)


def _normalize_scalar(value):
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float, str)):
        return value
    return json.dumps(value, ensure_ascii=False)


def _rows_to_csv_bytes(rows: list[dict]) -> bytes:
    output = io.StringIO()
    fieldnames: list[str] = []
    for row in rows:
        for key in row.keys():
            if key not in fieldnames:
                fieldnames.append(key)

    writer = csv.DictWriter(output, fieldnames=fieldnames or ["empty"])
    writer.writeheader()
    if not rows:
        writer.writerow({"empty": ""})
    else:
        for row in rows:
            writer.writerow({key: _normalize_scalar(row.get(key)) for key in fieldnames})
    return output.getvalue().encode("utf-8-sig")


def _sheet_title(value: str) -> str:
    safe = "".join(char for char in value if char not in "\\/*?:[]")
    return safe[:31] or "Sheet"


def _rows_to_workbook_bytes(sheets: dict[str, list[dict]]) -> bytes:
    workbook = Workbook()
    first = True
    for name, rows in sheets.items():
        worksheet = workbook.active if first else workbook.create_sheet()
        worksheet.title = _sheet_title(name)
        first = False

        fieldnames: list[str] = []
        for row in rows:
            for key in row.keys():
                if key not in fieldnames:
                    fieldnames.append(key)
        if not fieldnames:
            fieldnames = ["empty"]

        worksheet.append(fieldnames)
        if not rows:
            worksheet.append([""])
            continue

        for row in rows:
            worksheet.append([_normalize_scalar(row.get(key)) for key in fieldnames])

    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


def build_admin_export(
    dataset_key: str,
    export_format: Literal["json", "csv", "xlsx"],
    access_token: str | None = None,
) -> tuple[bytes, str, str]:
    client = _get_client(access_token)

    if dataset_key == "all_data":
        sheets: dict[str, list[dict]] = {}
        export_errors: list[dict] = []
        for key, (table_name, _label) in EXPORT_DATASETS.items():
            rows, error = _try_fetch_rows(client, table_name)
            sheets[key] = rows
            if error:
                export_errors.append({"dataset": key, "error": error})

        if export_errors:
            sheets["__export_errors"] = export_errors

        if export_format == "json":
            return (
                json.dumps(sheets, ensure_ascii=False, indent=2, default=str).encode("utf-8"),
                "application/json; charset=utf-8",
                "pieagency-all-data.json",
            )
        if export_format == "csv":
            rows: list[dict] = []
            for key, dataset_rows in sheets.items():
                for row in dataset_rows:
                    rows.append({"dataset": key, **row})
            return (
                _rows_to_csv_bytes(rows),
                "text/csv; charset=utf-8",
                "pieagency-all-data.csv",
            )
        return (
            _rows_to_workbook_bytes(sheets),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "pieagency-all-data.xlsx",
        )

    if dataset_key not in EXPORT_DATASETS:
        raise LookupError("Dataset d'export introuvable.")

    table_name, _label = EXPORT_DATASETS[dataset_key]
    rows = _fetch_rows(client, table_name)

    if export_format == "json":
        return (
            json.dumps(rows, ensure_ascii=False, indent=2, default=str).encode("utf-8"),
            "application/json; charset=utf-8",
            f"pieagency-{dataset_key}.json",
        )

    if export_format == "csv":
        return (
            _rows_to_csv_bytes(rows),
            "text/csv; charset=utf-8",
            f"pieagency-{dataset_key}.csv",
        )

    return (
        _rows_to_workbook_bytes({dataset_key: rows}),
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        f"pieagency-{dataset_key}.xlsx",
    )
