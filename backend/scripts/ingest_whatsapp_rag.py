#!/usr/bin/env python3
"""
Ingest WhatsApp Campus France messages into Supabase as RAG vectors.

Usage:
    python scripts/ingest_whatsapp_rag.py \
        --csv path/to/messages_clean.csv \
        --supabase-url https://xxx.supabase.co \
        --supabase-key <service_role_key> \
        --cohere-key <cohere_api_key>

Or set env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, COHERE_API_KEY
and just pass --csv.
"""

import argparse
import csv
import os
import re
import sys
import time

import cohere
import httpx

# ── Config ──────────────────────────────────────────────────────────────────
EMBED_MODEL = "embed-multilingual-v3.0"
EMBED_DIMS = 1024
EMBED_BATCH = 96          # Cohere max batch = 96 for v3
MIN_CHARS = 80            # Skip messages shorter than this
CHUNK_WINDOW = 4          # Consecutive messages grouped into one chunk
CHUNK_OVERLAP = 1         # Overlap between windows
SLEEP_BETWEEN_BATCHES = 1 # seconds — avoid rate-limit
# ─────────────────────────────────────────────────────────────────────────────

URL_RE = re.compile(r"https?://\S+")
MEDIA_RE = re.compile(r"^\s*(IMG|PTT|VID|AUD|STI|DOC)-\d{8}-WA\d+\.\w+", re.IGNORECASE)
WHATSAPP_SYSTEM_RE = re.compile(
    r"(Messages and calls are end-to-end encrypted|"
    r"You were added|"
    r"changed the subject|"
    r"added you|"
    r"left|"
    r"was added|"
    r"changed this group)",
    re.IGNORECASE,
)


def clean_message(text: str) -> str:
    text = text.strip()
    # Remove WhatsApp bold/italic markers
    text = re.sub(r"\*([^*]+)\*", r"\1", text)
    text = re.sub(r"_([^_]+)_", r"\1", text)
    # Remove bare URLs (they add noise, not meaning)
    text = URL_RE.sub("", text)
    # Collapse whitespace
    text = re.sub(r"\s{2,}", " ", text).strip()
    return text


def is_useful(text: str) -> bool:
    if len(text) < MIN_CHARS:
        return False
    if MEDIA_RE.match(text):
        return False
    if WHATSAPP_SYSTEM_RE.search(text):
        return False
    # Skip if mostly emoji / numbers
    alpha = sum(1 for c in text if c.isalpha())
    if alpha < 30:
        return False
    return True


def load_and_clean(csv_path: str) -> list[str]:
    with open(csv_path, encoding="utf-8", errors="replace") as f:
        rows = list(csv.DictReader(f))

    cleaned: list[str] = []
    for row in rows:
        msg = clean_message(row.get("message", ""))
        if is_useful(msg):
            cleaned.append(msg)

    # Deduplicate preserving order
    seen: set[str] = set()
    unique: list[str] = []
    for msg in cleaned:
        key = msg[:120]  # fingerprint by first 120 chars
        if key not in seen:
            seen.add(key)
            unique.append(msg)

    print(f"Loaded {len(rows)} rows → {len(cleaned)} useful → {len(unique)} after dedup")
    return unique


def make_chunks(messages: list[str], window: int, overlap: int) -> list[str]:
    """Slide a window over messages to create context-rich chunks."""
    chunks: list[str] = []
    step = window - overlap
    for i in range(0, len(messages), step):
        group = messages[i : i + window]
        chunk = "\n---\n".join(group)
        if len(chunk) >= MIN_CHARS:
            chunks.append(chunk)
    print(f"Created {len(chunks)} chunks (window={window}, overlap={overlap})")
    return chunks


def embed_batches(
    client: cohere.ClientV2,
    texts: list[str],
    input_type: str = "search_document",
) -> list[list[float]]:
    all_embeddings: list[list[float]] = []
    total = len(texts)
    for start in range(0, total, EMBED_BATCH):
        batch = texts[start : start + EMBED_BATCH]
        resp = client.embed(
            texts=batch,
            model=EMBED_MODEL,
            input_type=input_type,
            embedding_types=["float"],
        )
        all_embeddings.extend(resp.embeddings.float_)  # type: ignore[union-attr]
        done = min(start + EMBED_BATCH, total)
        print(f"  Embedded {done}/{total}...", end="\r", flush=True)
        if done < total:
            time.sleep(SLEEP_BETWEEN_BATCHES)
    print(f"  Embedded {total}/{total} — done.  ")
    return all_embeddings


def upsert_to_supabase(
    supabase_url: str,
    supabase_key: str,
    chunks: list[str],
    embeddings: list[list[float]],
) -> None:
    url = f"{supabase_url.rstrip('/')}/rest/v1/rag_chunks"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

    BATCH = 50
    total = len(chunks)
    for start in range(0, total, BATCH):
        rows = [
            {"content": chunks[i], "embedding": embeddings[i], "source": "whatsapp_campus_france"}
            for i in range(start, min(start + BATCH, total))
        ]
        resp = httpx.post(url, headers=headers, json=rows, timeout=30)
        if resp.status_code not in (200, 201):
            print(f"\nSupabase error {resp.status_code}: {resp.text[:300]}")
            sys.exit(1)
        done = min(start + BATCH, total)
        print(f"  Inserted {done}/{total} rows...", end="\r", flush=True)
    print(f"  Inserted {total}/{total} rows — done.  ")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest WhatsApp RAG data into Supabase")
    parser.add_argument("--csv", required=True, help="Path to messages_clean.csv")
    parser.add_argument("--supabase-url", default=os.getenv("SUPABASE_URL", ""))
    parser.add_argument("--supabase-key", default=os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SECRET_KEY", ""))
    parser.add_argument("--cohere-key", default=os.getenv("COHERE_API_KEY", ""))
    args = parser.parse_args()

    if not all([args.supabase_url, args.supabase_key, args.cohere_key]):
        parser.error("Missing --supabase-url, --supabase-key or --cohere-key (or set env vars)")

    print("=== Step 1: Load and clean messages ===")
    messages = load_and_clean(args.csv)

    print("=== Step 2: Create chunks ===")
    chunks = make_chunks(messages, window=CHUNK_WINDOW, overlap=CHUNK_OVERLAP)

    print("=== Step 3: Embed with Cohere ===")
    cohere_client = cohere.ClientV2(api_key=args.cohere_key)
    embeddings = embed_batches(cohere_client, chunks, input_type="search_document")

    print("=== Step 4: Insert into Supabase ===")
    upsert_to_supabase(args.supabase_url, args.supabase_key, chunks, embeddings)

    print(f"\nDone! {len(chunks)} chunks are now in Supabase rag_chunks.")


if __name__ == "__main__":
    main()
