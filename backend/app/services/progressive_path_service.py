from ..schemas import (
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
    )


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


def get_candidate_progressive_path(
    candidate_id: str,
    access_token: str | None = None,
) -> ProgressivePathResponse:
    client = _client_or_none(access_token)
    if client is None:
        return _fallback_path(candidate_id)

    try:
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
        )
    except Exception:
        return _fallback_path(candidate_id)
