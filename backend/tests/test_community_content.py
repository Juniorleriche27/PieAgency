from backend.app.main import app
from backend.app.schemas import AuthUserProfile, PlatformRole
from backend.app.services.community_service import (
    _build_story_item,
    _can_manage_row,
    upload_community_asset,
)


def _user(user_id: str = "00000000-0000-0000-0000-000000000001", role: PlatformRole = PlatformRole.STUDENT):
    return AuthUserProfile(
        user_id=user_id,
        email="student@example.com",
        full_name="Étudiant Test",
        role=role,
        is_active=True,
    )


def test_community_content_routes_are_registered():
    routes = {route.path for route in app.routes}
    assert "/api/community/assets/upload" in routes
    assert "/api/community/stories" in routes
    assert "/api/community/posts/{post_id}/shares" in routes
    assert "/api/community/comments/{comment_id}/reaction" in routes


def test_only_author_or_admin_can_manage_content():
    row = {"author_user_id": "00000000-0000-0000-0000-000000000001"}
    assert _can_manage_row(row, _user()) is True
    assert _can_manage_row(row, _user("00000000-0000-0000-0000-000000000002")) is False
    assert _can_manage_row(
        row,
        _user("00000000-0000-0000-0000-000000000002", PlatformRole.ADMIN),
    ) is True


def test_asset_validation_rejects_unsupported_content_before_storage():
    try:
        upload_community_asset(b"executable", "virus.exe", "application/x-msdownload", _user())
    except ValueError as exc:
        assert "Format non autorisé" in str(exc)
    else:
        raise AssertionError("Le format dangereux aurait dû être refusé")


def test_story_exposes_delete_permission_only_to_its_author():
    row = {
        "id": "story-1",
        "author_profile_id": "profile-1",
        "author_user_id": "user-1",
        "content": "Mon arrivée à Paris",
        "created_at": "2026-08-08T10:00:00+00:00",
        "expires_at": "2026-08-09T10:00:00+00:00",
    }
    assert _build_story_item(row, "user-1").viewer_can_delete is True
    assert _build_story_item(row, "user-2").viewer_can_delete is False
