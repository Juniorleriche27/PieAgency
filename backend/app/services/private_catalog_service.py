from ..schemas import (
    AuthMessageResponse,
    PrivateProductItem,
    PrivateProductListResponse,
    PrivateDiagnosticResponse,
    PrivateOnboardingSubmitRequest,
    PrivateProfileResponse,
    PrivateProfileUpdateRequest,
    PrivateResourceItem,
    PrivateResourceListResponse,
    PrivateSubscriptionListResponse,
    PrivateSubscriptionPlanItem,
    StudentDocumentItem,
    StudentDocumentListResponse,
)
from .dashboard_service import _client_or_none, _normalize_document_status


PRODUCTS = [
    PrivateProductItem(
        id="prod-001",
        title="Kit Campus France complet",
        description="Guide complet pour réussir votre procédure Campus France",
        category="Campus France",
        price=29.99,
        target_audience="Étudiants préparant Campus France",
        what_you_get=[
            "Guide étape par étape",
            "Modèles de documents",
            "Checklist complète",
            "Exemples commentés",
            "Conseils sur les erreurs à éviter",
        ],
        badge="recommended",
        service_slug="prod-001",
    ),
    PrivateProductItem(
        id="prod-002",
        title="Kit Visa étudiant",
        description="Tout ce qu'il faut savoir pour préparer votre dossier visa",
        category="Visa",
        price=24.99,
        target_audience="Étudiants en procédure visa",
        what_you_get=[
            "Liste complète des documents",
            "Modèles de lettres",
            "Conseils financiers",
            "Préparation entretien consulat",
        ],
        badge="popular",
        service_slug="prod-002",
    ),
    PrivateProductItem(
        id="prod-003",
        title="Générateur projet d'études",
        description="Outil interactif pour rédiger votre projet d'études",
        category="Projet d'études",
        price=19.99,
        target_audience="Tous les candidats",
        what_you_get=[
            "Questions guidées",
            "Exemples de réponses",
            "Export PDF",
            "Conseils de rédaction",
        ],
        service_slug="prod-003",
    ),
    PrivateProductItem(
        id="prod-004",
        title="Générateur projet professionnel",
        description="Structurez votre projet professionnel efficacement",
        category="Projet professionnel",
        price=19.99,
        target_audience="Tous les candidats",
        what_you_get=[
            "Framework de réflexion",
            "Modèles de réponses",
            "Conseils sectoriels",
            "Export personnalisé",
        ],
        service_slug="prod-004",
    ),
    PrivateProductItem(
        id="prod-005",
        title="Bibliothèque de lettres de motivation",
        description="50+ modèles de lettres adaptées à différents contextes",
        category="Lettres de motivation",
        price=14.99,
        target_audience="Tous les candidats",
        what_you_get=[
            "50+ modèles",
            "Adaptables à votre contexte",
            "Conseils de personnalisation",
            "Exemples commentés",
        ],
        service_slug="prod-005",
    ),
    PrivateProductItem(
        id="prod-006",
        title="Simulateur entretien Campus France",
        description="Préparez-vous à l'entretien avec des questions réalistes",
        category="Entretien",
        price=24.99,
        target_audience="Candidats Campus France",
        what_you_get=[
            "100+ questions réalistes",
            "Conseils de réponse",
            "Enregistrement de vos réponses",
            "Feedback structuré",
        ],
        badge="popular",
        service_slug="prod-006",
    ),
    PrivateProductItem(
        id="prod-007",
        title="Guide écoles privées",
        description="Sélectionner et postuler aux meilleures écoles privées",
        category="Écoles privées",
        price=19.99,
        target_audience="Candidats écoles privées",
        what_you_get=[
            "Liste des écoles",
            "Critères de sélection",
            "Stratégie de candidature",
            "Conseils de rédaction",
        ],
        service_slug="prod-007",
    ),
    PrivateProductItem(
        id="prod-008",
        title="Guide Campus Belgique",
        description="Procédure d'études en Belgique expliquée",
        category="Belgique",
        price=14.99,
        target_audience="Candidats Belgique",
        what_you_get=[
            "Procédure belge expliquée",
            "Documents nécessaires",
            "Calendrier",
            "Conseils pratiques",
        ],
        service_slug="prod-008",
    ),
    PrivateProductItem(
        id="prod-009",
        title="Pack correction dossier",
        description="Correction professionnelle de vos documents",
        category="Correction",
        price=49.99,
        target_audience="Tous les candidats",
        what_you_get=[
            "Correction de 3 documents",
            "Commentaires détaillés",
            "Suggestions d'amélioration",
            "Révision finale",
        ],
        service_slug="prod-009",
    ),
    PrivateProductItem(
        id="prod-010",
        title="Pack entretien + questions fréquentes",
        description="Préparation complète aux entretiens",
        category="Entretien",
        price=34.99,
        target_audience="Tous les candidats",
        what_you_get=[
            "Guide entretien complet",
            "200+ questions fréquentes",
            "Conseils de communication",
            "Exercices pratiques",
        ],
        service_slug="prod-010",
    ),
]


RESOURCES = [
    PrivateResourceItem(
        id="res-001",
        title="Guide complet Campus France",
        description="Tout ce que vous devez savoir sur la procédure Campus France",
        category="Campus France",
        resource_type="guide",
        badge_label="Guide PDF",
        action_label="Télécharger",
        access_level="free",
    ),
    PrivateResourceItem(
        id="res-002",
        title="Modèle projet d'études",
        description="Modèle structuré pour rédiger votre projet d'études",
        category="Projet d'études",
        resource_type="template",
        badge_label="Modèle",
        action_label="Télécharger",
        access_level="free",
    ),
    PrivateResourceItem(
        id="res-003",
        title="Checklist dossier complet",
        description="Vérifiez que vous n'oubliez rien",
        category="Dossier",
        resource_type="checklist",
        badge_label="Checklist",
        action_label="Télécharger",
        access_level="free",
    ),
    PrivateResourceItem(
        id="res-004",
        title="Vidéo : Préparer votre entretien",
        description="Conseils vidéo pour réussir votre entretien",
        category="Entretien",
        resource_type="video",
        badge_label="Vidéo",
        action_label="Regarder",
        duration_label="15 min",
        access_level="free",
    ),
    PrivateResourceItem(
        id="res-005",
        title="Exemple projet d'études commenté",
        description="Exemple réel avec explications",
        category="Projet d'études",
        resource_type="example",
        badge_label="Exemple commenté",
        action_label="Télécharger",
        access_level="free",
    ),
    PrivateResourceItem(
        id="res-006",
        title="Exercice : Structurer votre motivation",
        description="Exercice pratique pour clarifier vos motivations",
        category="Motivation",
        resource_type="exercise",
        badge_label="Exercice",
        action_label="Télécharger",
        access_level="free",
    ),
    PrivateResourceItem(
        id="res-007",
        title="Guide visa étudiant",
        description="Procédure visa étape par étape",
        category="Visa",
        resource_type="guide",
        badge_label="Guide PDF",
        action_label="Télécharger",
        access_level="free",
    ),
    PrivateResourceItem(
        id="res-008",
        title="Modèle lettre de motivation",
        description="Modèle adaptable pour vos candidatures",
        category="Lettres",
        resource_type="template",
        badge_label="Modèle",
        action_label="Télécharger",
        access_level="free",
    ),
    PrivateResourceItem(
        id="res-009",
        title="Checklist documents visa",
        description="Tous les documents nécessaires pour le visa",
        category="Visa",
        resource_type="checklist",
        badge_label="Checklist",
        action_label="Télécharger",
        access_level="free",
    ),
    PrivateResourceItem(
        id="res-010",
        title="Vidéo : Questions fréquentes Campus France",
        description="Réponses aux questions les plus posées",
        category="Campus France",
        resource_type="video",
        badge_label="Vidéo",
        action_label="Regarder",
        duration_label="20 min",
        access_level="free",
    ),
]


SUBSCRIPTION_PLANS = [
    PrivateSubscriptionPlanItem(
        id="student-basic",
        title="Suivi Essentiel",
        description="Acces aux ressources, checklist et suivi de dossier.",
        price=19,
        features=[
            "Tableau de bord candidat",
            "Ressources privees",
            "Checklist documents",
        ],
        service_slug="student-basic",
    ),
    PrivateSubscriptionPlanItem(
        id="student-plus",
        title="Suivi Plus",
        description="Accompagnement renforce avec priorisation et retours conseiller.",
        price=49,
        features=[
            "Tout le suivi essentiel",
            "Notes conseiller prioritaires",
            "Preparation diagnostic",
            "Support assistant",
        ],
        recommended=True,
        service_slug="student-plus",
    ),
]


def list_private_products() -> PrivateProductListResponse:
    return PrivateProductListResponse(products=PRODUCTS)


def get_private_product(product_id: str) -> PrivateProductItem:
    for product in PRODUCTS:
        if product.id == product_id:
            return product
    raise LookupError("Produit introuvable.")


def list_private_resources() -> PrivateResourceListResponse:
    return PrivateResourceListResponse(resources=RESOURCES)


def list_private_subscriptions() -> PrivateSubscriptionListResponse:
    return PrivateSubscriptionListResponse(plans=SUBSCRIPTION_PLANS)


def get_private_profile(
    user_id: str,
    access_token: str | None = None,
) -> PrivateProfileResponse:
    client = _client_or_none(access_token)
    if client is None:
        return PrivateProfileResponse()

    try:
        response = (
            client.table("profiles")
            .select("education_level,grading_system")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
    except Exception:
        return PrivateProfileResponse()

    rows = response.data or []
    if not rows:
        return PrivateProfileResponse()

    row = rows[0]
    return PrivateProfileResponse(
        education_level=row.get("education_level"),
        grading_system=row.get("grading_system"),
    )


def update_private_profile(
    user_id: str,
    payload: PrivateProfileUpdateRequest,
    access_token: str | None = None,
) -> PrivateProfileResponse:
    client = _client_or_none(access_token)
    if client is None:
        return PrivateProfileResponse(
            education_level=payload.education_level,
            grading_system=payload.grading_system,
        )

    data = payload.model_dump(exclude_unset=True, mode="json")
    try:
        if data:
            client.table("profiles").update(data).eq("user_id", user_id).execute()
        return get_private_profile(user_id, access_token)
    except Exception:
        return PrivateProfileResponse(
            education_level=payload.education_level,
            grading_system=payload.grading_system,
        )


def list_student_documents(user_id: str, access_token: str | None = None) -> StudentDocumentListResponse:
    client = _client_or_none(access_token)
    if client is None:
        return StudentDocumentListResponse(documents=[])

    try:
        case_response = (
            client.table("student_cases")
            .select("id")
            .eq("student_user_id", user_id)
            .order("updated_at", desc=True)
            .limit(1)
            .execute()
        )
    except Exception:
        return StudentDocumentListResponse(documents=[])

    case_rows = case_response.data or []
    if not case_rows:
        return StudentDocumentListResponse(documents=[])

    case_id = str(case_rows[0].get("id", ""))
    try:
        document_response = (
            client.table("case_documents")
            .select("id,name,status,note")
            .eq("case_id", case_id)
            .order("created_at")
            .execute()
        )
    except Exception:
        return StudentDocumentListResponse(documents=[])

    documents = [
        StudentDocumentItem(
            id=str(item.get("id") or ""),
            name=str(item.get("name", "Document")),
            status=_normalize_document_status(item.get("status")),
            note=str(item.get("note") or "Aucun commentaire pour le moment."),
        )
        for item in (document_response.data or [])
    ]
    return StudentDocumentListResponse(documents=documents)


def _get_latest_student_case_id(client, user_id: str) -> str | None:
    case_response = (
        client.table("student_cases")
        .select("id")
        .eq("student_user_id", user_id)
        .order("updated_at", desc=True)
        .limit(1)
        .execute()
    )
    case_rows = case_response.data or []
    return str(case_rows[0]["id"]) if case_rows else None


def _create_student_case(client, user_id: str) -> str:
    student_response = (
        client.table("students")
        .insert({"full_name": "Espace etudiant"})
        .execute()
    )
    student_rows = student_response.data or []
    student_id = str(student_rows[0]["id"])
    reference = f"PIE-{user_id[:8].upper()}"

    case_response = (
        client.table("student_cases")
        .insert(
            {
                "student_id": student_id,
                "student_user_id": user_id,
                "created_by": user_id,
                "public_reference": reference,
                "target_project": "A qualifier",
                "status": "new",
            }
        )
        .execute()
    )
    case_rows = case_response.data or []
    return str(case_rows[0]["id"])


def add_student_document(
    user_id: str,
    name: str,
    access_token: str | None = None,
) -> StudentDocumentItem:
    cleaned_name = name.strip()
    client = _client_or_none(access_token)
    if client is None:
        return StudentDocumentItem(name=cleaned_name, status="missing", note="")

    try:
        case_id = _get_latest_student_case_id(client, user_id) or _create_student_case(client, user_id)

        document_response = (
            client.table("case_documents")
            .insert(
                {
                    "case_id": case_id,
                    "name": cleaned_name,
                    "status": "missing",
                    "note": "",
                    "uploaded_by": user_id,
                }
            )
            .execute()
        )
        document_rows = document_response.data or []
        document_id = str(document_rows[0].get("id") or "") if document_rows else ""
        return StudentDocumentItem(
            id=document_id,
            name=cleaned_name,
            status="missing",
            note="",
        )
    except Exception:
        return StudentDocumentItem(name=cleaned_name, status="missing", note="")


def _get_candidate_document(
    client,
    user_id: str,
    document_id: str,
) -> StudentDocumentItem:
    case_response = (
        client.table("student_cases")
        .select("id")
        .eq("student_user_id", user_id)
        .execute()
    )
    case_ids = [str(item.get("id") or "") for item in (case_response.data or [])]
    case_ids = [case_id for case_id in case_ids if case_id]
    if not case_ids:
        raise LookupError("Document introuvable.")

    document_response = (
        client.table("case_documents")
        .select("id,name,status,note")
        .eq("id", document_id)
        .in_("case_id", case_ids)
        .limit(1)
        .execute()
    )
    document_rows = document_response.data or []
    if not document_rows:
        raise LookupError("Document introuvable.")

    item = document_rows[0]
    return StudentDocumentItem(
        id=str(item.get("id") or ""),
        name=str(item.get("name", "Document")),
        status=_normalize_document_status(item.get("status")),
        note=str(item.get("note") or ""),
    )


def list_candidate_documents_admin(
    user_id: str,
    access_token: str | None = None,
) -> StudentDocumentListResponse:
    return list_student_documents(user_id, access_token)


def add_candidate_document_admin(
    user_id: str,
    name: str,
    access_token: str | None = None,
) -> StudentDocumentItem:
    cleaned_name = name.strip()
    client = _client_or_none(access_token)
    if client is None:
        raise RuntimeError("Supabase indisponible.")

    case_id = _get_latest_student_case_id(client, user_id) or _create_student_case(client, user_id)
    document_response = (
        client.table("case_documents")
        .insert(
            {
                "case_id": case_id,
                "name": cleaned_name,
                "status": "missing",
                "note": "",
            }
        )
        .execute()
    )
    document_rows = document_response.data or []
    if not document_rows:
        raise RuntimeError("Document non cree.")

    item = document_rows[0]
    return StudentDocumentItem(
        id=str(item.get("id") or ""),
        name=str(item.get("name") or cleaned_name),
        status=_normalize_document_status(item.get("status")),
        note=str(item.get("note") or ""),
    )


def update_candidate_document_admin(
    user_id: str,
    document_id: str,
    status: str,
    note: str,
    access_token: str | None = None,
) -> StudentDocumentItem:
    client = _client_or_none(access_token)
    if client is None:
        raise RuntimeError("Supabase indisponible.")

    _get_candidate_document(client, user_id, document_id)
    (
        client.table("case_documents")
        .update({"status": status, "note": note})
        .eq("id", document_id)
        .execute()
    )
    return _get_candidate_document(client, user_id, document_id)


def delete_candidate_document_admin(
    user_id: str,
    document_id: str,
    access_token: str | None = None,
) -> bool:
    client = _client_or_none(access_token)
    if client is None:
        raise RuntimeError("Supabase indisponible.")

    _get_candidate_document(client, user_id, document_id)
    client.table("case_documents").delete().eq("id", document_id).execute()
    return True


def _document_belongs_to_user(client, user_id: str, document_id: str) -> bool:
    document_response = (
        client.table("case_documents")
        .select("case_id")
        .eq("id", document_id)
        .limit(1)
        .execute()
    )
    document_rows = document_response.data or []
    if not document_rows:
        return False

    case_id = str(document_rows[0].get("case_id") or "")
    case_response = (
        client.table("student_cases")
        .select("id")
        .eq("id", case_id)
        .eq("student_user_id", user_id)
        .limit(1)
        .execute()
    )
    return bool(case_response.data or [])


def upload_document_file(
    user_id: str,
    document_id: str,
    file_bytes: bytes,
    filename: str,
    access_token: str | None = None,
) -> bool:
    client = _client_or_none(access_token)
    if client is None:
        return False

    safe_filename = filename.replace("\\", "_").replace("/", "_").strip() or "file"
    try:
        if not _document_belongs_to_user(client, user_id, document_id):
            return False

        path = f"documents/{user_id}/{document_id}/{safe_filename}"
        client.storage.from_("student-documents").upload(path, file_bytes)
        (
            client.table("case_documents")
            .update(
                {
                    "status": "review",
                    "note": f"Fichier joint : {safe_filename}",
                    "storage_path": path,
                    "uploaded_by": user_id,
                }
            )
            .eq("id", document_id)
            .execute()
        )
        return True
    except Exception:
        return False


def save_private_onboarding(
    user_id: str,
    payload: PrivateOnboardingSubmitRequest,
    access_token: str | None = None,
) -> AuthMessageResponse:
    client = _client_or_none(access_token)
    if client is None:
        return AuthMessageResponse(message="Onboarding recu. Stockage distant indisponible.")

    try:
        client.table("student_onboarding").upsert(
            {
                "user_id": user_id,
                "data": payload.data,
            },
            on_conflict="user_id",
        ).execute()
    except Exception:
        return AuthMessageResponse(message="Onboarding recu. Synchronisation conseiller en attente.")

    return AuthMessageResponse(message="Onboarding enregistre.")


def get_private_diagnostic(
    user_id: str,
    access_token: str | None = None,
) -> PrivateDiagnosticResponse:
    data: dict[str, str] = {}
    client = _client_or_none(access_token)

    if client is not None:
        try:
            response = (
                client.table("student_onboarding")
                .select("data")
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            rows = response.data or []
            if rows and isinstance(rows[0].get("data"), dict):
                data = rows[0]["data"]
        except Exception:
            data = {}

    target_procedure = data.get("targetProcedure", "")
    dossier_status = data.get("dossierStatus", "")
    main_need = data.get("mainNeed", "")

    if "Visa" in target_procedure or "visa" in dossier_status.lower():
        return PrivateDiagnosticResponse(
            current_priority="Verifier la coherence du dossier visa",
            main_risk="Justificatifs financiers ou hebergement incomplets",
            next_action="Controler les pieces visa avant toute prise de rendez-vous consulaire.",
            recommended_products=["prod-002", "prod-001"],
            adapted_checklist=[
                "Lister les pieces visa obligatoires",
                "Verifier les justificatifs financiers",
                "Controler hebergement et assurance",
                "Preparer les reponses de l'entretien consulaire",
            ],
        )

    if "lettre" in main_need.lower() or "motivation" in main_need.lower():
        return PrivateDiagnosticResponse(
            current_priority="Structurer vos lettres de motivation",
            main_risk="Arguments trop generiques pour les formations visees",
            next_action="Rattacher chaque lettre a votre parcours, vos acquis et la formation cible.",
            recommended_products=["prod-005", "prod-001"],
            adapted_checklist=[
                "Clarifier le projet d'etudes",
                "Identifier les arguments par formation",
                "Rediger une trame principale",
                "Adapter chaque lettre avant envoi",
            ],
        )

    return PrivateDiagnosticResponse(
        current_priority="Clarifier votre projet d'etudes",
        main_risk="Motivations trop generales",
        next_action="Preparer votre projet d'etudes avant les lettres de motivation.",
        recommended_products=["prod-001", "prod-005"],
        adapted_checklist=[
            "Definir vos motivations principales",
            "Rechercher les ecoles ou formations adaptees",
            "Rediger votre projet d'etudes",
            "Preparer vos lettres de motivation",
            "Preparer votre entretien",
        ],
    )
