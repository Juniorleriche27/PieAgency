"""
RAG (Retrieval-Augmented Generation) service.

Embeds a query with Cohere and retrieves the most relevant chunks
from the Supabase rag_chunks table via pgvector similarity search.
"""

import logging

import cohere
import httpx

from ..config import settings

logger = logging.getLogger(__name__)

EMBED_MODEL = "embed-multilingual-v3.0"
_cohere_client: cohere.ClientV2 | None = None


def _get_cohere() -> cohere.ClientV2 | None:
    global _cohere_client
    if _cohere_client is None and settings.cohere_enabled:
        _cohere_client = cohere.ClientV2(api_key=settings.cohere_api_key)
    return _cohere_client


def _embed_query(query: str) -> list[float] | None:
    client = _get_cohere()
    if client is None:
        return None
    try:
        resp = client.embed(
            texts=[query],
            model=EMBED_MODEL,
            input_type="search_query",
            embedding_types=["float"],
        )
        return resp.embeddings.float_[0]  # type: ignore[union-attr]
    except Exception:
        logger.warning("RAG: Cohere embed failed", exc_info=True)
        return None


def retrieve_rag_context(query: str, top_k: int = 5, threshold: float = 0.38) -> str:
    """
    Embed the query and retrieve the top-k most relevant WhatsApp chunks.
    Returns a formatted string ready to be injected into a system prompt,
    or an empty string if nothing useful is found.
    """
    if not settings.supabase_enabled:
        return ""

    embedding = _embed_query(query)
    if embedding is None:
        return ""

    url = f"{settings.supabase_url.rstrip('/')}/rest/v1/rpc/match_rag_chunks"
    headers = {
        "apikey": settings.supabase_key,
        "Authorization": f"Bearer {settings.supabase_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "query_embedding": embedding,
        "match_threshold": threshold,
        "match_count": top_k,
    }

    try:
        resp = httpx.post(url, headers=headers, json=payload, timeout=5)
        if resp.status_code != 200:
            logger.warning("RAG: Supabase RPC error %s: %s", resp.status_code, resp.text[:200])
            return ""
        rows: list[dict] = resp.json()
    except Exception:
        logger.warning("RAG: Supabase request failed", exc_info=True)
        return ""

    if not rows:
        return ""

    snippets = [row["content"] for row in rows if row.get("content")]
    if not snippets:
        return ""

    joined = "\n\n---\n\n".join(snippets)
    return (
        "Extraits de conversations reelles d'etudiants sur Campus France "
        "(groupe WhatsApp PieAgency) pertinents pour cette question :\n\n"
        + joined
    )
