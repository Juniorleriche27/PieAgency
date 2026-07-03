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
        "reading_minutes": 45,
        "checkout_service_slug": "resource-guide-campus-france",
        "sections": [
            {"id":"res-001-preview","screen_number":1,"section_type":"preview","title":"Guide complet Campus France","subtitle":"Aperçu gratuit","body":"Cette ressource t’aide à comprendre la procédure Études en France sans te perdre : rôle de Campus France, création du compte, dossier, justificatifs, choix des formations, entretien, réponses et passage vers le visa. L’objectif est simple : avancer avec méthode au lieu de remplir ton dossier au hasard.","items":["Tu vois d’abord la logique complète de la procédure.","Tu comprends ce qui dépend de Campus France, des établissements et du consulat.","Tu identifies les erreurs qui peuvent affaiblir ton dossier.","Tu décides ensuite si tu veux débloquer le parcours complet."],"is_preview":True},
            {"id":"res-001-paywall","screen_number":2,"section_type":"paywall","title":"Débloque le guide complet","subtitle":"Accès privé","body":"La suite contient la méthode complète écran par écran : construction du projet, compte Études en France, documents, choix des formations, soumission, entretien, suivi des réponses, erreurs à éviter et checklist finale. Aucun PDF, aucun téléchargement : la ressource se lit uniquement dans ton espace privé.","items":["Lecture guidée en format tunnel, pas une longue page fatigante.","Checklist interactive non téléchargeable.","Contenu protégé par ton compte, anti-copie et filigrane discret.","Accès complet après paiement ou droit actif validé côté backend."],"is_locked":True},
            {"id":"res-001-role-campus-france","screen_number":3,"section_type":"chapter","title":"Comprendre le rôle de Campus France","subtitle":"Ne mélange pas les responsabilités","body":"Campus France accompagne et encadre une partie de la procédure Études en France. Ce n’est pas l’université, ce n’est pas le consulat, et ce n’est pas une garantie d’admission ou de visa. Ton dossier doit rester sérieux, cohérent et défendable, car les établissements évaluent ta candidature et les autorités consulaires décident du visa.","items":["Campus France aide à structurer et transmettre la démarche.","Les établissements examinent ton niveau, ton parcours et ton projet.","Le consulat évalue ensuite la demande de visa selon ses propres critères.","Tu dois donc préparer un dossier clair, pas seulement remplir des cases."]},
            {"id":"res-001-procedure-scope","screen_number":4,"section_type":"chapter","title":"Savoir si tu es concerné","subtitle":"La procédure Études en France n’est pas optionnelle pour tous","body":"La procédure Études en France concerne les candidats qui résident dans un pays relevant de ce dispositif. Campus France indique que 73 pays appliquent cette procédure pour candidater dans l’enseignement supérieur français. Pour le Togo, Campus France Togo présente la procédure comme obligatoire pour les candidatures concernées et comme une étape structurante avant la suite du parcours.","items":["Vérifie ton pays de résidence, pas seulement ta nationalité.","Vérifie aussi le niveau demandé : Licence, Master, école, formation sélective, etc.","Certains établissements peuvent demander une démarche parallèle en plus d’Études en France.","En cas de doute, vérifie les pages officielles Campus France et le site de l’établissement."]},
            {"id":"res-001-calendar","screen_number":5,"section_type":"timeline","title":"Maîtriser le calendrier","subtitle":"Le temps est une partie du dossier","body":"Campus France Togo rappelle que le calendrier varie peu d’une année à l’autre mais que chaque candidat doit respecter des dates limites selon son projet. La campagne 2026-2027 a été annoncée avec un démarrage des démarches à partir du 1er octobre 2025. Ne construis jamais ton dossier comme si toutes les étapes pouvaient se faire en urgence.","items":["Repère les dates qui correspondent exactement à ton niveau et à ton type de candidature.","Prépare les documents avant la dernière période de soumission.","Anticipe les délais d’obtention des attestations, relevés, traductions ou justificatifs.","Garde une marge avant l’entretien, les réponses et la phase visa."]},
            {"id":"res-001-project-method","screen_number":6,"section_type":"chapter","title":"Construire un projet d’études solide","subtitle":"Le cœur de ta candidature","body":"Un projet solide ne se limite pas à dire : je veux étudier en France. Il doit expliquer pourquoi ton parcours actuel mène logiquement vers la formation choisie, ce que cette formation va t’apporter, et comment elle s’inscrit dans ton projet professionnel. Sans cette cohérence, même un dossier complet peut paraître faible.","items":["Ton niveau actuel : où en es-tu réellement ?","Ton domaine cible : pourquoi ce domaine et pas un autre ?","Ton projet professionnel : quel métier, secteur ou objectif après les études ?","Ton choix de la France : quels éléments académiques justifient ce choix ?","Tes formations : pourquoi ces programmes précisément ?"]},
            {"id":"res-001-project-check","screen_number":7,"section_type":"checklist","title":"Tester la cohérence de ton projet","subtitle":"Si tu n’arrives pas à répondre, le dossier n’est pas prêt","body":"Avant de remplir ton dossier, vérifie que tu peux répondre simplement aux questions suivantes. Ces réponses serviront ensuite pour les motivations, l’entretien et la sélection des formations.","items":["Je peux expliquer mon parcours en moins d’une minute.","Je peux justifier le lien entre mon parcours et la formation demandée.","Je connais les matières ou compétences clés de la formation visée.","Je peux expliquer ce que je veux faire après mes études.","Je peux expliquer pourquoi mes choix de formations ne sont pas dispersés.","Je peux défendre mon projet sans réciter un texte appris par cœur."]},
            {"id":"res-001-account","screen_number":8,"section_type":"chapter","title":"Créer ou réutiliser son compte Études en France","subtitle":"La base technique doit être propre","body":"Le compte Études en France est ton espace central de démarche. Il faut utiliser une adresse email fiable, garder ses accès, consulter les messages officiels et éviter de créer plusieurs comptes inutilement. Une erreur au départ peut compliquer tout le suivi.","items":["Utilise une adresse email que tu consultes vraiment.","Conserve tes identifiants dans un endroit sûr.","Vérifie régulièrement les notifications sur la plateforme.","Ne crée pas un deuxième compte si tu as déjà un compte utilisable.","Renseigne tes informations personnelles sans approximation."]},
            {"id":"res-001-documents-profile","screen_number":9,"section_type":"checklist","title":"Préparer les documents selon ton profil","subtitle":"Les pièces changent selon ton niveau","body":"Campus France Togo publie une liste des documents requis pour la procédure 2026-2027. Les pièces attendues varient selon le profil : terminale, Licence 1, Licence 2, Licence 3, Master, reprise d’études ou autre situation. Tous les justificatifs renseignés doivent être propres, lisibles et cohérents avec le parcours déclaré.","items":["Documents d’identité et informations personnelles.","Relevés de notes selon les années concernées.","Diplômes, attestations de réussite ou justificatifs d’inscription.","Justificatifs spécifiques selon ton niveau ou ta situation.","Documents originaux scannés proprement lorsque demandé.","Traductions si un document n’est pas exploitable en français selon les exigences applicables."]},
            {"id":"res-001-fill-file","screen_number":10,"section_type":"chapter","title":"Remplir le dossier sans incohérence","subtitle":"La cohérence compte autant que la quantité de documents","body":"Un dossier peut être complet mais faible si les informations se contredisent. Les dates, intitulés, niveaux, diplômes, formations demandées et motivations doivent raconter la même histoire. Le but n’est pas de remplir vite, mais de remplir juste.","items":["Vérifie les dates de début et de fin de chaque année académique.","Utilise les mêmes noms et intitulés que sur les documents officiels.","Ne déclare pas un niveau que les pièces ne prouvent pas.","Relis les motivations avant soumission.","Évite les documents flous, coupés ou illisibles."]},
            {"id":"res-001-training-choice","screen_number":11,"section_type":"chapter","title":"Choisir ses formations avec stratégie","subtitle":"Le panier doit montrer une direction claire","body":"Le choix des formations doit être cohérent avec ton niveau, ton parcours et ton projet. Certains établissements peuvent aussi demander une procédure parallèle en plus de la plateforme Études en France. Tu dois donc vérifier chaque formation avant de l’ajouter, au lieu de choisir seulement un nom d’école ou une ville.","items":["Vérifie le niveau demandé et les prérequis.","Lis le programme de formation, pas seulement le titre.","Compare les débouchés avec ton projet professionnel.","Vérifie la langue d’enseignement et les exigences particulières.","Contrôle les calendriers et procédures parallèles de l’établissement.","Évite un panier dispersé entre des domaines qui ne racontent aucune logique."]},
            {"id":"res-001-motivation","screen_number":12,"section_type":"chapter","title":"Écrire une motivation crédible","subtitle":"Pas de phrases génériques","body":"La motivation doit montrer que tu comprends ce que tu demandes. Une motivation forte relie ton passé, ton choix de formation, ton projet professionnel et la valeur de l’établissement. Une motivation faible pourrait être envoyée à n’importe quelle école sans rien changer.","items":["Commence par ton parcours et ton objectif.","Explique pourquoi cette formation précise t’intéresse.","Montre le lien avec ton projet professionnel.","Évite les phrases vagues comme : la France est un grand pays d’études.","Adapte chaque motivation à la formation concernée."]},
            {"id":"res-001-submit-pay","screen_number":13,"section_type":"chapter","title":"Soumettre et payer au bon moment","subtitle":"La soumission ne doit pas être une improvisation","body":"Avant de soumettre, le dossier doit être relu comme un ensemble : identité, parcours, documents, formations et motivations. Le paiement des frais Campus France doit intervenir quand le dossier est prêt, pas quand tu espères encore corriger plus tard.","items":["Relis toutes les informations personnelles.","Contrôle chaque document ajouté.","Vérifie chaque formation choisie.","Relis les motivations une dernière fois.","Garde la preuve de paiement et surveille les messages officiels."]},
            {"id":"res-001-interview-prep","screen_number":14,"section_type":"chapter","title":"Préparer l’entretien Campus France","subtitle":"Savoir expliquer, pas réciter","body":"L’entretien sert à vérifier la cohérence du projet, la motivation et la capacité du candidat à expliquer ses choix. Tu dois connaître ton parcours, tes formations, ton projet et tes raisons. Les réponses apprises par cœur donnent souvent une impression fragile.","items":["Présente ton parcours clairement.","Explique pourquoi la France correspond à ton projet.","Justifie chaque formation importante.","Relie tes études à un projet professionnel crédible.","Prépare ton financement sans approximation.","Apporte les originaux et documents demandés pour vérification si nécessaire."]},
            {"id":"res-001-interview-questions","screen_number":15,"section_type":"checklist","title":"Questions à préparer avant l’entretien","subtitle":"Travaille tes réponses avant le rendez-vous","body":"Ces questions ne sont pas là pour apprendre un script. Elles servent à vérifier si ton projet est vraiment clair. Si tu bloques sur plusieurs d’entre elles, reprends ton projet avant l’entretien.","items":["Pourquoi voulez-vous étudier en France ?","Pourquoi cette formation et pas une autre ?","Pourquoi cet établissement ?","Quel lien avec vos études précédentes ?","Quel est votre projet professionnel ?","Comment financez-vous votre séjour ?","Que ferez-vous si vous n’êtes pas accepté ?"]},
            {"id":"res-001-after-interview","screen_number":16,"section_type":"chapter","title":"Après l’entretien : suivre les réponses","subtitle":"La procédure continue après le rendez-vous","body":"Après l’entretien, tu dois continuer à surveiller ton espace, lire les messages, répondre si une information est demandée et suivre les décisions des établissements. Une réponse favorable doit ensuite être traitée correctement avant la phase visa.","items":["Consulte régulièrement ton compte Études en France.","Lis les notifications sans attendre.","Réponds aux demandes d’information si nécessaire.","Analyse les réponses positives, négatives ou en attente.","Confirme ton choix final selon les règles de la plateforme."]},
            {"id":"res-001-visa-transition","screen_number":17,"section_type":"chapter","title":"Passage vers le visa étudiant","subtitle":"Ne mélange pas les deux dossiers","body":"Le guide Campus France ne remplace pas la préparation visa. Une fois l’acceptation obtenue et la procédure finalisée, tu dois préparer la demande de visa étudiant selon les instructions France-Visas et les consignes applicables à ton pays. Cette partie sera traitée dans une ressource dédiée.","items":["Campus France prépare la partie candidature et préconsulaire selon les cas.","France-Visas reste la référence pour la demande de visa.","Le dossier visa doit être préparé séparément et sérieusement.","Ne réserve pas tes décisions importantes sans vérifier les instructions officielles."]},
            {"id":"res-001-mistakes","screen_number":18,"section_type":"mistakes","title":"Erreurs qui affaiblissent le dossier","subtitle":"À éviter absolument","body":"La majorité des erreurs viennent d’un manque d’anticipation ou d’un dossier qui n’a pas de logique claire. Cette liste doit être relue avant soumission et avant entretien.","items":["Attendre la dernière semaine pour préparer les documents.","Choisir des formations sans lien entre elles.","Utiliser une motivation copiée-collée.","Envoyer des justificatifs flous ou incomplets.","Créer plusieurs comptes sans nécessité.","Ne pas connaître les formations choisies pendant l’entretien.","Confondre admission, Campus France et visa.","Faire confiance à un intermédiaire qui promet admission ou visa."]},
            {"id":"res-001-final-checklist","screen_number":19,"section_type":"checklist","title":"Checklist finale avant d’avancer","subtitle":"Si tout est coché, ton dossier est plus solide","body":"Cette checklist sert de contrôle final. Elle ne garantit pas une admission, mais elle réduit fortement les risques d’un dossier faible, incohérent ou mal préparé.","items":["Je sais expliquer mon projet d’études clairement.","Mes formations sont cohérentes avec mon parcours.","Mes documents sont lisibles et correspondent à ce que je déclare.","Je connais les dates importantes de ma procédure.","Je peux justifier mes choix à l’entretien.","Je sais que Campus France ne garantit pas l’admission ni le visa.","Je sais quoi faire après une réponse favorable.","Je prépare ensuite la ressource visa séparément."]},
            {"id":"res-001-sources","screen_number":20,"section_type":"sources","title":"Sources officielles à vérifier","subtitle":"Les règles peuvent évoluer","body":"Les informations officielles doivent toujours être vérifiées avant une décision importante. Cette ressource synthétise et organise la méthode, mais les pages Campus France et France-Visas restent prioritaires.","items":["Campus France — procédure Études en France : https://www.campusfrance.org/fr/candidature-procedure-etudes-en-france","Campus France — pays relevant de la procédure : https://www.campusfrance.org/fr/faq/quels-sont-les-pays-relevant-de-la-procedure-etudes-en-france","Campus France Togo — procédures et inscriptions : https://www.togo.campusfrance.org/les-procedures-et-inscriptions","Campus France Togo — calendrier 2026-2027 : https://www.togo.campusfrance.org/calendrier-de-la-procedure-2026-2027","Campus France Togo — documents requis 2026-2027 : https://www.togo.campusfrance.org/liste-des-documents-requis-procedure-etudes-en-france-2026-2027-0","Campus France Togo — les 8 étapes : https://www.togo.campusfrance.org/les-etapes-de-la-procedure-campusfrance-et-le-calendrier-de-la-procedure-campus-france","France-Visas — étudiant : https://france-visas.gouv.fr/etudiant" ]},
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
