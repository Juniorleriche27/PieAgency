from unittest.mock import Mock, patch
from backend.app.services import ai_service

def test_knowlia_payload_is_stateless_generate_contract():
    payload=ai_service._knowlia_payload([{"role":"user","content":"Bonjour"}])
    assert payload["tenant_id"] == "pieagency"
    assert payload["messages"] == [{"role":"user","content":"Bonjour"}]
    assert "project_id" not in payload
    assert "folder_id" not in payload
    assert "use_memory" not in payload

def test_knowlia_generate_reads_content_only():
    response=Mock(); response.raise_for_status.return_value=None; response.json.return_value={"data":{"content":"Réponse Knowlia","provider":"test","model":"test"}}
    client=Mock(); client.__enter__=Mock(return_value=client); client.__exit__=Mock(return_value=False); client.post.return_value=response
    with patch.object(ai_service.settings,"knowlia_api_key","test-key"), patch("backend.app.services.ai_service.httpx.Client",return_value=client):
        assert ai_service._knowlia_generate_text([{"role":"user","content":"Bonjour"}]) == "Réponse Knowlia"
    sent=client.post.call_args.kwargs["json"]
    assert sent["tenant_id"] == "pieagency"
    assert "use_memory" not in sent
