from fastapi import APIRouter, Depends, File as FastAPIFile, HTTPException, UploadFile

from ..dependencies.auth import get_current_access_token, get_current_user
from ..schemas import (
    AddDocumentRequest,
    AuthMessageResponse,
    AuthUserProfile,
    CurrentSubscriptionResponse,
    PrivateDiagnosticResponse,
    PrivateOnboardingSubmitRequest,
    PrivateProfileResponse,
    PrivateProfileUpdateRequest,
    PrivateProductItem,
    PrivateProductListResponse,
    PrivateResourceListResponse,
    PrivateSubscriptionListResponse,
    SubscriptionPlanSelectRequest,
    StudentDocumentItem,
    StudentDocumentListResponse,
)
from ..services.private_catalog_service import (
    add_student_document,
    get_private_diagnostic,
    get_private_profile,
    get_private_product,
    get_current_subscription,
    list_private_products,
    list_private_resources,
    list_private_subscriptions,
    list_student_documents,
    save_private_onboarding,
    set_current_subscription,
    update_private_profile,
    upload_document_file,
)

router = APIRouter()


@router.get("/private/products", response_model=PrivateProductListResponse)
def private_products(
    current_user: AuthUserProfile = Depends(get_current_user),
) -> PrivateProductListResponse:
    return list_private_products()


@router.get("/private/products/{product_id}", response_model=PrivateProductItem)
def private_product_detail(
    product_id: str,
    current_user: AuthUserProfile = Depends(get_current_user),
) -> PrivateProductItem:
    try:
        return get_private_product(product_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/private/resources", response_model=PrivateResourceListResponse)
def private_resources(
    current_user: AuthUserProfile = Depends(get_current_user),
) -> PrivateResourceListResponse:
    return list_private_resources()


@router.get("/private/subscriptions", response_model=PrivateSubscriptionListResponse)
def private_subscriptions(
    current_user: AuthUserProfile = Depends(get_current_user),
) -> PrivateSubscriptionListResponse:
    return list_private_subscriptions()


@router.get("/private/subscription/current", response_model=CurrentSubscriptionResponse)
def private_current_subscription(
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CurrentSubscriptionResponse:
    return get_current_subscription(current_user.user_id, access_token)


@router.patch("/private/subscription/current", response_model=CurrentSubscriptionResponse)
def update_private_current_subscription(
    payload: SubscriptionPlanSelectRequest,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> CurrentSubscriptionResponse:
    return set_current_subscription(current_user.user_id, payload.plan_id, access_token)


@router.get("/private/profile", response_model=PrivateProfileResponse)
def private_profile(
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> PrivateProfileResponse:
    return get_private_profile(current_user.user_id, access_token)


@router.patch("/private/profile", response_model=PrivateProfileResponse)
def update_profile(
    payload: PrivateProfileUpdateRequest,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> PrivateProfileResponse:
    return update_private_profile(current_user.user_id, payload, access_token)


@router.get("/private/documents", response_model=StudentDocumentListResponse)
def private_documents(
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> StudentDocumentListResponse:
    return list_student_documents(current_user.user_id, access_token)


@router.post("/private/documents", response_model=StudentDocumentItem)
def add_document(
    body: AddDocumentRequest,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> StudentDocumentItem:
    return add_student_document(current_user.user_id, body.name, access_token)


@router.post("/private/documents/{document_id}/upload")
async def upload_document(
    document_id: str,
    file: UploadFile = FastAPIFile(...),
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> dict[str, bool]:
    content = await file.read()
    ok = upload_document_file(
        current_user.user_id,
        document_id,
        content,
        file.filename or "file",
        access_token,
    )
    return {"ok": ok}


@router.post("/private/onboarding", response_model=AuthMessageResponse)
def private_onboarding(
    payload: PrivateOnboardingSubmitRequest,
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> AuthMessageResponse:
    return save_private_onboarding(current_user.user_id, payload, access_token)


@router.get("/private/diagnostic", response_model=PrivateDiagnosticResponse)
def private_diagnostic(
    current_user: AuthUserProfile = Depends(get_current_user),
    access_token: str = Depends(get_current_access_token),
) -> PrivateDiagnosticResponse:
    return get_private_diagnostic(current_user.user_id, access_token)
