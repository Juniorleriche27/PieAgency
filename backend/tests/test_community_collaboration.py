import pytest
from pydantic import ValidationError

from backend.app.main import app
from backend.app.schemas import CommunityGroupMemberRoleRequest


def test_collaboration_routes_are_registered():
    routes = {(route.path, method) for route in app.routes for method in (route.methods or set())}
    assert ("/api/community/groups/{group_id}/members", "GET") in routes
    assert ("/api/community/groups/{group_id}/members/{profile_id}", "PATCH") in routes
    assert ("/api/community/groups/{group_id}/members/{profile_id}", "DELETE") in routes
    assert ("/api/community/notifications/read-all", "POST") in routes
    assert ("/api/community/profiles/{profile_id}/block", "POST") in routes
    assert ("/api/community/blocks", "GET") in routes


def test_group_roles_only_accept_supported_values():
    assert CommunityGroupMemberRoleRequest(role="moderator").role == "moderator"
    assert CommunityGroupMemberRoleRequest(role="member").role == "member"
    with pytest.raises(ValidationError):
        CommunityGroupMemberRoleRequest(role="owner")
