from types import SimpleNamespace

import pytest

from backend.app.schemas import ProgressivePathStepStatus
from backend.app.services import progressive_path_service as service


def _step(
    step_id: str,
    order: int,
    *,
    status: ProgressivePathStepStatus,
    is_current: bool,
):
    return SimpleNamespace(
        id=step_id,
        order=order,
        status=status,
        is_current=is_current,
    )


def _path(*steps, current_step=None):
    return SimpleNamespace(steps=list(steps), current_step=current_step)


def test_complete_rejects_non_current_step(monkeypatch):
    current = _step("prepare-documents", 5, status=ProgressivePathStepStatus.IN_PROGRESS, is_current=True)
    future = _step("prepare-cv", 6, status=ProgressivePathStepStatus.NOT_STARTED, is_current=False)
    monkeypatch.setattr(service, "_client_or_none", lambda _: object())
    monkeypatch.setattr(service, "_load_path_response", lambda *_: _path(current, future, current_step=current))

    with pytest.raises(PermissionError, match="Seule l'etape courante"):
        service.complete_candidate_progressive_path_step("candidate-1", future.id, "token")


def test_reopen_only_accepts_completed_step(monkeypatch):
    current = _step("prepare-documents", 5, status=ProgressivePathStepStatus.IN_PROGRESS, is_current=True)
    monkeypatch.setattr(service, "_client_or_none", lambda _: object())
    monkeypatch.setattr(service, "_load_path_response", lambda *_: _path(current, current_step=current))

    with pytest.raises(PermissionError, match="Seule une etape terminee"):
        service.reopen_candidate_progressive_path_step("candidate-1", current.id, "token")


def test_complete_current_step_advances_server_owned_cursor(monkeypatch):
    current = _step("prepare-documents", 5, status=ProgressivePathStepStatus.IN_PROGRESS, is_current=True)
    next_step = _step("prepare-cv", 6, status=ProgressivePathStepStatus.NOT_STARTED, is_current=False)
    initial = _path(current, next_step, current_step=current)
    final = _path(
        _step("prepare-documents", 5, status=ProgressivePathStepStatus.COMPLETED, is_current=False),
        _step("prepare-cv", 6, status=ProgressivePathStepStatus.IN_PROGRESS, is_current=True),
        current_step=next_step,
    )
    responses = iter([initial, final])
    status_calls = []
    cursor_calls = []

    monkeypatch.setattr(service, "_client_or_none", lambda _: object())
    monkeypatch.setattr(service, "_load_path_response", lambda *_: next(responses))
    monkeypatch.setattr(
        service,
        "_get_active_step_rows",
        lambda *_: [
            {"id": current.id, "step_order": current.order},
            {"id": next_step.id, "step_order": next_step.order},
        ],
    )
    monkeypatch.setattr(
        service,
        "_set_step_status",
        lambda _client, candidate_id, step_id, status: status_calls.append((candidate_id, step_id, status)),
    )
    monkeypatch.setattr(
        service,
        "_set_current_step",
        lambda _client, candidate_id, step_id: cursor_calls.append((candidate_id, step_id)),
    )

    result = service.complete_candidate_progressive_path_step("candidate-1", current.id, "token")

    assert result is final
    assert status_calls == [
        ("candidate-1", current.id, ProgressivePathStepStatus.COMPLETED),
        ("candidate-1", next_step.id, ProgressivePathStepStatus.IN_PROGRESS),
    ]
    assert cursor_calls == [("candidate-1", next_step.id)]
