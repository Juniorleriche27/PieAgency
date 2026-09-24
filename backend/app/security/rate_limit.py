from __future__ import annotations

from collections import defaultdict, deque
from ipaddress import ip_address
from threading import Lock
from time import monotonic

from fastapi import Request
from fastapi.responses import JSONResponse

_RULES: dict[tuple[str, str], tuple[int, int]] = {
    ("POST", "/api/auth/sign-in"): (30, 300),
    ("POST", "/api/auth/web/sign-in"): (30, 300),
    ("POST", "/api/auth/sign-up"): (12, 900),
    ("POST", "/api/auth/web/sign-up"): (12, 900),
    ("POST", "/api/auth/forgot-password"): (6, 900),
    ("POST", "/api/auth/reset-password"): (12, 900),
    ("POST", "/api/auth/sso/exchange"): (30, 300),
    ("POST", "/api/contact-requests"): (12, 1800),
    ("POST", "/api/partnership-requests"): (8, 1800),
}

# Prefix rules protect high-write community surfaces. Exact rules above keep
# precedence. Limits are per client IP and intentionally generous for normal use.
_PREFIX_RULES: tuple[tuple[str, str, tuple[int, int]], ...] = (
    ("POST", "/api/community/assets/upload", (20, 600)),
    ("POST", "/api/community/assistant/messages", (30, 300)),
    ("POST", "/api/community/direct-messages", (60, 300)),
    ("POST", "/api/community/reports", (10, 600)),
    ("POST", "/api/community/posts", (20, 300)),
    ("POST", "/api/community/comments", (40, 300)),
    ("POST", "/api/community/groups", (10, 600)),
    ("POST", "/api/community/events-calendar", (10, 600)),
)
_hits: dict[tuple[str, str, str], deque[float]] = defaultdict(deque)
_lock = Lock()

def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "").split(",", 1)[0].strip()
    if forwarded:
        try:
            return str(ip_address(forwarded))
        except ValueError:
            pass
    return request.client.host if request.client else "unknown"

def _rule_for(method: str, path: str) -> tuple[int, int] | None:
    exact = _RULES.get((method, path))
    if exact:
        return exact
    for rule_method, prefix, rule in _PREFIX_RULES:
        if method == rule_method and (path == prefix or path.startswith(prefix + "/")):
            return rule
    # Dynamic post/comment actions (comments, reactions, votes, shares) are also writes.
    if method in {"POST", "PATCH", "DELETE"} and path.startswith("/api/community/"):
        return (90, 300)
    return None

def check_rate_limit(request: Request) -> JSONResponse | None:
    rule = _rule_for(request.method, request.url.path)
    if not rule:
        return None
    limit, window = rule
    now = monotonic()
    key = (_client_ip(request), request.method, request.url.path)
    with _lock:
        q = _hits[key]
        cutoff = now - window
        while q and q[0] <= cutoff:
            q.popleft()
        if len(q) >= limit:
            retry_after = max(1, int(window - (now - q[0])))
            return JSONResponse(status_code=429, content={"detail": "Trop de tentatives. Réessayez dans quelques instants."}, headers={"Retry-After": str(retry_after)})
        q.append(now)
        if len(_hits) > 10000:
            stale=[k for k,v in _hits.items() if not v or v[-1] <= cutoff]
            for k in stale[:2000]: _hits.pop(k, None)
    return None
