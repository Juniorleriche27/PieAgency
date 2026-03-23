from typing import Any

from ..schemas import AuthUserProfile
from .supabase_service import SupabaseConfigurationError, get_supabase_client


def _client_or_none(access_token: str | None = None):
    try:
        return get_supabase_client(access_token)
    except SupabaseConfigurationError:
        return None


def _build_title(message: str) -> str:
    compact = " ".join(message.split())
    if len(compact) <= 72:
        return compact or "Conversation chatbot"
    return f"{compact[:69]}..."


def _find_latest_anonymous_conversation(
    client,
    page_path: str,
    title: str,
    source: str,
) -> str | None:
    try:
        response = (
            client.table("chat_conversations")
            .select("id")
            .is_("user_id", "null")
            .eq("page_path", page_path)
            .eq("title", title)
            .eq("source", source)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
    except Exception:
        return None

    rows = response.data or []
    if not rows:
        return None
    return str(rows[0].get("id", ""))


def ensure_chat_conversation(
    page_path: str,
    first_user_message: str,
    conversation_id: str | None = None,
    current_user: AuthUserProfile | None = None,
    access_token: str | None = None,
    source: str = "site_chatbot",
) -> str | None:
    client = _client_or_none(access_token)
    if client is None:
        return None

    user_id = current_user.user_id if current_user else None

    if conversation_id:
        response = (
            client.table("chat_conversations")
            .select("id,user_id,title")
            .eq("id", conversation_id)
            .limit(1)
            .execute()
        )
        rows = response.data or []
        if rows:
            existing = rows[0]
            existing_user_id = existing.get("user_id")
            if existing_user_id and existing_user_id != user_id:
                conversation_id = None
            elif existing_user_id and not user_id:
                conversation_id = None

        if conversation_id and rows:
            existing = rows[0]
            existing_user_id = existing.get("user_id")
            update_payload: dict[str, Any] = {"page_path": page_path}
            if user_id and not existing_user_id:
                update_payload["user_id"] = user_id
            if not existing.get("title"):
                update_payload["title"] = _build_title(first_user_message)
            client.table("chat_conversations").update(update_payload).eq("id", conversation_id).execute()
            return str(existing.get("id", conversation_id))

    response = (
        client.table("chat_conversations")
        .insert(
            {
                "user_id": user_id,
                "page_path": page_path,
                "title": _build_title(first_user_message),
                "source": source,
                "status": "open",
            },
        )
        .execute()
    )
    data = response.data or []
    if data:
        return str(data[0].get("id", ""))

    if user_id:
        return None

    return _find_latest_anonymous_conversation(
        client=client,
        page_path=page_path,
        title=_build_title(first_user_message),
        source=source,
    )


def store_chat_message(
    conversation_id: str | None,
    sender_role: str,
    body: str,
    current_user: AuthUserProfile | None = None,
    model_source: str | None = None,
    metadata: dict[str, Any] | None = None,
    access_token: str | None = None,
) -> None:
    if not conversation_id or not body.strip():
        return

    client = _client_or_none(access_token)
    if client is None:
        return

    client.table("chat_messages").insert(
        {
            "conversation_id": conversation_id,
            "sender_role": sender_role,
            "sender_user_id": current_user.user_id if current_user else None,
            "body": body.strip(),
            "model_source": model_source,
            "metadata": metadata or {},
        },
        returning="minimal",
    ).execute()


def close_chat_conversation(conversation_id: str | None, access_token: str | None = None) -> None:
    if not conversation_id:
        return

    client = _client_or_none(access_token)
    if client is None:
        return

    client.table("chat_conversations").update({"status": "closed"}).eq("id", conversation_id).execute()
