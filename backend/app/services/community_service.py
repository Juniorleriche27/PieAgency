from datetime import datetime, timedelta, timezone
from typing import Any

from ..schemas import (
    AuthUserProfile,
    CommunityAdCreateRequest,
    CommunityAdItem,
    CommunityAdsResponse,
    CommunityAIReplyRequest,
    CommunityAIRewriteRequest,
    CommunityAIRewriteResponse,
    CommunityAssistantMessageRequest,
    CommunityAssistantThreadMessageItem,
    CommunityAssistantThreadResponse,
    CommunityBootstrapResponse,
    CommunityCommentCreateRequest,
    CommunityCommentItem,
    CommunityEventAttendanceResponse,
    CommunityEventCalendarItem,
    CommunityEventCreateRequest,
    CommunityGroupCreateRequest,
    CommunityGroupItem,
    CommunityGroupMembershipResponse,
    CommunityMutationResponse,
    CommunityNotificationItem,
    CommunityNotificationsResponse,
    CommunityPollVoteRequest,
    CommunityPollOptionItem,
    CommunityPostCreateRequest,
    CommunityPostItem,
    CommunityProfileItem,
)
from .ai_service import generate_community_reply, should_generate_community_reply
from .chat_store import ensure_chat_conversation, store_chat_message
from .supabase_service import SupabaseConfigurationError, get_supabase_client

PIEHUB_PROFILE_ID = "piehub"


class CommunityDataUnavailableError(RuntimeError):
    pass


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


def _get_client(access_token: str | None = None):
    try:
        return get_supabase_client(access_token)
    except SupabaseConfigurationError as exc:
        raise CommunityDataUnavailableError(str(exc)) from exc


def _community_tables_available(client) -> bool:
    try:
        client.table("community_profiles").select("id").limit(1).execute()
        client.table("community_posts").select("id").limit(1).execute()
        client.table("community_comments").select("id").limit(1).execute()
    except Exception:
        return False
    return True


def _seed_timestamp(hours_ago: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(hours=hours_ago)).isoformat()


SEED_PROFILES: list[dict[str, Any]] = [
    {
        "id": PIEHUB_PROFILE_ID,
        "display_name": "Guide PieHUB",
        "handle": "@piehub_guide",
        "country": "Equipe PieAgency",
        "city": "En ligne",
        "bio": "Profil officiel du hub communautaire PieAgency. Je reponds, j'oriente et je dirige vers le bon canal pour avancer.",
        "avatar": "PH",
        "accent_color": "#0D1B38",
        "follower_count": 5400,
        "following_count": 12,
        "post_count": 320,
        "tags": ["PieHUB", "Orientation", "PieAgency"],
        "is_official": True,
        "is_ai": True,
    },
    {
        "id": "ibrahim",
        "display_name": "Ibrahim B.",
        "handle": "@ibrahim_france",
        "country": "France FR",
        "city": "Paris",
        "bio": "Conseiller PieAgency France. Je reponds aux questions sur les procedures et la vie en France.",
        "avatar": "IB",
        "accent_color": "#C8952A",
        "follower_count": 3200,
        "following_count": 180,
        "post_count": 260,
        "tags": ["Conseiller", "Paris", "PieAgency"],
        "is_official": True,
        "is_ai": False,
    },
    {
        "id": "junior",
        "display_name": "Junior L.",
        "handle": "@junior_togo",
        "country": "Togo TG",
        "city": "Lome",
        "bio": "Conseiller PieAgency Togo. Accompagnement Campus France, Visa et Belgique.",
        "avatar": "JL",
        "accent_color": "#1E7A5F",
        "follower_count": 2800,
        "following_count": 210,
        "post_count": 195,
        "tags": ["Conseiller", "Lome", "PieAgency"],
        "is_official": True,
        "is_ai": False,
    },
    {
        "id": "amara",
        "display_name": "Amara S.",
        "handle": "@amara_dakar",
        "country": "Senegal SN",
        "city": "Dakar",
        "bio": "Campus France 2025. Je partage mon experience pour aider les futurs candidats.",
        "avatar": "AS",
        "accent_color": "#7C3AED",
        "follower_count": 980,
        "following_count": 312,
        "post_count": 134,
        "tags": ["Campus France", "Droit", "Lyon"],
        "is_official": False,
        "is_ai": False,
    },
    {
        "id": "kofi",
        "display_name": "Kofi A.",
        "handle": "@kofi_accra",
        "country": "Ghana GH",
        "city": "Accra",
        "bio": "Etudiant en Master Informatique a Paris-Saclay. Passionne par l'IA et l'entrepreneuriat africain.",
        "avatar": "KA",
        "accent_color": "#2563EB",
        "follower_count": 1240,
        "following_count": 430,
        "post_count": 87,
        "tags": ["Paris-Saclay", "IA", "Entrepreneuriat"],
        "is_official": False,
        "is_ai": False,
    },
    {
        "id": "fatou",
        "display_name": "Fatou D.",
        "handle": "@fatou_bamako",
        "country": "Mali ML",
        "city": "Bamako",
        "bio": "Candidature Campus France en cours. Je documente mon parcours ici pour aider les autres.",
        "avatar": "FD",
        "accent_color": "#EA580C",
        "follower_count": 620,
        "following_count": 280,
        "post_count": 48,
        "tags": ["Campus France", "BTS", "Lyon"],
        "is_official": False,
        "is_ai": False,
    },
    {
        "id": "moussa",
        "display_name": "Moussa K.",
        "handle": "@moussa_cotonou",
        "country": "Benin BJ",
        "city": "Cotonou",
        "bio": "Etudiant en Licence Economie a Bruxelles. Experience Campus Belgique partagee ici.",
        "avatar": "MK",
        "accent_color": "#0D1B38",
        "follower_count": 445,
        "following_count": 198,
        "post_count": 62,
        "tags": ["Belgique", "Economie", "Bruxelles"],
        "is_official": False,
        "is_ai": False,
    },
]


SEED_POSTS: list[dict[str, Any]] = [
    {
        "seed_key": "community-post-ibrahim-campus",
        "author_profile_id": "ibrahim",
        "post_type": "text",
        "tag": "campus",
        "content": "Rappel important : la procedure Campus France 2025 est ouverte. Analyse du profil, choix de formations et lettres de motivation, chaque etape compte. #CampusFrance #PieAgency",
        "likes_count": 84,
        "shares_count": 32,
        "created_at": _seed_timestamp(2),
    },
    {
        "seed_key": "community-post-amara-testimony",
        "author_profile_id": "amara",
        "post_type": "text",
        "tag": "temoignage",
        "content": "Voila un an que je suis a Lyon. Mon conseil : commencez tot, soyez organises et gardez votre energie jusqu'au visa et au logement. #Temoignage #Lyon #EtudierEnFrance",
        "likes_count": 142,
        "shares_count": 67,
        "created_at": _seed_timestamp(5),
    },
    {
        "seed_key": "community-post-kofi-poll",
        "author_profile_id": "kofi",
        "post_type": "poll",
        "tag": "vie",
        "content": "",
        "poll_question": "Quelle est votre plus grande difficulte dans les demarches ?",
        "poll_options": [
            {"text": "Rediger les lettres de motivation", "votes": 48},
            {"text": "Trouver un logement", "votes": 61},
            {"text": "Les justificatifs financiers", "votes": 39},
            {"text": "La preparation a l'entretien", "votes": 27},
        ],
        "likes_count": 56,
        "shares_count": 28,
        "created_at": _seed_timestamp(8),
    },
    {
        "seed_key": "community-post-junior-resource",
        "author_profile_id": "junior",
        "post_type": "resource",
        "tag": "visa",
        "content": "Voici un modele de lettre de motivation pour la demande de visa etudiant en France, adapte a partir d'un dossier accepte. #Visa #Ressource",
        "resource_name": "Modele de lettre de motivation - Visa etudiant.pdf",
        "resource_type": "pdf",
        "resource_size": "245 Ko",
        "likes_count": 203,
        "shares_count": 89,
        "created_at": _seed_timestamp(12),
    },
]


SEED_COMMENTS: list[dict[str, Any]] = [
    {
        "seed_key": "community-comment-1",
        "post_seed_key": "community-post-ibrahim-campus",
        "author_profile_id": "fatou",
        "body": "Merci pour le rappel. Je commence cette semaine.",
        "likes_count": 12,
        "created_at": _seed_timestamp(1),
    },
    {
        "seed_key": "community-comment-2",
        "post_seed_key": "community-post-ibrahim-campus",
        "author_profile_id": "kofi",
        "body": "Est-ce que la procedure change selon les pays ? Je suis du Ghana.",
        "likes_count": 7,
        "created_at": _seed_timestamp(1),
    },
    {
        "seed_key": "community-comment-3",
        "post_seed_key": "community-post-amara-testimony",
        "author_profile_id": "fatou",
        "body": "Trop inspirant. Tu as eu combien de temps pour preparer ton visa ?",
        "likes_count": 18,
        "created_at": _seed_timestamp(3),
    },
    {
        "seed_key": "community-comment-4",
        "post_seed_key": "community-post-kofi-poll",
        "author_profile_id": "moussa",
        "body": "Le logement pour moi, sans hesitation.",
        "likes_count": 23,
        "created_at": _seed_timestamp(6),
    },
]


def _build_initials(name: str) -> str:
    parts = [part for part in name.replace("-", " ").split() if part]
    if not parts:
        return "ET"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return f"{parts[0][0]}{parts[1][0]}".upper()


def _slugify_handle(value: str) -> str:
    slug = "".join(char.lower() if char.isalnum() else "_" for char in value)
    slug = "_".join(part for part in slug.split("_") if part)
    return slug[:30] or "membre_piehub"


def _infer_post_tag(text: str, fallback: str = "vie") -> str:
    normalized = text.strip().lower()
    if not normalized:
        return fallback

    if any(keyword in normalized for keyword in ("visa", "consulaire", "hebergement", "lettre explicative")):
        return "visa"

    if any(keyword in normalized for keyword in ("logement", "studio", "crous", "residence")):
        return "logement"

    if any(
        keyword in normalized
        for keyword in (
            "campus france",
            "parcoursup",
            "belgique",
            "paris-saclay",
            "ecole",
            "universite",
            "formation",
        )
    ):
        return "campus"

    if any(keyword in normalized for keyword in ("temoignage", "experience", "retour", "mon parcours")):
        return "temoignage"

    return fallback


def _normalize_post_tag(raw_tag: str | None, *, post_type: str, content: str, question: str | None = None) -> str:
    normalized = (raw_tag or "").strip().lower()
    if "campus" in normalized:
        return "campus"
    if "visa" in normalized:
        return "visa"
    if "vie" in normalized:
        return "vie"
    if "logement" in normalized:
        return "logement"
    if "temoignage" in normalized:
        inferred = _infer_post_tag(
            question or content,
            "visa" if post_type == "resource" else "vie" if post_type == "poll" else "temoignage",
        )
        return inferred if inferred != "temoignage" else "temoignage"

    return _infer_post_tag(
        question or content,
        "visa" if post_type == "resource" else "vie" if post_type == "poll" else "campus",
    )


def _build_profile_item(row: dict[str, Any]) -> CommunityProfileItem:
    return CommunityProfileItem(
        id=str(row.get("id", "")),
        name=str(row.get("display_name") or "Membre PieHUB"),
        tag=str(row.get("handle") or "@piehub_member"),
        country=str(row.get("country") or "Afrique francophone"),
        city=str(row.get("city") or "En ligne"),
        bio=str(row.get("bio") or "Membre de la communaute PieHUB."),
        avatar=str(row.get("avatar") or "PH"),
        color=str(row.get("accent_color") or "#0D1B38"),
        followers=int(row.get("follower_count") or 0),
        following=int(row.get("following_count") or 0),
        posts=int(row.get("post_count") or 0),
        tags=[str(item) for item in (row.get("tags") or [])],
        is_official=bool(row.get("is_official", False)),
        is_ai=bool(row.get("is_ai", False)),
    )


def _build_comment_item(row: dict[str, Any]) -> CommunityCommentItem:
    return CommunityCommentItem(
        id=int(row.get("id") or 0),
        user_id=str(row.get("author_profile_id") or PIEHUB_PROFILE_ID),
        text=str(row.get("body") or ""),
        time=_format_datetime_label(row.get("created_at")),
        likes=int(row.get("likes_count") or 0),
        is_official=bool(row.get("is_official", False)),
        is_ai_generated=bool(row.get("is_ai_generated", False)),
    )


def _build_post_item(
    row: dict[str, Any],
    comments: list[CommunityCommentItem],
    *,
    liked_post_ids: set[int] | None = None,
    saved_post_ids: set[int] | None = None,
    poll_votes: dict[int, int] | None = None,
) -> CommunityPostItem:
    post_id = int(row.get("id") or 0)
    options_payload = row.get("poll_options") or []
    options = [
        CommunityPollOptionItem(
            text=str(item.get("text") or ""),
            votes=int(item.get("votes") or 0),
        )
        for item in options_payload
        if isinstance(item, dict)
    ]
    return CommunityPostItem(
        id=post_id,
        user_id=str(row.get("author_profile_id") or PIEHUB_PROFILE_ID),
        post_type=str(row.get("post_type") or "text"),
        tag=_normalize_post_tag(
            row.get("tag"),
            post_type=str(row.get("post_type") or "text"),
            content=str(row.get("content") or ""),
            question=row.get("poll_question"),
        ),
        time=_format_datetime_label(row.get("created_at")),
        likes=int(row.get("likes_count") or 0),
        shares=int(row.get("shares_count") or 0),
        content=str(row.get("content") or ""),
        resource_name=row.get("resource_name"),
        resource_type=row.get("resource_type"),
        resource_size=row.get("resource_size"),
        question=row.get("poll_question"),
        options=options,
        comments=comments,
        viewer_has_liked=post_id in (liked_post_ids or set()),
        viewer_has_saved=post_id in (saved_post_ids or set()),
        viewer_poll_vote=(poll_votes or {}).get(post_id),
    )


def _ensure_community_tables(client) -> None:
    if not _community_tables_available(client):
        raise CommunityDataUnavailableError(
            "Les tables community_* ne sont pas encore disponibles. Rejouez backend/supabase/schema.sql dans Supabase.",
        )

def _ensure_seed_data(client) -> bool:
    _ensure_community_tables(client)

    try:
        client.table("community_profiles").upsert(SEED_PROFILES, on_conflict="id").execute()

        client.table("community_posts").upsert(SEED_POSTS, on_conflict="seed_key").execute()
        post_rows = (
            client.table("community_posts")
            .select("id,seed_key")
            .in_("seed_key", [item["seed_key"] for item in SEED_POSTS])
            .execute()
        )
        post_map = {
            str(item.get("seed_key")): int(item.get("id"))
            for item in (post_rows.data or [])
            if item.get("seed_key") and item.get("id") is not None
        }

        comment_payloads = []
        for comment in SEED_COMMENTS:
            post_id = post_map.get(comment["post_seed_key"])
            if not post_id:
                continue
            comment_payloads.append(
                {
                    "seed_key": comment["seed_key"],
                    "post_id": post_id,
                    "author_profile_id": comment["author_profile_id"],
                    "body": comment["body"],
                    "likes_count": comment["likes_count"],
                    "created_at": comment["created_at"],
                },
            )

        if comment_payloads:
            client.table("community_comments").upsert(comment_payloads, on_conflict="seed_key").execute()
    except Exception:
        return False

    return True


def _build_fallback_seed_profiles(current_profile: CommunityProfileItem | None = None) -> list[CommunityProfileItem]:
    profiles = [_build_profile_item(item) for item in SEED_PROFILES]
    if current_profile is not None:
        profiles = [current_profile, *[item for item in profiles if item.id != current_profile.id]]
    return profiles


def _build_fallback_seed_posts() -> list[CommunityPostItem]:
    post_ids = {item["seed_key"]: index + 1 for index, item in enumerate(SEED_POSTS)}
    comments_by_post: dict[str, list[CommunityCommentItem]] = {}

    for index, comment in enumerate(SEED_COMMENTS, start=1):
        comments_by_post.setdefault(comment["post_seed_key"], []).append(
            CommunityCommentItem(
                id=-index,
                user_id=comment["author_profile_id"],
                text=comment["body"],
                time=_format_datetime_label(comment["created_at"]),
                likes=int(comment["likes_count"]),
                is_official=False,
                is_ai_generated=False,
            ),
        )

    posts: list[CommunityPostItem] = []
    for item in SEED_POSTS:
        row = {
            **item,
            "id": post_ids[item["seed_key"]],
        }
        posts.append(_build_post_item(row, comments_by_post.get(item["seed_key"], [])))
    return posts


def _ensure_user_profile(client, current_user: AuthUserProfile) -> CommunityProfileItem:
    profile_id = f"user:{current_user.user_id}"
    fallback_name = (
        current_user.full_name
        or (current_user.email.split("@")[0].replace(".", " ").replace("_", " ").title() if current_user.email else "")
        or "Etudiant PieHUB"
    )
    payload = {
        "id": profile_id,
        "user_id": current_user.user_id,
        "display_name": fallback_name,
        "handle": f"@{_slugify_handle(current_user.email or fallback_name)}",
        "country": current_user.country or "Afrique francophone",
        "city": "Membre",
        "bio": "Membre de PieHUB. Suivi des echanges, questions et publications autour des demarches etudiantes.",
        "avatar": _build_initials(fallback_name),
        "accent_color": "#C8952A",
        "tags": ["PieHUB", current_user.country or "PieAgency"],
        "is_official": False,
        "is_ai": False,
    }
    response = client.table("community_profiles").upsert(payload, on_conflict="id").execute()
    data = response.data or [payload]
    return _build_profile_item(data[0])


def _load_profiles(client) -> list[CommunityProfileItem]:
    response = (
        client.table("community_profiles")
        .select("*")
        .order("is_official", desc=True)
        .order("display_name")
        .limit(40)
        .execute()
    )
    return [_build_profile_item(item) for item in (response.data or [])]


def _load_post_rows(client, limit: int = 20, post_ids: list[int] | None = None) -> list[dict[str, Any]]:
    query = client.table("community_posts").select("*")
    if post_ids:
        query = query.in_("id", post_ids)
    else:
        query = query.neq("moderation_status", "pending")
    response = query.order("created_at", desc=True).limit(limit).execute()
    return list(response.data or [])


def _load_comment_rows(client, post_ids: list[int]) -> list[dict[str, Any]]:
    if not post_ids:
        return []
    response = (
        client.table("community_comments")
        .select("*")
        .in_("post_id", post_ids)
        .order("created_at")
        .execute()
    )
    return list(response.data or [])


def _load_reaction_sets(
    client,
    viewer_user_id: str | None,
    post_ids: list[int],
) -> tuple[set[int], set[int]]:
    if not viewer_user_id or not post_ids:
        return set(), set()

    response = (
        client.table("community_post_reactions")
        .select("post_id,reaction_kind")
        .eq("user_id", viewer_user_id)
        .in_("post_id", post_ids)
        .execute()
    )
    liked_post_ids: set[int] = set()
    saved_post_ids: set[int] = set()
    for item in (response.data or []):
        post_id = int(item.get("post_id") or 0)
        reaction_kind = str(item.get("reaction_kind") or "")
        if reaction_kind == "like":
            liked_post_ids.add(post_id)
        if reaction_kind == "save":
            saved_post_ids.add(post_id)
    return liked_post_ids, saved_post_ids


def _load_poll_votes(
    client,
    viewer_user_id: str | None,
    post_ids: list[int],
) -> dict[int, int]:
    if not viewer_user_id or not post_ids:
        return {}

    response = (
        client.table("community_poll_votes")
        .select("post_id,option_index")
        .eq("user_id", viewer_user_id)
        .in_("post_id", post_ids)
        .execute()
    )
    return {
        int(item.get("post_id") or 0): int(item.get("option_index") or 0)
        for item in (response.data or [])
        if item.get("post_id") is not None and item.get("option_index") is not None
    }


def _load_post_items(
    client,
    limit: int = 20,
    post_ids: list[int] | None = None,
    viewer_user_id: str | None = None,
) -> list[CommunityPostItem]:
    post_rows = _load_post_rows(client, limit=limit, post_ids=post_ids)
    ids = [int(item["id"]) for item in post_rows if item.get("id") is not None]
    comment_rows = _load_comment_rows(client, ids)
    liked_post_ids, saved_post_ids = _load_reaction_sets(client, viewer_user_id, ids)
    poll_votes = _load_poll_votes(client, viewer_user_id, ids)
    comments_by_post: dict[int, list[CommunityCommentItem]] = {}
    for item in comment_rows:
        post_id = int(item.get("post_id") or 0)
        comments_by_post.setdefault(post_id, []).append(_build_comment_item(item))

    return [
        _build_post_item(
            item,
            comments_by_post.get(int(item.get("id") or 0), []),
            liked_post_ids=liked_post_ids,
            saved_post_ids=saved_post_ids,
            poll_votes=poll_votes,
        )
        for item in post_rows
    ]


def _log_ai_event(
    client,
    *,
    post_id: int | None,
    comment_id: int | None,
    conversation_id: str | None,
    trigger_message: str,
    decision: str,
    reason: str,
    source: str | None,
) -> None:
    try:
        client.table("community_ai_events").insert(
            {
                "post_id": post_id,
                "comment_id": comment_id,
                "conversation_id": conversation_id,
                "trigger_message": trigger_message,
                "decision": decision,
                "reason": reason,
                "source": source,
            },
            returning="minimal",
        ).execute()
    except Exception:
        return


def _recent_official_reply_exists(client, post_id: int) -> bool:
    response = (
        client.table("community_comments")
        .select("author_profile_id")
        .eq("post_id", post_id)
        .order("created_at", desc=True)
        .limit(4)
        .execute()
    )
    rows = response.data or []
    return any(str(item.get("author_profile_id") or "") == PIEHUB_PROFILE_ID for item in rows)


def _official_profile_exists(client) -> bool:
    response = (
        client.table("community_profiles")
        .select("id")
        .eq("id", PIEHUB_PROFILE_ID)
        .limit(1)
        .execute()
    )
    return bool(response.data)


def _insert_comment_row(client, payload: dict[str, Any]) -> dict[str, Any]:
    response = client.table("community_comments").insert(payload).execute()
    rows = response.data or []
    if not rows:
        raise CommunityDataUnavailableError("Impossible d'enregistrer le commentaire communautaire.")
    return rows[0]


def _maybe_generate_assistant_comment(
    client,
    *,
    post_id: int,
    trigger_message: str,
    thread_context: list[str],
) -> CommunityCommentItem | None:
    should_reply, reason = should_generate_community_reply(trigger_message, thread_context)
    if not should_reply:
        _log_ai_event(
            client,
            post_id=post_id,
            comment_id=None,
            conversation_id=None,
            trigger_message=trigger_message,
            decision="skipped",
            reason=reason,
            source=None,
        )
        return None

    if _recent_official_reply_exists(client, post_id):
        _log_ai_event(
            client,
            post_id=post_id,
            comment_id=None,
            conversation_id=None,
            trigger_message=trigger_message,
            decision="skipped",
            reason="recent_official_reply",
            source=None,
        )
        return None

    if not _official_profile_exists(client):
        _log_ai_event(
            client,
            post_id=post_id,
            comment_id=None,
            conversation_id=None,
            trigger_message=trigger_message,
            decision="skipped",
            reason="official_profile_missing",
            source=None,
        )
        return None

    ai_response = generate_community_reply(
        CommunityAIReplyRequest(message=trigger_message, thread_context=thread_context),
    )
    row = _insert_comment_row(
        client,
        {
            "post_id": post_id,
            "author_profile_id": PIEHUB_PROFILE_ID,
            "body": ai_response.reply,
            "likes_count": 0,
            "is_official": True,
            "is_ai_generated": True,
            "ai_source": ai_response.source,
        },
    )
    _log_ai_event(
        client,
        post_id=post_id,
        comment_id=int(row.get("id") or 0),
        conversation_id=None,
        trigger_message=trigger_message,
        decision="replied",
        reason=reason,
        source=ai_response.source,
    )
    return _build_comment_item(row)


def get_community_bootstrap(
    current_user: AuthUserProfile | None = None,
    access_token: str | None = None,
) -> CommunityBootstrapResponse:
    client = _get_client(access_token)
    seeded = _ensure_seed_data(client)

    current_profile: CommunityProfileItem | None = None
    current_profile_id: str | None = None
    if current_user is not None:
        current_profile = _ensure_user_profile(client, current_user)
        current_profile_id = current_profile.id

    profiles = _load_profiles(client)
    posts = _load_post_items(
        client,
        limit=24,
        viewer_user_id=current_user.user_id if current_user is not None else None,
    )

    if not profiles and not posts and not seeded:
        profiles = _build_fallback_seed_profiles(current_profile)
        posts = _build_fallback_seed_posts()
    elif current_profile is not None and all(item.id != current_profile.id for item in profiles):
        profiles = [current_profile, *profiles]

    groups = _load_groups(client, viewer_user_id=current_user.user_id if current_user else None)
    events_calendar = _load_events_calendar(client, viewer_user_id=current_user.user_id if current_user else None)
    notif_items, unread_count = _load_notifications(client, current_user.user_id) if current_user else ([], 0)
    ads_response = get_community_ads(current_user, access_token)
    approved_ads = [ad for ad in ads_response.ads if ad.moderation_status == "approved"]

    return CommunityBootstrapResponse(
        current_profile_id=current_profile_id,
        profiles=profiles,
        posts=posts,
        groups=groups,
        events_calendar=events_calendar,
        notifications=notif_items,
        unread_notifications=unread_count,
        ads=approved_ads,
    )


def create_community_post(
    payload: CommunityPostCreateRequest,
    current_user: AuthUserProfile,
    access_token: str | None = None,
) -> CommunityMutationResponse:
    client = _get_client(access_token)
    _ensure_community_tables(client)
    profile = _ensure_user_profile(client, current_user)

    insert_payload = {
        "author_profile_id": profile.id,
        "author_user_id": current_user.user_id,
        "post_type": payload.post_type,
        "tag": _normalize_post_tag(
            payload.tag,
            post_type=payload.post_type,
            content=payload.content.strip(),
            question=payload.question,
        ),
        "content": payload.content.strip(),
        "resource_name": payload.resource_name,
        "resource_type": payload.resource_type,
        "resource_size": payload.resource_size,
        "poll_question": payload.question or (payload.content.strip() if payload.post_type == "poll" else None),
        "poll_options": (
            [{"text": option, "votes": 0} for option in payload.options]
            if payload.post_type == "poll"
            else []
        ),
        "moderation_status": "pending" if payload.post_type == "resource" else "approved",
    }
    response = client.table("community_posts").insert(insert_payload).execute()
    rows = response.data or []
    if not rows:
        raise CommunityDataUnavailableError("Impossible de creer la publication communautaire.")

    created_row = rows[0]
    post_id = int(created_row.get("id") or 0)
    assistant_comment = _maybe_generate_assistant_comment(
        client,
        post_id=post_id,
        trigger_message=payload.question or payload.content,
        thread_context=[payload.question or payload.content],
    )

    updated_post = _load_post_items(
        client,
        limit=1,
        post_ids=[post_id],
        viewer_user_id=current_user.user_id,
    )[0]
    return CommunityMutationResponse(
        post=updated_post,
        assistant_comment=assistant_comment,
        assistant_replied=assistant_comment is not None,
    )


def create_community_comment(
    post_id: int,
    payload: CommunityCommentCreateRequest,
    current_user: AuthUserProfile,
    access_token: str | None = None,
) -> CommunityMutationResponse:
    client = _get_client(access_token)
    _ensure_community_tables(client)
    profile = _ensure_user_profile(client, current_user)

    post_rows = _load_post_rows(client, post_ids=[post_id], limit=1)
    if not post_rows:
        raise LookupError("Publication introuvable.")
    post_row = post_rows[0]

    inserted_comment = _insert_comment_row(
        client,
        {
            "post_id": post_id,
            "author_profile_id": profile.id,
            "author_user_id": current_user.user_id,
            "body": payload.text,
            "likes_count": 0,
        },
    )

    thread_context = [
        str(post_row.get("poll_question") or post_row.get("content") or ""),
        payload.text,
    ]
    assistant_comment = _maybe_generate_assistant_comment(
        client,
        post_id=post_id,
        trigger_message=payload.text,
        thread_context=thread_context,
    )

    updated_post = _load_post_items(
        client,
        limit=1,
        post_ids=[post_id],
        viewer_user_id=current_user.user_id,
    )[0]
    return CommunityMutationResponse(
        post=updated_post,
        assistant_comment=assistant_comment,
        assistant_replied=assistant_comment is not None,
    )


def toggle_community_post_reaction(
    post_id: int,
    reaction_kind: str,
    current_user: AuthUserProfile,
    access_token: str | None = None,
) -> CommunityMutationResponse:
    if reaction_kind not in {"like", "save"}:
        raise LookupError("Reaction introuvable.")

    client = _get_client(access_token)
    _ensure_community_tables(client)
    _ensure_user_profile(client, current_user)

    post_rows = _load_post_rows(client, post_ids=[post_id], limit=1)
    if not post_rows:
        raise LookupError("Publication introuvable.")
    post_row = post_rows[0]

    existing_response = (
        client.table("community_post_reactions")
        .select("id")
        .eq("post_id", post_id)
        .eq("user_id", current_user.user_id)
        .eq("reaction_kind", reaction_kind)
        .limit(1)
        .execute()
    )
    existing_rows = existing_response.data or []

    if existing_rows:
        client.table("community_post_reactions").delete().eq("id", existing_rows[0]["id"]).execute()
        if reaction_kind == "like":
            next_likes = max(int(post_row.get("likes_count") or 0) - 1, 0)
            client.table("community_posts").update({"likes_count": next_likes}).eq("id", post_id).execute()
    else:
        client.table("community_post_reactions").insert(
            {
                "post_id": post_id,
                "user_id": current_user.user_id,
                "reaction_kind": reaction_kind,
            },
        ).execute()
        if reaction_kind == "like":
            next_likes = int(post_row.get("likes_count") or 0) + 1
            client.table("community_posts").update({"likes_count": next_likes}).eq("id", post_id).execute()

    updated_post = _load_post_items(
        client,
        limit=1,
        post_ids=[post_id],
        viewer_user_id=current_user.user_id,
    )[0]
    return CommunityMutationResponse(post=updated_post)


def vote_community_poll(
    post_id: int,
    payload: CommunityPollVoteRequest,
    current_user: AuthUserProfile,
    access_token: str | None = None,
) -> CommunityMutationResponse:
    client = _get_client(access_token)
    _ensure_community_tables(client)
    _ensure_user_profile(client, current_user)

    post_rows = _load_post_rows(client, post_ids=[post_id], limit=1)
    if not post_rows:
        raise LookupError("Publication introuvable.")
    post_row = post_rows[0]
    if str(post_row.get("post_type") or "") != "poll":
        raise LookupError("Ce contenu n'est pas un sondage.")

    options_payload = [dict(item) for item in (post_row.get("poll_options") or []) if isinstance(item, dict)]
    if payload.option_index >= len(options_payload):
        raise LookupError("Option de sondage introuvable.")

    existing_response = (
        client.table("community_poll_votes")
        .select("id,option_index")
        .eq("post_id", post_id)
        .eq("user_id", current_user.user_id)
        .limit(1)
        .execute()
    )
    existing_rows = existing_response.data or []
    previous_index = None
    if existing_rows:
        previous_index = int(existing_rows[0].get("option_index") or 0)
        client.table("community_poll_votes").update(
            {"option_index": payload.option_index},
        ).eq("id", existing_rows[0]["id"]).execute()
    else:
        client.table("community_poll_votes").insert(
            {
                "post_id": post_id,
                "user_id": current_user.user_id,
                "option_index": payload.option_index,
            },
        ).execute()

    if previous_index is not None and previous_index < len(options_payload):
        options_payload[previous_index]["votes"] = max(int(options_payload[previous_index].get("votes") or 0) - 1, 0)

    options_payload[payload.option_index]["votes"] = int(options_payload[payload.option_index].get("votes") or 0) + 1
    client.table("community_posts").update({"poll_options": options_payload}).eq("id", post_id).execute()

    updated_post = _load_post_items(
        client,
        limit=1,
        post_ids=[post_id],
        viewer_user_id=current_user.user_id,
    )[0]
    return CommunityMutationResponse(post=updated_post)


def _build_group_item(row: dict[str, Any], *, member_group_ids: set[int] | None = None) -> CommunityGroupItem:
    group_id = int(row.get("id") or 0)
    return CommunityGroupItem(
        id=group_id,
        name=str(row.get("name") or ""),
        description=str(row.get("description") or ""),
        icon=str(row.get("icon") or "👥"),
        category=str(row.get("category") or "general"),
        member_count=int(row.get("member_count") or 0),
        is_official=bool(row.get("is_official", False)),
        is_member=group_id in (member_group_ids or set()),
        created_by_profile_id=str(row.get("created_by_profile_id") or "") or None,
        created_at=_format_datetime_label(row.get("created_at")),
    )


def _build_event_calendar_item(row: dict[str, Any], *, attending_event_ids: set[int] | None = None) -> CommunityEventCalendarItem:
    event_id = int(row.get("id") or 0)
    raw_date = row.get("event_date") or ""
    return CommunityEventCalendarItem(
        id=event_id,
        name=str(row.get("name") or ""),
        description=str(row.get("description") or ""),
        event_date=str(raw_date)[:10] if raw_date else "",
        event_time=str(row.get("event_time") or ""),
        location_type=str(row.get("location_type") or "online"),
        location_detail=str(row.get("location_detail") or ""),
        attendee_count=int(row.get("attendee_count") or 0),
        is_official=bool(row.get("is_official", False)),
        is_attending=event_id in (attending_event_ids or set()),
        created_by_profile_id=str(row.get("created_by_profile_id") or "") or None,
        created_at=_format_datetime_label(row.get("created_at")),
    )


def _load_groups(client, viewer_user_id: str | None = None) -> list[CommunityGroupItem]:
    try:
        response = (
            client.table("community_groups")
            .select("*")
            .order("is_official", desc=True)
            .order("member_count", desc=True)
            .limit(30)
            .execute()
        )
        rows = response.data or []
        member_group_ids: set[int] = set()
        if viewer_user_id and rows:
            group_ids = [int(r["id"]) for r in rows if r.get("id") is not None]
            mem_resp = (
                client.table("community_group_members")
                .select("group_id")
                .eq("user_id", viewer_user_id)
                .in_("group_id", group_ids)
                .execute()
            )
            member_group_ids = {int(m["group_id"]) for m in (mem_resp.data or []) if m.get("group_id") is not None}
        return [_build_group_item(r, member_group_ids=member_group_ids) for r in rows]
    except Exception:
        return []


def _load_events_calendar(client, viewer_user_id: str | None = None) -> list[CommunityEventCalendarItem]:
    try:
        response = (
            client.table("community_events_calendar")
            .select("*")
            .order("event_date", desc=False)
            .limit(20)
            .execute()
        )
        rows = response.data or []
        attending_event_ids: set[int] = set()
        if viewer_user_id and rows:
            event_ids = [int(r["id"]) for r in rows if r.get("id") is not None]
            att_resp = (
                client.table("community_event_attendees")
                .select("event_id")
                .eq("user_id", viewer_user_id)
                .in_("event_id", event_ids)
                .execute()
            )
            attending_event_ids = {int(a["event_id"]) for a in (att_resp.data or []) if a.get("event_id") is not None}
        return [_build_event_calendar_item(r, attending_event_ids=attending_event_ids) for r in rows]
    except Exception:
        return []


def _load_notifications(client, viewer_user_id: str) -> tuple[list[CommunityNotificationItem], int]:
    try:
        response = (
            client.table("community_notifications")
            .select("*")
            .eq("user_id", viewer_user_id)
            .order("created_at", desc=True)
            .limit(20)
            .execute()
        )
        rows = response.data or []
        items = [
            CommunityNotificationItem(
                id=str(r.get("id") or ""),
                type=str(r.get("type") or "info"),
                title=str(r.get("title") or ""),
                body=str(r.get("body") or ""),
                is_read=bool(r.get("is_read", False)),
                created_at=_format_datetime_label(r.get("created_at")),
            )
            for r in rows
        ]
        unread = sum(1 for item in items if not item.is_read)
        return items, unread
    except Exception:
        return [], 0


def get_community_groups(
    current_user: AuthUserProfile | None,
    access_token: str | None,
) -> list[CommunityGroupItem]:
    client = _get_client(access_token)
    viewer_id = current_user.user_id if current_user else None
    return _load_groups(client, viewer_id)


def create_community_group(
    payload: CommunityGroupCreateRequest,
    current_user: AuthUserProfile,
    access_token: str,
) -> CommunityGroupMembershipResponse:
    client = _get_client(access_token)
    profile_id = f"user:{current_user.user_id}"
    row = {
        "name": payload.name,
        "description": payload.description or "",
        "icon": payload.icon or "👥",
        "category": payload.category or "general",
        "created_by_profile_id": profile_id,
        "created_by_user_id": current_user.user_id,
        "member_count": 1,
        "is_official": False,
    }
    try:
        resp = client.table("community_groups").insert(row).execute()
        group_row = (resp.data or [{}])[0]
        group_id = int(group_row.get("id") or 0)
        # Auto-join as admin
        client.table("community_group_members").insert({
            "group_id": group_id,
            "user_id": current_user.user_id,
            "profile_id": profile_id,
            "role": "admin",
        }).execute()
        group_item = _build_group_item(group_row, member_group_ids={group_id})
        return CommunityGroupMembershipResponse(group=group_item, is_member=True)
    except Exception as exc:
        raise CommunityDataUnavailableError("Impossible de creer le groupe.") from exc


def toggle_community_group_membership(
    group_id: int,
    current_user: AuthUserProfile,
    access_token: str,
) -> CommunityGroupMembershipResponse:
    client = _get_client(access_token)
    user_id = current_user.user_id
    profile_id = f"user:{user_id}"
    existing = (
        client.table("community_group_members")
        .select("id")
        .eq("group_id", group_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    is_member = bool(existing.data)
    if is_member:
        client.table("community_group_members").delete().eq("group_id", group_id).eq("user_id", user_id).execute()
        try:
            client.rpc("decrement_group_member_count", {"p_group_id": group_id}).execute()
        except Exception:
            pass
        new_is_member = False
    else:
        client.table("community_group_members").insert({
            "group_id": group_id,
            "user_id": user_id,
            "profile_id": profile_id,
            "role": "member",
        }).execute()
        try:
            client.rpc("increment_group_member_count", {"p_group_id": group_id}).execute()
        except Exception:
            pass
        new_is_member = True
    group_resp = client.table("community_groups").select("*").eq("id", group_id).limit(1).execute()
    group_row = (group_resp.data or [{}])[0]
    group_item = _build_group_item(group_row, member_group_ids={group_id} if new_is_member else set())
    return CommunityGroupMembershipResponse(group=group_item, is_member=new_is_member)


def get_community_events_calendar(
    current_user: AuthUserProfile | None,
    access_token: str | None,
) -> list[CommunityEventCalendarItem]:
    client = _get_client(access_token)
    viewer_id = current_user.user_id if current_user else None
    return _load_events_calendar(client, viewer_id)


def create_community_event(
    payload: CommunityEventCreateRequest,
    current_user: AuthUserProfile,
    access_token: str,
) -> CommunityEventAttendanceResponse:
    client = _get_client(access_token)
    profile_id = f"user:{current_user.user_id}"
    row = {
        "name": payload.name,
        "description": payload.description or "",
        "event_date": payload.event_date,
        "event_time": payload.event_time or "",
        "location_type": payload.location_type or "online",
        "location_detail": payload.location_detail or "",
        "created_by_profile_id": profile_id,
        "created_by_user_id": current_user.user_id,
        "attendee_count": 1,
        "is_official": False,
    }
    try:
        resp = client.table("community_events_calendar").insert(row).execute()
        event_row = (resp.data or [{}])[0]
        event_id = int(event_row.get("id") or 0)
        client.table("community_event_attendees").insert({
            "event_id": event_id,
            "user_id": current_user.user_id,
            "profile_id": profile_id,
        }).execute()
        event_item = _build_event_calendar_item(event_row, attending_event_ids={event_id})
        return CommunityEventAttendanceResponse(event=event_item, is_attending=True)
    except Exception as exc:
        raise CommunityDataUnavailableError("Impossible de creer l'evenement.") from exc


def toggle_community_event_attendance(
    event_id: int,
    current_user: AuthUserProfile,
    access_token: str,
) -> CommunityEventAttendanceResponse:
    client = _get_client(access_token)
    user_id = current_user.user_id
    profile_id = f"user:{user_id}"
    existing = (
        client.table("community_event_attendees")
        .select("id")
        .eq("event_id", event_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    is_attending = bool(existing.data)
    if is_attending:
        client.table("community_event_attendees").delete().eq("event_id", event_id).eq("user_id", user_id).execute()
        try:
            client.rpc("decrement_event_attendee_count", {"p_event_id": event_id}).execute()
        except Exception:
            pass
        new_is_attending = False
    else:
        client.table("community_event_attendees").insert({
            "event_id": event_id,
            "user_id": user_id,
            "profile_id": profile_id,
        }).execute()
        try:
            client.rpc("increment_event_attendee_count", {"p_event_id": event_id}).execute()
        except Exception:
            pass
        new_is_attending = True
    event_resp = client.table("community_events_calendar").select("*").eq("id", event_id).limit(1).execute()
    event_row = (event_resp.data or [{}])[0]
    event_item = _build_event_calendar_item(event_row, attending_event_ids={event_id} if new_is_attending else set())
    return CommunityEventAttendanceResponse(event=event_item, is_attending=new_is_attending)


def get_community_notifications(
    current_user: AuthUserProfile,
    access_token: str,
) -> CommunityNotificationsResponse:
    client = _get_client(access_token)
    items, unread = _load_notifications(client, current_user.user_id)
    return CommunityNotificationsResponse(notifications=items, unread_count=unread)


def mark_community_notification_read(
    notification_id: str,
    current_user: AuthUserProfile,
    access_token: str,
) -> CommunityNotificationsResponse:
    client = _get_client(access_token)
    try:
        client.table("community_notifications").update({"is_read": True}).eq("id", notification_id).eq("user_id", current_user.user_id).execute()
    except Exception:
        pass
    items, unread = _load_notifications(client, current_user.user_id)
    return CommunityNotificationsResponse(notifications=items, unread_count=unread)


def _load_thread_messages(client, conversation_id: str) -> list[CommunityAssistantThreadMessageItem]:
    response = (
        client.table("chat_messages")
        .select("id,sender_role,body,created_at")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
    )
    messages = []
    for item in (response.data or []):
        sender_role = str(item.get("sender_role") or "assistant")
        messages.append(
            CommunityAssistantThreadMessageItem(
                id=str(item.get("id") or ""),
                from_role="me" if sender_role == "user" else "them",
                text=str(item.get("body") or ""),
                time=_format_datetime_label(item.get("created_at")),
            ),
        )
    return messages


def _find_existing_assistant_thread(client, current_user: AuthUserProfile) -> str | None:
    response = (
        client.table("chat_conversations")
        .select("id")
        .eq("user_id", current_user.user_id)
        .eq("source", "community_piehub")
        .order("updated_at", desc=True)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    if not rows:
        return None
    return str(rows[0].get("id") or "")


def get_community_assistant_thread(
    current_user: AuthUserProfile,
    access_token: str | None = None,
) -> CommunityAssistantThreadResponse:
    client = _get_client(access_token)
    conversation_id = _find_existing_assistant_thread(client, current_user)
    if not conversation_id:
        return CommunityAssistantThreadResponse(
            conversation_id=None,
            messages=[
                CommunityAssistantThreadMessageItem(
                    id="starter",
                    from_role="them",
                    text="Bonjour, je suis Guide PieHUB. Posez votre question sur Campus France, le visa, la Belgique ou votre dossier, et je vous oriente vers la bonne suite.",
                    time="A l'instant",
                ),
            ],
        )

    return CommunityAssistantThreadResponse(
        conversation_id=conversation_id,
        messages=_load_thread_messages(client, conversation_id),
    )


def send_community_assistant_message(
    payload: CommunityAssistantMessageRequest,
    current_user: AuthUserProfile,
    access_token: str | None = None,
) -> CommunityAssistantThreadResponse:
    client = _get_client(access_token)
    conversation_id = ensure_chat_conversation(
        page_path="/communaute",
        first_user_message=payload.message,
        conversation_id=payload.conversation_id,
        current_user=current_user,
        access_token=access_token,
        source="community_piehub",
    )

    store_chat_message(
        conversation_id=conversation_id,
        sender_role="user",
        body=payload.message,
        current_user=current_user,
        metadata={"page_path": "/communaute", "source": "community_piehub"},
        access_token=access_token,
    )

    recent_messages = _load_thread_messages(client, conversation_id or "")
    thread_context = [item.text for item in recent_messages[-4:]]
    ai_response = generate_community_reply(
        CommunityAIReplyRequest(message=payload.message, thread_context=thread_context),
    )
    store_chat_message(
        conversation_id=conversation_id,
        sender_role="assistant",
        body=ai_response.reply,
        current_user=None,
        model_source=ai_response.source,
        metadata={"page_path": "/communaute", "source": "community_piehub"},
        access_token=access_token,
    )
    _log_ai_event(
        client,
        post_id=None,
        comment_id=None,
        conversation_id=conversation_id,
        trigger_message=payload.message,
        decision="replied",
        reason="direct_message",
        source=ai_response.source,
    )
    return CommunityAssistantThreadResponse(
        conversation_id=conversation_id,
        messages=_load_thread_messages(client, conversation_id or ""),
        source=ai_response.source,
    )


def _build_ad_item(row: dict[str, Any], *, viewer_user_id: str | None = None) -> CommunityAdItem:
    return CommunityAdItem(
        id=int(row.get("id") or 0),
        title=str(row.get("title") or ""),
        body=str(row.get("body") or ""),
        image_url=str(row.get("image_url")) if row.get("image_url") else None,
        cta_label=str(row.get("cta_label") or "En savoir plus"),
        cta_url=str(row.get("cta_url") or ""),
        category=str(row.get("category") or "general"),
        moderation_status=str(row.get("moderation_status") or "pending"),
        created_by_profile_id=str(row.get("created_by_profile_id") or "") or None,
        created_at=_format_datetime_label(row.get("created_at")),
        is_own=bool(viewer_user_id and str(row.get("created_by_user_id") or "") == viewer_user_id),
    )


def get_community_ads(
    current_user: AuthUserProfile | None,
    access_token: str | None,
) -> CommunityAdsResponse:
    client = _get_client(access_token)
    viewer_id = current_user.user_id if current_user else None
    try:
        response = (
            client.table("community_ads")
            .select("*")
            .order("created_at", desc=True)
            .limit(40)
            .execute()
        )
        rows = response.data or []
        ads = [_build_ad_item(r, viewer_user_id=viewer_id) for r in rows]
        pending_count = sum(1 for ad in ads if ad.moderation_status == "pending" and ad.is_own)
        return CommunityAdsResponse(ads=ads, pending_count=pending_count)
    except Exception:
        return CommunityAdsResponse(ads=[], pending_count=0)


def create_community_ad(
    payload: CommunityAdCreateRequest,
    current_user: AuthUserProfile,
    access_token: str,
) -> CommunityAdItem:
    client = _get_client(access_token)
    profile_id = f"user:{current_user.user_id}"
    row = {
        "title": payload.title,
        "body": payload.body or "",
        "image_url": payload.image_url,
        "cta_label": payload.cta_label or "En savoir plus",
        "cta_url": payload.cta_url or "",
        "category": payload.category or "general",
        "created_by_profile_id": profile_id,
        "created_by_user_id": current_user.user_id,
        "moderation_status": "pending",
    }
    try:
        resp = client.table("community_ads").insert(row).execute()
        ad_row = (resp.data or [{}])[0]
        return _build_ad_item(ad_row, viewer_user_id=current_user.user_id)
    except Exception as exc:
        raise CommunityDataUnavailableError("Impossible de soumettre la publicité.") from exc


def rewrite_community_text(
    payload: CommunityAIRewriteRequest,
) -> CommunityAIRewriteResponse:
    from .ai_service import _get_cohere_client
    client = _get_cohere_client()
    if client is None:
        return CommunityAIRewriteResponse(rewritten=payload.text, source="fallback")
    try:
        context_hint = {
            "publication": "une publication sur un réseau social communautaire d'étudiants africains en France",
            "publicite": "une publicité sobre et professionnelle pour des étudiants africains",
            "groupe": "la description d'un groupe communautaire pour étudiants",
            "evenement": "l'annonce d'un événement étudiant",
        }.get(payload.context or "publication", "une publication communautaire")
        messages = [
            {
                "role": "user",
                "content": (
                    f"Reformule ce texte pour {context_hint}. "
                    "Garde le sens, améliore le style, reste clair et naturel en français. "
                    "Réponds uniquement avec le texte reformulé, sans commentaire ni explication.\n\n"
                    f"Texte original :\n{payload.text}"
                ),
            }
        ]
        from .ai_service import _extract_text_from_response
        from ..config import settings
        response = client.chat(
            model=settings.cohere_model,
            messages=messages,
        )
        rewritten = _extract_text_from_response(response).strip()
        if not rewritten or len(rewritten) < 4:
            return CommunityAIRewriteResponse(rewritten=payload.text, source="fallback")
        return CommunityAIRewriteResponse(rewritten=rewritten, source="cohere")
    except Exception:
        return CommunityAIRewriteResponse(rewritten=payload.text, source="fallback")
