from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from ..schemas import (
    AIChatRequest,
    AIChatResponse,
    AIPageInsightResponse,
    CommunityAIReplyRequest,
    CommunityAIReplyResponse,
)
from ..services.ai_service import (
    generate_chat_response,
    generate_community_reply,
    generate_page_insight,
    stream_chat_response,
)

router = APIRouter()


@router.get("/ai/page-insight", response_model=AIPageInsightResponse)
def get_page_insight(path: str = Query(default="/", max_length=200)) -> AIPageInsightResponse:
    return generate_page_insight(path)


@router.post("/ai/community-reply", response_model=CommunityAIReplyResponse)
def community_reply(payload: CommunityAIReplyRequest) -> CommunityAIReplyResponse:
    return generate_community_reply(payload)


@router.post("/ai/chat", response_model=AIChatResponse)
def chat_with_assistant(payload: AIChatRequest) -> AIChatResponse:
    return generate_chat_response(payload, None, None)


@router.post("/ai/chat/stream")
def stream_chat_with_assistant(payload: AIChatRequest) -> StreamingResponse:
    return StreamingResponse(
        stream_chat_response(payload, None, None),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
