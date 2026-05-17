from datetime import datetime, timezone

from ..schemas import (
    OfficialDepositItem,
    OfficialDepositRequest,
    ProgressivePathProductRecommendation,
    ProgressivePathRecommendationAction,
    ProgressivePathRecommendations,
    ProgressivePathResponse,
    ProgressivePathStepItem,
    ProgressivePathStepStatus,
)
from .dashboard_service import _client_or_none


DEFAULT_PROGRESSIVE_PATH_STEPS = [
    {
        "id": "understand-profile",
        "title": "Comprendre mon profil",
        "step_order": 1,
        "short_description": "Clarifier votre niveau, votre projet et vos contraintes avant d'avancer.",
        "target_module": "embarquement",
        "target_path": "/espace-etudiant/onboarding",
    },
    {
        "id": "read-diagnostic",
        "title": "Lire mon diagnostic",
        "step_order": 2,
        "short_description": "Identifier vos priorites, vos risques et les prochaines actions utiles.",
        "target_module": "diagnostic",
        "target_path": "/espace-etudiant/diagnostic",
    },
    {
        "id": "define-procedure-strategy",
        "title": "Définir ma stratégie de procédure",
        "step_order": 3,
        "short_description": "Choisir la meilleure trajectoire officielle selon votre profil.",
        "target_module": "tableau_de_bord",
        "target_path": "/espace-etudiant",
    },
    {
        "id": "choose-programs",
        "title": "Choisir mes formations",
        "step_order": 4,
        "short_description": "Construire une liste cohérente de formations et d'écoles à viser.",
        "target_module": "ressources",
        "target_path": "/espace-etudiant/ressources",
    },
    {
        "id": "prepare-study-project",
        "title": "Préparer mon projet d'études",
        "step_order": 5,
        "short_description": "Structurer un projet d'études clair, crédible et défendable.",
        "target_module": "produits_digitaux",
        "target_path": "/espace-etudiant/produits",
    },
    {
        "id": "prepare-career-project",
        "title": "Préparer mon projet professionnel",
        "step_order": 6,
        "short_description": "Relier votre parcours, votre formation cible et vos objectifs professionnels.",
        "target_module": "produits_digitaux",
        "target_path": "/espace-etudiant/produits",
    },
    {
        "id": "prepare-cv",
        "title": "Préparer mon CV",
        "step_order": 7,
        "short_description": "Mettre votre parcours en forme pour les plateformes officielles et les écoles.",
        "target_module": "documents",
        "target_path": "/espace-etudiant/documents",
    },
    {
        "id": "prepare-motivation-letters",
        "title": "Préparer mes lettres de motivation",
        "step_order": 8,
        "short_description": "Rédiger des lettres adaptées à chaque formation visée.",
        "target_module": "produits_digitaux",
        "target_path": "/espace-etudiant/produits",
    },
    {
        "id": "prepare-documents",
        "title": "Préparer mes documents",
        "step_order": 9,
        "short_description": "Rassembler, organiser et vérifier les pièces nécessaires.",
        "target_module": "documents",
        "target_path": "/espace-etudiant/documents",
    },
    {
        "id": "verify-before-official-filing",
        "title": "Vérifier avant dépôt officiel",
        "step_order": 10,
        "short_description": "Contrôler la cohérence du dossier avant action sur les plateformes officielles.",
        "target_module": "assistant",
        "target_path": "/espace-etudiant/assistant",
    },
    {
        "id": "mark-official-filing-done",
        "title": "Déclarer le dépôt officiel comme fait",
        "step_order": 11,
        "short_description": "Indiquer que le dépôt a été effectué sur la plateforme officielle concernée.",
        "target_module": "tableau_de_bord",
        "target_path": "/espace-etudiant",
    },
    {
        "id": "prepare-campus-france-interview",
        "title": "Préparer l'entretien Campus France",
        "step_order": 12,
        "short_description": "Préparer vos réponses et votre argumentaire pour l'entretien.",
        "target_module": "produits_digitaux",
        "target_path": "/espace-etudiant/produits",
    },
    {
        "id": "prepare-visa-file",
        "title": "Préparer le dossier visa",
        "step_order": 13,
        "short_description": "Organiser les justificatifs nécessaires au dossier visa.",
        "target_module": "documents",
        "target_path": "/espace-etudiant/documents",
    },
    {
        "id": "track-after-official-filing",
        "title": "Suivre après dépôt officiel",
        "step_order": 14,
        "short_description": "Suivre les retours, délais et actions après dépôt sur les plateformes officielles.",
        "target_module": "tableau_de_bord",
        "target_path": "/espace-etudiant",
    },
    {
        "id": "prepare-departure",
        "title": "Préparer le départ",
        "step_order": 15,
        "short_description": "Anticiper les démarches pratiques avant le départ.",
        "target_module": "ressources",
        "target_path": "/espace-etudiant/ressources",
    },
]


def _action(
    title: str,
    description: str,
    target_module: str,
    target_path: str,
) -> ProgressivePathRecommendationAction:
    return ProgressivePathRecommendationAction(
        title=title,
        description=description,
        target_module=target_module,
        target_path=target_path,
    )


def _product(
    title: str,
    description: str,
    target_path: str,
) -> ProgressivePathProductRecommendation:
    return ProgressivePathProductRecommendation(
        title=title,
        description=description,
        target_module="produits_digitaux",
        target_path=target_path,
        requires_purchase=True,
    )


def _assistant_action(step_id: str) -> ProgressivePathRecommendationAction:
    return _action(
        "Poser une question a l'assistant dossier",
        "Demandez a l'assistant de vous aider sur cette etape.",
        "assistant_dossier",
        f"/espace-etudiant/assistant?context={step_id}",
    )


def _documents_action(
    title: str = "Ajouter ou verifier le document lie",
    description: str = "Suivez l'etat de vos documents dans l'espace documents.",
) -> ProgressivePathRecommendationAction:
    return _action(title, description, "documents", "/espace-etudiant/documents")


RECOMMENDATION_BY_STEP: dict[str, dict[str, ProgressivePathRecommendationAction | None]] = {
    "understand-profile": {
        "free_action": _action(
            "Completer mon profil",
            "Renseignez vos informations de depart dans l'embarquement.",
            "embarquement",
            "/espace-etudiant/onboarding",
        ),
        "recommended_product": None,
        "document_action": None,
    },
    "read-diagnostic": {
        "free_action": _action(
            "Lire mon diagnostic",
            "Consultez les priorites et les points de vigilance identifies.",
            "diagnostic",
            "/espace-etudiant/diagnostic",
        ),
        "recommended_product": None,
        "document_action": None,
    },
    "define-procedure-strategy": {
        "free_action": _action(
            "Revoir ma strategie",
            "Utilisez le tableau de bord et le diagnostic pour clarifier la trajectoire.",
            "tableau_de_bord",
            "/espace-etudiant",
        ),
        "recommended_product": _product(
            "Kit Campus France complet",
            "Une methode structuree pour preparer votre procedure officielle.",
            "/espace-etudiant/produits/prod-001",
        ),
        "document_action": None,
    },
    "choose-programs": {
        "free_action": _action(
            "Lire les ressources de selection",
            "Utilisez les ressources pour comparer les formations et les ecoles.",
            "ressources",
            "/espace-etudiant/ressources",
        ),
        "recommended_product": _product(
            "Guide ecoles privees",
            "Un guide pour identifier et comparer les ecoles privees pertinentes.",
            "/espace-etudiant/produits/prod-007",
        ),
        "document_action": None,
    },
    "prepare-study-project": {
        "free_action": _action(
            "Continuer avec la checklist",
            "Utilisez les ressources disponibles pour structurer votre projet d'etudes.",
            "ressources",
            "/espace-etudiant/ressources",
        ),
        "recommended_product": _product(
            "Generateur projet d'etudes",
            "Un outil guide pour construire un projet d'etudes coherent.",
            "/espace-etudiant/produits/prod-003",
        ),
        "document_action": None,
    },
    "prepare-career-project": {
        "free_action": _action(
            "Lire les ressources projet professionnel",
            "Appuyez-vous sur les ressources pour relier parcours, formation et objectifs.",
            "ressources",
            "/espace-etudiant/ressources",
        ),
        "recommended_product": _product(
            "Generateur projet professionnel",
            "Un outil guide pour formaliser un projet professionnel coherent.",
            "/espace-etudiant/produits/prod-004",
        ),
        "document_action": None,
    },
    "prepare-cv": {
        "free_action": _documents_action(
            "Verifier mon CV",
            "Ajoutez ou suivez votre CV dans l'espace documents.",
        ),
        "recommended_product": None,
        "document_action": _documents_action("Ouvrir mes documents", "Suivez l'etat de votre CV."),
    },
    "prepare-motivation-letters": {
        "free_action": _action(
            "Lire les exemples de lettres",
            "Consultez les ressources utiles avant de rediger vos lettres.",
            "ressources",
            "/espace-etudiant/ressources",
        ),
        "recommended_product": _product(
            "Bibliotheque de lettres de motivation",
            "Des modeles pour produire des lettres adaptees a chaque formation.",
            "/espace-etudiant/produits/prod-005",
        ),
        "document_action": _documents_action(),
    },
    "prepare-documents": {
        "free_action": _documents_action(
            "Ouvrir mes documents",
            "Ajoutez, verifiez et suivez les pieces necessaires.",
        ),
        "recommended_product": None,
        "document_action": _documents_action(),
    },
    "verify-before-official-filing": {
        "free_action": _documents_action(
            "Verifier mes pieces",
            "Controlez l'etat des documents avant action sur les plateformes officielles.",
        ),
        "recommended_product": _product(
            "Pack correction dossier",
            "Un accompagnement de correction avant depot sur les plateformes officielles.",
            "/espace-etudiant/produits/prod-009",
        ),
        "document_action": _documents_action(),
    },
    "mark-official-filing-done": {
        "free_action": _action(
            "Declarer le depot officiel comme fait",
            "Renseignez la plateforme, la date et la reference du dossier officiel.",
            "official_deposit",
            "/espace-etudiant",
        ),
        "recommended_product": None,
        "document_action": None,
    },
    "prepare-campus-france-interview": {
        "free_action": _action(
            "Lire les ressources entretien",
            "Preparez vos reponses et votre argumentaire avant l'entretien.",
            "ressources",
            "/espace-etudiant/ressources",
        ),
        "recommended_product": _product(
            "Simulateur entretien Campus France",
            "Un simulateur pour s'entrainer avec des questions realistes.",
            "/espace-etudiant/produits/prod-006",
        ),
        "document_action": None,
    },
    "prepare-visa-file": {
        "free_action": _documents_action(
            "Verifier les documents visa",
            "Suivez les justificatifs necessaires au dossier visa.",
        ),
        "recommended_product": _product(
            "Kit Visa etudiant",
            "Un kit pour preparer les pieces et points de vigilance du dossier visa.",
            "/espace-etudiant/produits/prod-002",
        ),
        "document_action": _documents_action(
            "Ouvrir mes documents visa",
            "Ajoutez et suivez les justificatifs visa dans l'espace documents.",
        ),
    },
    "track-after-official-filing": {
        "free_action": _action(
            "Suivre apres depot officiel",
            "Gardez a jour les retours, delais et references de vos plateformes officielles.",
            "official_deposit",
            "/espace-etudiant",
        ),
        "recommended_product": None,
        "document_action": None,
    },
    "prepare-departure": {
        "free_action": _action(
            "Lire les ressources depart",
            "Anticipez les demarches pratiques avant votre depart.",
            "ressources",
            "/espace-etudiant/ressources",
        ),
        "recommended_product": None,
        "document_action": None,
    },
}


def _build_recommendations(
    current_step: ProgressivePathStepItem | None,
) -> ProgressivePathRecommendations:
    if current_step is None:
        return ProgressivePathRecommendations()

    config = RECOMMENDATION_BY_STEP.get(current_step.id, {})
    return ProgressivePathRecommendations(
        current_step_id=current_step.id,
        free_action=config.get("free_action"),
        recommended_product=config.get("recommended_product"),
        assistant_action=_assistant_action(current_step.id),
        document_action=config.get("document_action"),
    )


def _fallback_path(candidate_id: str) -> ProgressivePathResponse:
    steps = [
        ProgressivePathStepItem(
            id=str(step["id"]),
            title=str(step["title"]),
            order=int(step["step_order"]),
            status=(
                ProgressivePathStepStatus.IN_PROGRESS
                if int(step["step_order"]) == 1
                else ProgressivePathStepStatus.NOT_STARTED
            ),
            short_description=str(step["short_description"]),
            is_current=int(step["step_order"]) == 1,
            is_locked=int(step["step_order"]) > 1,
            target_module=str(step.get("target_module") or ""),
            target_path=str(step.get("target_path") or ""),
        )
        for step in DEFAULT_PROGRESSIVE_PATH_STEPS
    ]
    return ProgressivePathResponse(
        candidate_id=candidate_id,
        current_step=steps[0] if steps else None,
        progress_percent=0,
        steps=steps,
        official_deposit=OfficialDepositItem(),
        recommendations=_build_recommendations(steps[0] if steps else None),
    )


def _official_deposit_from_row(row: dict | None) -> OfficialDepositItem:
    if not row:
        return OfficialDepositItem()

    deposit_date = row.get("official_deposit_date")
    return OfficialDepositItem(
        has_declared=True,
        platform_type=row.get("platform_type"),
        platform_name=row.get("platform_name"),
        official_deposit_date=str(deposit_date) if deposit_date else None,
        official_reference=row.get("official_reference"),
        status=row.get("status"),
        comment=row.get("comment"),
    )


def _load_official_deposit(client, candidate_id: str) -> OfficialDepositItem:
    try:
        response = (
            client.table("candidate_official_deposits")
            .select(
                "platform_type,platform_name,official_deposit_date,"
                "official_reference,status,comment"
            )
            .eq("candidate_user_id", candidate_id)
            .limit(1)
            .execute()
        )
        rows = response.data or []
        return _official_deposit_from_row(rows[0] if rows else None)
    except Exception:
        return OfficialDepositItem()


def _normalize_path_status(value: str | None) -> ProgressivePathStepStatus:
    try:
        return ProgressivePathStepStatus((value or "").strip().lower())
    except ValueError:
        return ProgressivePathStepStatus.NOT_STARTED


def _seed_steps_if_empty(client) -> None:
    response = client.table("progressive_path_steps").select("id").limit(1).execute()
    if response.data:
        return

    client.table("progressive_path_steps").upsert(
        DEFAULT_PROGRESSIVE_PATH_STEPS,
        on_conflict="id",
    ).execute()


def _load_path_response(
    client,
    candidate_id: str,
) -> ProgressivePathResponse:
    _seed_steps_if_empty(client)

    steps_response = (
        client.table("progressive_path_steps")
        .select("id,title,step_order,short_description,target_module,target_path")
        .eq("is_active", True)
        .order("step_order")
        .execute()
    )
    step_rows = steps_response.data or []
    if not step_rows:
        return _fallback_path(candidate_id)

    progress_response = (
        client.table("candidate_progressive_path_steps")
        .select("step_id,status")
        .eq("candidate_user_id", candidate_id)
        .execute()
    )
    status_by_step = {
        str(item.get("step_id")): _normalize_path_status(item.get("status"))
        for item in (progress_response.data or [])
    }

    state_response = (
        client.table("candidate_progressive_path_state")
        .select("current_step_id")
        .eq("candidate_user_id", candidate_id)
        .limit(1)
        .execute()
    )
    state_rows = state_response.data or []
    current_step_id = (
        str(state_rows[0].get("current_step_id"))
        if state_rows and state_rows[0].get("current_step_id")
        else None
    )

    if not current_step_id:
        current_step_id = next(
            (
                str(step.get("id"))
                for step in step_rows
                if status_by_step.get(str(step.get("id"))) != ProgressivePathStepStatus.COMPLETED
            ),
            str(step_rows[-1].get("id")),
        )
        client.table("candidate_progressive_path_state").upsert(
            {
                "candidate_user_id": candidate_id,
                "current_step_id": current_step_id,
            },
            on_conflict="candidate_user_id",
        ).execute()

    current_order = next(
        (
            int(step.get("step_order") or 0)
            for step in step_rows
            if str(step.get("id")) == current_step_id
        ),
        1,
    )
    completed_count = sum(
        1
        for step in step_rows
        if status_by_step.get(str(step.get("id"))) == ProgressivePathStepStatus.COMPLETED
    )
    progress_percent = round((completed_count / len(step_rows)) * 100) if step_rows else 0

    items: list[ProgressivePathStepItem] = []
    for step in step_rows:
        step_id = str(step.get("id"))
        step_order = int(step.get("step_order") or 0)
        status = status_by_step.get(step_id, ProgressivePathStepStatus.NOT_STARTED)
        if step_id == current_step_id and status == ProgressivePathStepStatus.NOT_STARTED:
            status = ProgressivePathStepStatus.IN_PROGRESS

        items.append(
            ProgressivePathStepItem(
                id=step_id,
                title=str(step.get("title") or ""),
                order=step_order,
                status=status,
                short_description=str(step.get("short_description") or ""),
                is_current=step_id == current_step_id,
                is_locked=step_order > current_order,
                target_module=str(step.get("target_module") or ""),
                target_path=str(step.get("target_path") or ""),
            )
        )

    current_step = next((step for step in items if step.is_current), items[0] if items else None)
    return ProgressivePathResponse(
        candidate_id=candidate_id,
        current_step=current_step,
        progress_percent=progress_percent,
        steps=items,
        official_deposit=_load_official_deposit(client, candidate_id),
        recommendations=_build_recommendations(current_step),
    )


def get_candidate_progressive_path(
    candidate_id: str,
    access_token: str | None = None,
) -> ProgressivePathResponse:
    client = _client_or_none(access_token)
    if client is None:
        return _fallback_path(candidate_id)

    try:
        return _load_path_response(client, candidate_id)
    except Exception:
        return _fallback_path(candidate_id)


def _get_active_step_rows(client) -> list[dict]:
    _seed_steps_if_empty(client)
    response = (
        client.table("progressive_path_steps")
        .select("id,step_order")
        .eq("is_active", True)
        .order("step_order")
        .execute()
    )
    return response.data or []


def _set_current_step(client, candidate_id: str, step_id: str) -> None:
    client.table("candidate_progressive_path_state").upsert(
        {
            "candidate_user_id": candidate_id,
            "current_step_id": step_id,
        },
        on_conflict="candidate_user_id",
    ).execute()


def _set_step_status(
    client,
    candidate_id: str,
    step_id: str,
    status: ProgressivePathStepStatus,
) -> None:
    payload = {
        "candidate_user_id": candidate_id,
        "step_id": step_id,
        "status": status.value,
    }
    if status == ProgressivePathStepStatus.IN_PROGRESS:
        payload["started_at"] = datetime.now(timezone.utc).isoformat()
        payload["completed_at"] = None
    if status == ProgressivePathStepStatus.COMPLETED:
        payload["completed_at"] = datetime.now(timezone.utc).isoformat()

    client.table("candidate_progressive_path_steps").upsert(
        payload,
        on_conflict="candidate_user_id,step_id",
    ).execute()


def _current_order_from_response(path: ProgressivePathResponse) -> int:
    if path.current_step is not None:
        return path.current_step.order
    return 1


def start_candidate_progressive_path_step(
    candidate_id: str,
    step_id: str,
    access_token: str | None = None,
) -> ProgressivePathResponse:
    client = _client_or_none(access_token)
    if client is None:
        return _fallback_path(candidate_id)

    path = _load_path_response(client, candidate_id)
    step = next((item for item in path.steps if item.id == step_id), None)
    if step is None:
        raise LookupError("Etape introuvable.")
    if step.order > _current_order_from_response(path):
        raise PermissionError("Cette etape est verrouillee.")

    _set_step_status(client, candidate_id, step_id, ProgressivePathStepStatus.IN_PROGRESS)
    _set_current_step(client, candidate_id, step_id)
    return _load_path_response(client, candidate_id)


def complete_candidate_progressive_path_step(
    candidate_id: str,
    step_id: str,
    access_token: str | None = None,
) -> ProgressivePathResponse:
    client = _client_or_none(access_token)
    if client is None:
        return _fallback_path(candidate_id)

    step_rows = _get_active_step_rows(client)
    current_step = next((item for item in step_rows if str(item.get("id")) == step_id), None)
    if current_step is None:
        raise LookupError("Etape introuvable.")

    current_order = int(current_step.get("step_order") or 0)
    next_step = next(
        (
            item
            for item in step_rows
            if int(item.get("step_order") or 0) > current_order
        ),
        None,
    )

    _set_step_status(client, candidate_id, step_id, ProgressivePathStepStatus.COMPLETED)
    if next_step is not None:
        next_step_id = str(next_step.get("id"))
        _set_step_status(client, candidate_id, next_step_id, ProgressivePathStepStatus.IN_PROGRESS)
        _set_current_step(client, candidate_id, next_step_id)
    else:
        _set_current_step(client, candidate_id, step_id)

    return _load_path_response(client, candidate_id)


def reopen_candidate_progressive_path_step(
    candidate_id: str,
    step_id: str,
    access_token: str | None = None,
) -> ProgressivePathResponse:
    client = _client_or_none(access_token)
    if client is None:
        return _fallback_path(candidate_id)

    step_rows = _get_active_step_rows(client)
    if not any(str(item.get("id")) == step_id for item in step_rows):
        raise LookupError("Etape introuvable.")

    _set_step_status(client, candidate_id, step_id, ProgressivePathStepStatus.IN_PROGRESS)
    _set_current_step(client, candidate_id, step_id)
    return _load_path_response(client, candidate_id)


def declare_candidate_official_deposit(
    candidate_id: str,
    payload: OfficialDepositRequest,
    access_token: str | None = None,
) -> ProgressivePathResponse:
    client = _client_or_none(access_token)
    if client is None:
        return _fallback_path(candidate_id)

    client.table("candidate_official_deposits").upsert(
        {
            "candidate_user_id": candidate_id,
            "platform_type": payload.platform_type.value,
            "platform_name": payload.platform_name,
            "official_deposit_date": payload.official_deposit_date,
            "official_reference": payload.official_reference,
            "status": payload.status.value,
            "comment": payload.comment,
        },
        on_conflict="candidate_user_id",
    ).execute()

    return _load_path_response(client, candidate_id)
