from backend.app.schemas import AIChatRequest, AIMessage
from backend.app.services import ai_service


def request(message: str) -> AIChatRequest:
    return AIChatRequest(
        page_path="/",
        messages=[AIMessage(role="user", content=message)],
    )


def test_personalized_student_request_is_redirected_before_model(monkeypatch):
    calls = {"gateway": 0}
    monkeypatch.setattr(ai_service, "_prepare_conversation", lambda *_args, **_kwargs: "conv-public")

    def forbidden_gateway(*_args, **_kwargs):
        calls["gateway"] += 1
        raise AssertionError("The public chatbot must not call the model for a private dossier request")

    monkeypatch.setattr(ai_service, "_gateway_chat_json", forbidden_gateway)

    response = ai_service.generate_chat_response(
        request("Mon visa est bloqué et voici mon dossier, que dois-je faire maintenant ?"),
        current_user=None,
        access_token=None,
    )

    assert calls["gateway"] == 0
    assert response.source == "fallback"
    assert "espace étudiant" in response.answer
    assert "Assistant.genie" in response.answer
    assert "Ouvrir mon espace étudiant" in response.suggested_actions


def test_stream_personalized_request_is_redirected_without_model(monkeypatch):
    monkeypatch.setattr(ai_service, "_prepare_conversation", lambda *_args, **_kwargs: "conv-stream")
    monkeypatch.setattr(
        ai_service,
        "_gateway_chat_stream",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(
            AssertionError("The public stream must not call the model for a private dossier request")
        ),
    )

    events = "".join(
        ai_service.stream_chat_response(
            request("Analyse ma lettre et dis-moi quoi corriger dans mon dossier"),
            current_user=None,
            access_token=None,
        )
    )

    assert '"source": "fallback"' in events
    assert "Ouvrir mon espace étudiant" in events
    assert "event: done" in events


def test_marketing_question_remains_in_public_scope():
    payload = request("Quels services propose PieAgency et comment prendre rendez-vous ?")
    assert ai_service._public_chat_requires_private_space(payload) is False
    prompt = ai_service._build_stream_chat_system_prompt(payload)
    assert "Périmètre strict" in prompt
    assert "services, offres, produits" in prompt
    assert "ne jamais analyser un dossier" in prompt
    assert "RAG communautaire" in prompt
    assert "Contexte RAG" not in prompt


def test_private_scope_detection_catches_documents_and_personal_strategy():
    assert ai_service._public_chat_requires_private_space(
        request("Peux-tu corriger mon CV pour Campus France ?")
    ) is True
    assert ai_service._public_chat_requires_private_space(
        request("Dans mon cas, quelle stratégie visa dois-je suivre ?")
    ) is True
    assert ai_service._public_chat_requires_private_space(
        request("Combien coûte l'accompagnement PieAgency ?")
    ) is False


def test_marketing_fallback_remains_useful_without_gateway():
    response = ai_service._chat_fallback(
        request("Quels services propose PieAgency et comment ça marche ?")
    )
    assert response.source == "fallback"
    assert "PieAgency" in response.answer
    assert "espace étudiant" in response.answer
    assert "Assistant.genie" in response.answer
    assert "problème technique" not in response.answer
    assert response.escalation_recommended is False
