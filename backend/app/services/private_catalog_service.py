from ..schemas import (
    AuthMessageResponse,
    CurrentSubscriptionResponse,
    OnboardingStatus,
    PrivateOnboardingStatusResponse,
    PrivateProductItem,
    PrivateProductListResponse,
    PrivateDiagnosticResponse,
    PrivateOnboardingSubmitRequest,
    PrivateProfileResponse,
    PrivateProfileUpdateRequest,
    PrivateResourceDetailResponse,
    PrivateResourceItem,
    PrivateResourceListResponse,
    PrivateResourceSectionItem,
    PrivateSubscriptionListResponse,
    PrivateSubscriptionPlanItem,
    SubscriptionPlanCreateRequest,
    SubscriptionPlanUpdateRequest,
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
        description="Tunnel privé pour comprendre la procédure Études en France et éviter les erreurs qui affaiblissent le dossier.",
        category="Campus France",
        resource_type="guide",
        badge_label="Guide interactif",
        action_label="Ouvrir",
        access_level="student",
        url="/espace-etudiant/ressources/guide-complet-campus-france",
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


RESOURCE_TUNNELS: dict[str, dict] = {
    "guide-complet-campus-france": {
        "id": "res-001",
        "title": "Guide complet Campus France",
        "slug": "guide-complet-campus-france",
        "description": "Comprendre la procédure Études en France, préparer son dossier Campus France et avancer étape par étape sans improvisation.",
        "category": "Campus France",
        "reading_minutes": 30,
        "checkout_service_slug": "resource-guide-campus-france",
        "sections": [
            {
                "id": "res-001-preview",
                "screen_number": 1,
                "section_type": "preview",
                "title": "Guide complet Campus France",
                "subtitle": "Aperçu gratuit",
                "body": "Comprends comment organiser ta procédure Campus France, préparer ton dossier, choisir tes formations, anticiper l’entretien et suivre les réponses sans avancer au hasard.",
                "items": [
                    "Comprendre le vrai rôle de Campus France.",
                    "Préparer un projet d’études cohérent.",
                    "Éviter les erreurs qui affaiblissent le dossier.",
                    "Savoir quoi préparer avant l’entretien.",
                ],
                "is_preview": True,
            },
            {
                "id": "res-001-paywall",
                "screen_number": 2,
                "section_type": "paywall",
                "title": "Débloque le guide complet",
                "subtitle": "Accès privé",
                "body": "La suite contient le parcours guidé, les erreurs à éviter, la préparation entretien, la checklist interactive et les sources officielles. Aucun PDF, aucun téléchargement : tout se lit dans ton espace privé.",
                "items": [
                    "Méthode guidée écran par écran.",
                    "Checklist interactive non téléchargeable.",
                    "Contenu protégé par ton compte et un filigrane discret.",
                    "Accès immédiat après paiement validé.",
                ],
                "is_locked": True,
            },
            {
                "id": "res-001-role-campus-france",
                "screen_number": 3,
                "section_type": "chapter",
                "title": "Comprendre Campus France",
                "subtitle": "Ne confonds pas les rôles",
                "body": "Campus France accompagne et encadre la procédure Études en France. Ce n’est ni une université, ni le consulat, ni une garantie d’admission ou de visa. La qualité de ton projet, la cohérence de ton dossier et tes réponses pendant l’entretien restent déterminantes.",
                "items": [
                    "Campus France organise une partie de la procédure.",
                    "Les établissements décident de l’admission.",
                    "Le consulat décide du visa.",
                    "Ton dossier doit rester cohérent du début à la fin.",
                ],
            },
            {
                "id": "res-001-timeline",
                "screen_number": 4,
                "section_type": "timeline",
                "title": "Les grandes étapes",
                "subtitle": "La procédure en vision claire",
                "body": "Le parcours doit être suivi avec méthode. Le plus grand danger est d’attendre la dernière minute ou de soumettre un dossier sans cohérence.",
                "items": [
                    "Construire ton projet d’études.",
                    "Créer ou réutiliser ton compte Études en France.",
                    "Remplir ton dossier et ajouter les justificatifs.",
                    "Choisir des formations cohérentes.",
                    "Soumettre le dossier et régler les frais.",
                    "Préparer puis passer l’entretien Campus France.",
                    "Suivre les réponses des établissements.",
                    "Finaliser après acceptation puis préparer le visa.",
                ],
            },
            {
                "id": "res-001-project",
                "screen_number": 5,
                "section_type": "chapter",
                "title": "Construire un projet solide",
                "subtitle": "La base du dossier",
                "body": "Un bon projet ne dit pas simplement : je veux partir en France. Il montre une logique entre ton niveau actuel, la formation demandée, ton objectif professionnel et ton choix de pays.",
                "items": [
                    "Quel est mon niveau actuel ?",
                    "Pourquoi ce domaine ?",
                    "Pourquoi cette formation ?",
                    "Pourquoi ces établissements ?",
                    "Quel est mon projet après les études ?",
                ],
            },
            {
                "id": "res-001-account",
                "screen_number": 6,
                "section_type": "chapter",
                "title": "Créer ou utiliser son compte",
                "subtitle": "Évite les erreurs de départ",
                "body": "Utilise une adresse email fiable, conserve tes accès, vérifie régulièrement les messages officiels et évite de créer plusieurs comptes inutilement.",
                "items": [
                    "Adresse email stable.",
                    "Identifiants conservés en sécurité.",
                    "Messages officiels consultés régulièrement.",
                    "Informations personnelles cohérentes.",
                ],
            },
            {
                "id": "res-001-documents",
                "screen_number": 7,
                "section_type": "checklist",
                "title": "Préparer les documents",
                "subtitle": "Ne cherche pas tes pièces au dernier moment",
                "body": "Les justificatifs doivent être lisibles, cohérents et prêts avant la soumission. Un document flou ou une information contradictoire peut affaiblir tout le dossier.",
                "items": [
                    "Pièce d’identité.",
                    "Diplômes et relevés.",
                    "Attestations utiles.",
                    "Justificatifs selon le profil.",
                    "Traductions si nécessaire.",
                ],
            },
            {
                "id": "res-001-schools",
                "screen_number": 8,
                "section_type": "chapter",
                "title": "Choisir ses formations",
                "subtitle": "Le choix doit raconter une histoire cohérente",
                "body": "Des choix dispersés donnent une impression d’improvisation. Des choix cohérents montrent que tu sais où tu vas et pourquoi.",
                "items": [
                    "Vérifier le niveau demandé.",
                    "Lire les prérequis.",
                    "Comparer les débouchés.",
                    "Vérifier la langue de formation.",
                    "Regarder les calendriers et éventuelles procédures parallèles.",
                ],
            },
            {
                "id": "res-001-interview",
                "screen_number": 9,
                "section_type": "chapter",
                "title": "Préparer l’entretien",
                "subtitle": "Comprendre son projet avant de parler",
                "body": "L’entretien ne se prépare pas avec des phrases apprises par cœur. Il faut savoir expliquer ton parcours, tes choix, ton objectif et ton financement de façon simple et crédible.",
                "items": [
                    "Pourquoi la France ?",
                    "Pourquoi cette formation ?",
                    "Pourquoi cet établissement ?",
                    "Que feras-tu après les études ?",
                    "Comment finances-tu ton projet ?",
                ],
            },
            {
                "id": "res-001-mistakes",
                "screen_number": 10,
                "section_type": "mistakes",
                "title": "Erreurs fréquentes",
                "subtitle": "Ce qui affaiblit un dossier",
                "body": "La plupart des dossiers faibles ne manquent pas seulement de documents. Ils manquent surtout de cohérence, de préparation et de précision.",
                "items": [
                    "Attendre la dernière semaine.",
                    "Choisir des formations incohérentes.",
                    "Envoyer des documents flous.",
                    "Copier une motivation générique.",
                    "Ne pas connaître les formations choisies.",
                    "Croire que Campus France garantit l’admission ou le visa.",
                ],
            },
            {
                "id": "res-001-final-checklist",
                "screen_number": 11,
                "section_type": "checklist",
                "title": "Checklist finale",
                "subtitle": "Avant d’avancer",
                "body": "Coche mentalement chaque point avant de considérer ton dossier prêt.",
                "items": [
                    "Je sais expliquer mon projet d’études.",
                    "Mes formations sont cohérentes.",
                    "Mes documents sont lisibles.",
                    "Je connais les grandes dates.",
                    "Je peux défendre mon choix à l’entretien.",
                    "Je sais quoi faire après une réponse favorable.",
                ],
            },
            {
                "id": "res-001-sources",
                "screen_number": 12,
                "section_type": "sources",
                "title": "Sources officielles",
                "subtitle": "À consulter régulièrement",
                "body": "Les informations officielles peuvent évoluer. Vérifie toujours les pages Campus France et France-Visas avant une décision importante.",
                "items": [
                    "Campus France — procédure Études en France.",
                    "Campus France Togo — procédures et inscriptions.",
                    "Campus France Togo — calendrier 2026-2027.",
                    "Campus France Togo — documents requis.",
                    "France-Visas — étudiant.",
                ],
            },
        ],
    }
}


def _masked_email(email: str | None) -> str:
    if not email or "@" not in email:
        return "compte PieAgency"
    name, domain = email.split("@", 1)
    visible = name[:2] if len(name) >= 2 else name[:1]
    return f"{visible}***@{domain}"


def _watermark_label(full_name: str | None, email: str | None) -> str:
    display_name = (full_name or "Étudiant PieAgency").strip() or "Étudiant PieAgency"
    return f"{display_name} · {_masked_email(email)}"


def _resource_user_has_access(user_id: str, access_token: str | None = None) -> bool:
    client = _client_or_none(access_token)
    if client is None:
        return False

    try:
        entitlement = (
            client.table("user_resource_entitlements")
            .select("id,status")
            .eq("user_id", user_id)
            .eq("resource_id", "res-001")
            .eq("status", "active")
            .limit(1)
            .execute()
        )
        if entitlement.data:
            return True
    except Exception:
        pass

    try:
        profile = (
            client.table("profiles")
            .select("current_plan_id")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        rows = profile.data or []
        return bool(rows and rows[0].get("current_plan_id"))
    except Exception:
        return False


def get_private_resource_tunnel(
    slug: str,
    user_id: str,
    email: str | None = None,
    full_name: str | None = None,
    access_token: str | None = None,
) -> PrivateResourceDetailResponse:
    resource = RESOURCE_TUNNELS.get(slug)
    if resource is None:
        raise LookupError("Ressource introuvable.")

    has_access = _resource_user_has_access(user_id, access_token)
    sections: list[PrivateResourceSectionItem] = []
    for raw_section in resource["sections"]:
        section = PrivateResourceSectionItem(**raw_section)
        if not has_access and not section.is_preview and section.section_type != "paywall":
            continue
        if has_access and section.section_type == "paywall":
            continue
        sections.append(section)

    return PrivateResourceDetailResponse(
        id=resource["id"],
        title=resource["title"],
        slug=resource["slug"],
        description=resource["description"],
        category=resource["category"],
        reading_minutes=resource["reading_minutes"],
        total_screens=len(resource["sections"]),
        has_access=has_access,
        requires_payment=not has_access,
        checkout_service_slug=resource["checkout_service_slug"],
        watermark_label=_watermark_label(full_name, email),
        sections=sections,
    )


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


def _subscription_plan_from_row(row: dict) -> PrivateSubscriptionPlanItem:
    features = row.get("features") or []
    if not isinstance(features, list):
        features = []

    return PrivateSubscriptionPlanItem(
        id=str(row.get("id", "")),
        title=str(row.get("title") or ""),
        description=str(row.get("description") or ""),
        price=float(row.get("price") or 0),
        currency=str(row.get("currency") or "EUR"),
        billing_period=row.get("billing_period") or "monthly",
        features=[str(item) for item in features],
        recommended=bool(row.get("recommended", False)),
        service_slug=str(row.get("service_slug") or ""),
        is_active=bool(row.get("is_active", True)),
        sort_order=int(row.get("sort_order") or 0),
    )


def _subscription_select():
    return "id,title,description,price,currency,billing_period,features,recommended,service_slug,is_active,sort_order"


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
    client = _client_or_none()
    if client is None:
        return PrivateSubscriptionListResponse(plans=SUBSCRIPTION_PLANS)

    try:
        response = (
            client.table("subscription_plans")
            .select(_subscription_select())
            .eq("is_active", True)
            .order("sort_order")
            .execute()
        )
    except Exception:
        return PrivateSubscriptionListResponse(plans=SUBSCRIPTION_PLANS)

    return PrivateSubscriptionListResponse(
        plans=[_subscription_plan_from_row(item) for item in (response.data or [])],
    )


def list_admin_subscription_plans(
    access_token: str | None = None,
) -> PrivateSubscriptionListResponse:
    client = _client_or_none(access_token)
    if client is None:
        return PrivateSubscriptionListResponse(plans=SUBSCRIPTION_PLANS)

    response = (
        client.table("subscription_plans")
        .select(_subscription_select())
        .order("sort_order")
        .execute()
    )
    return PrivateSubscriptionListResponse(
        plans=[_subscription_plan_from_row(item) for item in (response.data or [])],
    )


def get_current_subscription(
    user_id: str,
    access_token: str | None = None,
) -> CurrentSubscriptionResponse:
    client = _client_or_none(access_token)
    if client is None:
        return CurrentSubscriptionResponse()

    try:
        profile_response = (
            client.table("profiles")
            .select("current_plan_id")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
    except Exception:
        return CurrentSubscriptionResponse()

    profile_rows = profile_response.data or []
    current_plan_id = (
        str(profile_rows[0].get("current_plan_id"))
        if profile_rows and profile_rows[0].get("current_plan_id")
        else None
    )
    if not current_plan_id:
        return CurrentSubscriptionResponse(current_plan_id=None, plan=None)

    try:
        plan_response = (
            client.table("subscription_plans")
            .select(_subscription_select())
            .eq("id", current_plan_id)
            .limit(1)
            .execute()
        )
    except Exception:
        return CurrentSubscriptionResponse(current_plan_id=current_plan_id, plan=None)

    plan_rows = plan_response.data or []
    return CurrentSubscriptionResponse(
        current_plan_id=current_plan_id,
        plan=_subscription_plan_from_row(plan_rows[0]) if plan_rows else None,
    )


def set_current_subscription(
    user_id: str,
    plan_id: str | None,
    access_token: str | None = None,
) -> CurrentSubscriptionResponse:
    client = _client_or_none(access_token)
    if client is None:
        return CurrentSubscriptionResponse(current_plan_id=plan_id, plan=None)

    client.table("profiles").update({"current_plan_id": plan_id}).eq("user_id", user_id).execute()
    return get_current_subscription(user_id, access_token)


def create_admin_subscription_plan(
    payload: SubscriptionPlanCreateRequest,
    access_token: str | None = None,
) -> PrivateSubscriptionPlanItem:
    client = _client_or_none(access_token)
    if client is None:
        raise RuntimeError("Supabase indisponible.")

    response = (
        client.table("subscription_plans")
        .insert(payload.model_dump(mode="json"))
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise RuntimeError("Plan non cree.")
    return _subscription_plan_from_row(rows[0])


def update_admin_subscription_plan(
    plan_id: str,
    payload: SubscriptionPlanUpdateRequest,
    access_token: str | None = None,
) -> PrivateSubscriptionPlanItem:
    client = _client_or_none(access_token)
    if client is None:
        raise RuntimeError("Supabase indisponible.")

    data = payload.model_dump(exclude_unset=True, mode="json")
    if data:
        client.table("subscription_plans").update(data).eq("id", plan_id).execute()

    response = (
        client.table("subscription_plans")
        .select(_subscription_select())
        .eq("id", plan_id)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise LookupError("Plan introuvable.")
    return _subscription_plan_from_row(rows[0])


def delete_admin_subscription_plan(
    plan_id: str,
    access_token: str | None = None,
) -> bool:
    client = _client_or_none(access_token)
    if client is None:
        raise RuntimeError("Supabase indisponible.")

    client.table("subscription_plans").delete().eq("id", plan_id).execute()
    return True


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


def get_private_onboarding_status(
    user_id: str,
    access_token: str | None = None,
) -> PrivateOnboardingStatusResponse:
    client = _client_or_none(access_token)
    if client is None:
        return PrivateOnboardingStatusResponse()

    try:
        response = (
            client.table("profiles")
            .select("onboarding_status")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
    except Exception:
        return PrivateOnboardingStatusResponse()

    rows = response.data or []
    if not rows:
        return PrivateOnboardingStatusResponse()

    value = rows[0].get("onboarding_status") or OnboardingStatus.NOT_STARTED.value
    try:
        return PrivateOnboardingStatusResponse(onboarding_status=OnboardingStatus(value))
    except ValueError:
        return PrivateOnboardingStatusResponse()


def update_candidate_onboarding_status(
    user_id: str,
    status: OnboardingStatus,
    access_token: str | None = None,
) -> PrivateOnboardingStatusResponse:
    client = _client_or_none(access_token)
    if client is None:
        raise RuntimeError("Supabase indisponible.")

    client.table("profiles").upsert(
        {
            "user_id": user_id,
            "onboarding_status": status.value,
        },
        on_conflict="user_id",
    ).execute()
    return get_private_onboarding_status(user_id, access_token)


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
        client.table("profiles").upsert(
            {
                "user_id": user_id,
                "onboarding_status": OnboardingStatus.SUBMITTED.value,
            },
            on_conflict="user_id",
        ).execute()
    except Exception:
        return AuthMessageResponse(message="Onboarding recu. Synchronisation conseiller en attente.")

    return AuthMessageResponse(message="Onboarding soumis. Validation PieAgency en attente.")


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
