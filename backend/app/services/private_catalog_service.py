from ..schemas import (
    AuthMessageResponse,
    PrivateProductItem,
    PrivateProductListResponse,
    PrivateDiagnosticResponse,
    PrivateOnboardingSubmitRequest,
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
        id="campus-france-method",
        title="Pack methode Campus France",
        description="Structure complete pour clarifier le projet, preparer les choix de formation et eviter les incoherences.",
        category="Campus France",
        price=49,
        target_audience="Candidats Campus France qui veulent cadrer leur dossier avant soumission.",
        what_you_get=[
            "Checklist de preparation du dossier",
            "Plan de redaction du projet d'etudes",
            "Grille d'auto-verification avant entretien",
        ],
        badge="recommended",
        service_slug="campus-france-method",
    ),
    PrivateProductItem(
        id="visa-file-review",
        title="Relecture dossier visa",
        description="Controle des pieces et des points de vigilance avant depot consulaire.",
        category="Visa",
        price=79,
        target_audience="Etudiants avec admission obtenue et dossier visa en preparation.",
        what_you_get=[
            "Checklist visa adaptee au profil",
            "Relecture des justificatifs principaux",
            "Liste des risques a corriger",
        ],
        badge="popular",
        service_slug="visa-file-review",
    ),
    PrivateProductItem(
        id="motivation-letter-kit",
        title="Kit lettres de motivation",
        description="Modeles et methode pour produire des lettres coherentes avec le parcours et la formation visee.",
        category="Lettres de motivation",
        price=39,
        target_audience="Candidats qui doivent rediger plusieurs lettres sans perdre la coherence globale.",
        what_you_get=[
            "Trame de lettre personnalisable",
            "Exemples de formulations utiles",
            "Checklist anti-lettre generique",
        ],
        service_slug="motivation-letter-kit",
    ),
]


RESOURCES = [
    PrivateResourceItem(
        id="checklist-campus-france",
        title="Checklist Campus France",
        description="Ordre de preparation conseille pour eviter les oublis avant validation du dossier.",
        category="Campus France",
        resource_type="checklist",
        format_label="PDF",
    ),
    PrivateResourceItem(
        id="visa-consular-points",
        title="Points de vigilance visa",
        description="Synthese des erreurs frequentes dans les dossiers visa et comment les anticiper.",
        category="Visa",
        resource_type="guide",
        format_label="Guide",
    ),
    PrivateResourceItem(
        id="project-study-template",
        title="Trame projet d'etudes",
        description="Structure editable pour organiser son projet d'etudes et son projet professionnel.",
        category="Projet d'etudes",
        resource_type="template",
        format_label="DOC",
        access_level="premium",
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
            .select("name,status,note")
            .eq("case_id", case_id)
            .order("created_at")
            .execute()
        )
    except Exception:
        return StudentDocumentListResponse(documents=[])

    documents = [
        StudentDocumentItem(
            name=str(item.get("name", "Document")),
            status=_normalize_document_status(item.get("status")),
            note=str(item.get("note") or "Aucun commentaire pour le moment."),
        )
        for item in (document_response.data or [])
    ]
    return StudentDocumentListResponse(documents=documents)


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
            recommended_products=["visa-file-review", "campus-france-method"],
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
            recommended_products=["motivation-letter-kit", "campus-france-method"],
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
        recommended_products=["campus-france-method", "motivation-letter-kit"],
        adapted_checklist=[
            "Definir vos motivations principales",
            "Rechercher les ecoles ou formations adaptees",
            "Rediger votre projet d'etudes",
            "Preparer vos lettres de motivation",
            "Preparer votre entretien",
        ],
    )
