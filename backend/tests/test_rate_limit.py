from backend.app.security import rate_limit

class Client:
    host = "127.0.0.1"
class URL:
    path = "/api/auth/forgot-password"
class Request:
    method = "POST"
    url = URL()
    client = Client()
    headers = {}

def test_rate_limit_rejects_after_threshold():
    rate_limit._hits.clear()
    req=Request()
    for _ in range(6):
        assert rate_limit.check_rate_limit(req) is None
    response=rate_limit.check_rate_limit(req)
    assert response is not None
    assert response.status_code == 429
    assert "Retry-After" in response.headers

def test_unlimited_path_is_ignored():
    req=Request(); req.url=type("URL",(),{"path":"/api/health"})()
    assert rate_limit.check_rate_limit(req) is None
