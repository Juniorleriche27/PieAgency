import inspect

try:
    from backend.app.services import auth_service, community_service
except ModuleNotFoundError:
    from app.services import auth_service, community_service


def test_community_hot_paths_use_bounded_payloads():
    assert community_service.COMMUNITY_BOOTSTRAP_POST_LIMIT <= 12
    assert community_service.COMMUNITY_BOOTSTRAP_PROFILE_LIMIT <= 24
    assert community_service.COMMUNITY_STORY_LIMIT <= 20
    assert community_service.COMMUNITY_GROUP_LIMIT <= 16
    assert community_service.COMMUNITY_EVENT_LIMIT <= 12
    assert community_service.COMMUNITY_NOTIFICATION_LIMIT <= 12
    assert community_service.COMMUNITY_AD_LIMIT <= 12
    assert community_service.COMMUNITY_DIRECT_THREAD_LIMIT <= 20
    assert community_service.COMMUNITY_DIRECT_MESSAGE_LIMIT <= 40


def test_feed_reads_use_explicit_postgrest_projections():
    post_source = inspect.getsource(community_service._load_post_rows)
    comment_source = inspect.getsource(community_service._load_comment_rows)
    profile_source = inspect.getsource(community_service._load_profiles)
    assert 'select(COMMUNITY_POST_SELECT)' in post_source
    assert 'select(COMMUNITY_COMMENT_SELECT)' in comment_source
    assert 'select(COMMUNITY_PROFILE_SELECT)' in profile_source
    assert 'select("*")' not in post_source
    assert 'select("*")' not in comment_source
    assert 'select("*")' not in profile_source


def test_profile_listing_does_not_recompute_metrics_per_profile():
    source = inspect.getsource(community_service._load_profiles)
    assert '_build_profile_metrics' not in source
    assert '_latest_profile_activity_label' not in source


def test_anonymous_bootstrap_has_short_ttl_cache():
    source = inspect.getsource(community_service.get_community_bootstrap)
    assert 'current_user is None' in source
    assert '_anonymous_bootstrap_cache' in source
    assert community_service.COMMUNITY_ANONYMOUS_BOOTSTRAP_CACHE_SECONDS <= 30


def test_direct_message_read_marking_is_batched():
    source = inspect.getsource(community_service._load_direct_messages)
    assert '.in_("id", unread_ids)' in source
    assert 'for message_id in unread_ids' not in source


def test_auth_profile_polling_uses_explicit_projection():
    source = inspect.getsource(auth_service._load_profile_row)
    assert 'user_id,email,full_name,phone,country,role,is_active' in source
    assert 'select("*")' not in source
