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
        description="Pack privé pour comprendre la procédure Campus France et avancer avec méthode.",
        category="Campus France",
        price=29.99,
        target_audience="Étudiants préparant une procédure Campus France",
        what_you_get=[
            "Guide Campus France interactif",
            "Checklist dossier complet",
            "Préparation entretien",
            "Exemple de projet d'études commenté",
            "FAQ Campus France privée",
        ],
        badge="recommended",
        service_slug="prod-001",
        included_resource_ids=["res-001", "res-003", "res-004", "res-005", "res-010"],
    ),
    PrivateProductItem(
        id="prod-002",
        title="Kit Visa étudiant",
        description="Pack privé pour préparer la demande de visa étudiant avec méthode.",
        category="Visa",
        price=24.99,
        target_audience="Étudiants qui préparent la phase visa après admission",
        what_you_get=[
            "Guide visa étudiant interactif",
            "Checklist documents visa",
            "Conseils financiers",
            "Préparation des justificatifs",
        ],
        badge="popular",
        service_slug="prod-002",
        included_resource_ids=["res-007", "res-009"],
    ),
    PrivateProductItem(
        id="prod-003",
        title="Générateur projet d'études",
        description="Parcours guidé pour construire un projet d'études clair et défendable.",
        category="Projet d'études",
        price=19.99,
        target_audience="Candidats qui doivent structurer leur projet d'études",
        what_you_get=[
            "Modèle projet d'études interactif",
            "Exemple commenté",
            "Exercice de structuration",
            "Questions guidées",
        ],
        service_slug="prod-003",
        included_resource_ids=["res-002", "res-005", "res-006"],
    ),
    PrivateProductItem(
        id="prod-004",
        title="Générateur projet professionnel",
        description="Parcours guidé pour clarifier l'objectif professionnel derrière le choix d'études.",
        category="Projet professionnel",
        price=19.99,
        target_audience="Candidats dont le projet professionnel est encore flou",
        what_you_get=[
            "Exercice de motivation",
            "Clarification du parcours",
            "Structure d'argumentation",
            "Préparation entretien",
        ],
        service_slug="prod-004",
        included_resource_ids=["res-006", "res-004"],
    ),
    PrivateProductItem(
        id="prod-005",
        title="Bibliothèque de lettres de motivation",
        description="Ressources privées pour rédiger des lettres cohérentes et personnalisées.",
        category="Lettres de motivation",
        price=14.99,
        target_audience="Candidats qui doivent adapter leurs lettres aux formations",
        what_you_get=[
            "Modèle lettre de motivation interactif",
            "Méthode de personnalisation",
            "Exercice de motivation",
            "Erreurs de rédaction à éviter",
        ],
        service_slug="prod-005",
        included_resource_ids=["res-008", "res-006"],
    ),
    PrivateProductItem(
        id="prod-006",
        title="Simulateur entretien Campus France",
        description="Parcours privé pour préparer les questions et réponses de l'entretien.",
        category="Entretien",
        price=24.99,
        target_audience="Candidats Campus France avant entretien",
        what_you_get=[
            "Préparation entretien guidée",
            "Questions fréquentes Campus France",
            "Méthode de réponse",
            "Erreurs à éviter à l'oral",
        ],
        badge="popular",
        service_slug="prod-006",
        included_resource_ids=["res-004", "res-010"],
    ),
    PrivateProductItem(
        id="prod-007",
        title="Guide écoles privées",
        description="Parcours privé pour sélectionner et défendre ses candidatures en écoles privées.",
        category="Écoles privées",
        price=19.99,
        target_audience="Candidats visant des écoles privées en France",
        what_you_get=[
            "Méthode de sélection",
            "Critères de cohérence",
            "Préparation du projet",
            "Conseils de candidature",
        ],
        service_slug="prod-007",
        included_resource_ids=["res-002", "res-006"],
    ),
    PrivateProductItem(
        id="prod-008",
        title="Guide Campus Belgique",
        description="Parcours privé pour comprendre et préparer une candidature Belgique.",
        category="Belgique",
        price=14.99,
        target_audience="Candidats Belgique",
        what_you_get=[
            "Méthode de préparation",
            "Documents à anticiper",
            "Cohérence du projet",
            "Conseils pratiques",
        ],
        service_slug="prod-008",
        included_resource_ids=["res-002", "res-003"],
    ),
    PrivateProductItem(
        id="prod-009",
        title="Pack correction dossier",
        description="Service de correction pour renforcer la cohérence du dossier.",
        category="Correction",
        price=49.99,
        target_audience="Candidats qui veulent faire relire leur dossier",
        what_you_get=[
            "Analyse des documents clés",
            "Commentaires détaillés",
            "Suggestions d'amélioration",
            "Révision finale guidée",
        ],
        service_slug="prod-009",
        included_resource_ids=["res-002", "res-003", "res-006"],
    ),
    PrivateProductItem(
        id="prod-010",
        title="Pack entretien + questions fréquentes",
        description="Pack privé pour préparer l'entretien et les questions Campus France.",
        category="Entretien",
        price=34.99,
        target_audience="Candidats qui veulent sécuriser leur préparation orale",
        what_you_get=[
            "Préparation entretien complète",
            "Questions fréquentes Campus France",
            "Méthode de réponse",
            "Checklist avant rendez-vous",
        ],
        service_slug="prod-010",
        included_resource_ids=["res-004", "res-010", "res-001"],
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
        description="Tunnel privé pour construire un projet d'études clair, cohérent et défendable devant Campus France.",
        category="Projet d'études",
        resource_type="template",
        badge_label="Modèle interactif",
        action_label="Ouvrir",
        access_level="student",
        url="/espace-etudiant/ressources/modele-projet-etudes",
    ),
    PrivateResourceItem(
        id="res-003",
        title="Checklist dossier complet",
        description="Checklist privée pour contrôler les pièces du dossier avant soumission.",
        category="Dossier",
        resource_type="checklist",
        badge_label="Checklist interactive",
        action_label="Ouvrir",
        access_level="student",
        url="/espace-etudiant/ressources/checklist-dossier-complet",
    ),
    PrivateResourceItem(
        id="res-004",
        title="Préparer votre entretien Campus France",
        description="Parcours privé pour préparer les questions et réponses de l'entretien.",
        category="Entretien",
        resource_type="video",
        badge_label="Parcours entretien",
        action_label="Ouvrir",
        duration_label="35 min",
        access_level="student",
        url="/espace-etudiant/ressources/preparer-entretien-campus-france",
    ),
    PrivateResourceItem(
        id="res-005",
        title="Exemple projet d'études commenté",
        description="Exemple privé expliqué phrase par phrase pour comprendre la logique attendue.",
        category="Projet d'études",
        resource_type="example",
        badge_label="Exemple commenté",
        action_label="Ouvrir",
        access_level="student",
    ),
    PrivateResourceItem(
        id="res-006",
        title="Exercice : Structurer votre motivation",
        description="Exercice privé pour clarifier vos motivations et construire vos arguments.",
        category="Motivation",
        resource_type="exercise",
        badge_label="Exercice interactif",
        action_label="Ouvrir",
        access_level="student",
    ),
    PrivateResourceItem(
        id="res-007",
        title="Guide visa étudiant",
        description="Parcours privé pour préparer la procédure visa étudiant étape par étape.",
        category="Visa",
        resource_type="guide",
        badge_label="Guide interactif",
        action_label="Ouvrir",
        access_level="student",
    ),
    PrivateResourceItem(
        id="res-008",
        title="Modèle lettre de motivation",
        description="Modèle privé pour rédiger une lettre claire, personnalisée et cohérente.",
        category="Lettres",
        resource_type="template",
        badge_label="Modèle interactif",
        action_label="Ouvrir",
        access_level="student",
    ),
    PrivateResourceItem(
        id="res-009",
        title="Checklist documents visa",
        description="Checklist privée pour contrôler les documents essentiels de la phase visa.",
        category="Visa",
        resource_type="checklist",
        badge_label="Checklist interactive",
        action_label="Ouvrir",
        access_level="student",
    ),
    PrivateResourceItem(
        id="res-010",
        title="Questions fréquentes Campus France",
        description="FAQ privée pour répondre aux blocages les plus courants de la procédure.",
        category="Campus France",
        resource_type="video",
        badge_label="FAQ interactive",
        action_label="Ouvrir",
        duration_label="20 min",
        access_level="student",
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
            {"id":"res-001-paywall","screen_number":2,"section_type":"paywall","title":"Débloque le guide complet","subtitle":"Accès privé","body":"La suite contient la méthode complète écran par écran : construction du projet, compte Études en France, documents, choix des formations, soumission, entretien, suivi des réponses, erreurs à éviter et checklist finale. Aucun fichier partageable, aucun téléchargement : la ressource se lit uniquement dans ton espace privé.","items":["Lecture guidée en format tunnel, pas une longue page fatigante.","Checklist interactive non téléchargeable.","Contenu protégé par ton compte, anti-copie et filigrane discret.","Accès complet après paiement ou droit actif validé côté backend."],"is_locked":True},
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
    },
    "modele-projet-etudes": {
        "id": "res-002",
        "title": "Modèle projet d'études",
        "slug": "modele-projet-etudes",
        "description": "Construire un projet d'études clair, cohérent et défendable pour Campus France, les établissements et l'entretien.",
        "category": "Projet d'études",
        "reading_minutes": 40,
        "checkout_service_slug": "resource-modele-projet-etudes",
        "sections": [
            {"id":"res-002-preview","screen_number":1,"section_type":"preview","title":"Modèle projet d'études","subtitle":"Aperçu gratuit","body":"Cette ressource t'aide à construire un projet d'études solide au lieu d'écrire un texte vague. Le but est de relier ton parcours, ton choix de formation, ton choix de la France et ton projet professionnel dans une logique claire.","items":["Comprendre ce qu'un projet d'études doit prouver.","Éviter les phrases génériques qui affaiblissent le dossier.","Construire une trame claire utilisable pour Campus France.","Préparer des arguments défendables à l'entretien."],"is_preview":True},
            {"id":"res-002-paywall","screen_number":2,"section_type":"paywall","title":"Débloque le modèle complet","subtitle":"Accès privé","body":"La suite contient la méthode complète : diagnostic du parcours, choix du domaine, justification de la formation, choix de la France, projet professionnel, modèle phrase par phrase, exemples de formulations, erreurs à éviter et checklist finale. Aucun fichier partageable, aucun téléchargement : tout reste dans ton espace privé.","items":["Méthode guidée écran par écran.","Modèle structuré sans copier-coller dangereux.","Checklist de cohérence avant entretien.","Contenu protégé par ton compte et filigrane."],"is_locked":True},
            {"id":"res-002-purpose","screen_number":3,"section_type":"chapter","title":"Ce que doit prouver ton projet","subtitle":"Un projet d'études n'est pas une lettre décorative","body":"Ton projet d'études doit montrer que ta candidature a une direction. Il explique d'où tu viens, ce que tu veux étudier, pourquoi ce choix est logique, ce que la formation va t'apporter et comment elle s'inscrit dans ton avenir professionnel.","items":["Ton parcours actuel doit mener naturellement vers le domaine visé.","Ton choix de formation doit être précis, pas seulement prestigieux.","Ton choix de la France doit avoir une raison académique ou professionnelle.","Ton projet professionnel doit être crédible et cohérent." ]},
            {"id":"res-002-official-expectation","screen_number":4,"section_type":"chapter","title":"Ce que Campus France regarde","subtitle":"Cohérence, clarté et capacité à expliquer","body":"Campus France Mali indique qu'un projet d'études est prêt lorsque le candidat est capable d'en parler librement et de le présenter à l'écrit ou à l'oral. Campus France Togo rappelle que l'entretien permet d'exposer en détail son projet d'études, son parcours et ses motivations.","items":["Le projet doit être compréhensible à l'écrit.","Tu dois pouvoir l'expliquer sans réciter.","Le projet doit être relié à tes choix de formations.","Il doit rester cohérent avec ton parcours réel." ]},
            {"id":"res-002-map","screen_number":5,"section_type":"timeline","title":"La structure gagnante","subtitle":"6 blocs, pas un texte improvisé","body":"Un bon projet d'études se construit comme une argumentation. Chaque partie prépare la suivante. Si tu sautes une partie, le texte devient vague ou déséquilibré.","items":["1. Situation actuelle : qui tu es académiquement.","2. Parcours : ce que tu as déjà appris ou construit.","3. Déclic : pourquoi ce domaine t'intéresse vraiment.","4. Formation visée : pourquoi ce programme est logique.","5. France : pourquoi poursuivre ce projet dans ce système d'études.","6. Projet professionnel : ce que tu veux faire ensuite." ]},
            {"id":"res-002-profile","screen_number":6,"section_type":"chapter","title":"Bloc 1 — Présenter ton profil","subtitle":"Commencer simple et précis","body":"Le début doit situer ton profil sans raconter toute ta vie. Tu présentes ton niveau, ton domaine, ton établissement ou expérience principale, puis tu annonces clairement la direction de ton projet.","items":["Je suis actuellement en…","Mon parcours est orienté vers…","Mes matières ou expériences fortes sont…","Je souhaite poursuivre vers…","Ce choix s'inscrit dans une continuité parce que…" ]},
            {"id":"res-002-background","screen_number":7,"section_type":"chapter","title":"Bloc 2 — Relier ton parcours au choix","subtitle":"La continuité doit être visible","body":"Un projet fort montre que tu ne changes pas de direction au hasard. Même en cas de réorientation, tu dois expliquer le lien : compétences transférables, découverte progressive du domaine, objectif professionnel ou besoin de spécialisation.","items":["Quelles matières t'ont marqué ?","Quels projets, stages ou expériences appuient ce choix ?","Quelles compétences as-tu déjà commencé à développer ?","Si tu te réorientes, quelle est la logique de cette réorientation ?" ]},
            {"id":"res-002-field-choice","screen_number":8,"section_type":"chapter","title":"Bloc 3 — Justifier le domaine","subtitle":"Pourquoi ce domaine et pas un autre ?","body":"Le domaine choisi doit être défendu avec des raisons précises. Évite les phrases comme : j'aime beaucoup ce domaine. Explique plutôt ce que ce domaine permet de résoudre, créer, gérer, analyser ou transformer.","items":["Ce domaine correspond à mon intérêt pour…","Il me permet de développer des compétences en…","Il répond à mon objectif de…","Il est cohérent avec mon parcours parce que…" ]},
            {"id":"res-002-program-choice","screen_number":9,"section_type":"chapter","title":"Bloc 4 — Justifier la formation","subtitle":"Le programme doit être cité intelligemment","body":"Tu dois montrer que tu as lu la formation. Il ne suffit pas de citer le nom de l'établissement. Tu dois parler du contenu : matières, spécialisation, compétences, pédagogie, stage, alternance, débouchés ou adéquation avec ton objectif.","items":["Cette formation m'intéresse pour ses enseignements en…","Elle correspond à mon besoin de renforcer…","Le programme est adapté à mon projet car…","Les débouchés visés correspondent à…","Je ne choisis pas seulement une ville ou une réputation." ]},
            {"id":"res-002-france-choice","screen_number":10,"section_type":"chapter","title":"Bloc 5 — Expliquer le choix de la France","subtitle":"Évite les raisons trop générales","body":"Dire que la France est un bon pays d'études ne suffit pas. Ton argument doit être relié à la qualité de la formation, au domaine, à la pédagogie, au lien avec ton projet professionnel ou à la reconnaissance du diplôme.","items":["Le système français m'intéresse pour…","La formation visée propose…","Ce parcours me permettra de développer…","L'environnement académique correspond à mon objectif de…","Le choix de la France doit renforcer ton projet, pas le remplacer." ]},
            {"id":"res-002-career","screen_number":11,"section_type":"chapter","title":"Bloc 6 — Construire le projet professionnel","subtitle":"Un objectif crédible, pas une promesse vague","body":"Le projet professionnel doit être réaliste. Tu peux viser un métier, un secteur ou une mission, mais il faut montrer comment la formation choisie t'aide à y arriver. Le projet peut évoluer, mais il ne doit pas être flou.","items":["À moyen terme, je souhaite évoluer vers…","La formation me permettra d'acquérir…","Ces compétences seront utiles pour…","Je veux contribuer à…","Le projet professionnel doit rester lié au domaine étudié." ]},
            {"id":"res-002-model","screen_number":12,"section_type":"chapter","title":"Modèle complet à adapter","subtitle":"Une trame, pas un texte à copier","body":"Je suis actuellement [niveau/parcours] dans le domaine de [domaine]. Mon parcours m'a permis de développer un intérêt particulier pour [sujet/compétence], notamment à travers [matières/projets/expériences]. Je souhaite poursuivre mes études en [formation visée] afin de renforcer mes compétences en [compétences ciblées]. Ce choix est cohérent avec mon objectif de [objectif professionnel], car cette formation propose [éléments précis du programme]. Étudier en France représente pour moi une opportunité de bénéficier d'un cadre académique adapté à mon projet, tout en développant les connaissances nécessaires pour évoluer vers [métier/secteur/projet].", "items":["Remplace chaque crochet par une information personnelle précise.","Ajoute des éléments réels du programme visé.","Ne garde aucune phrase qui pourrait être envoyée par n'importe quel candidat.","Le modèle doit rester naturel et défendable à l'oral." ]},
            {"id":"res-002-before-after","screen_number":13,"section_type":"chapter","title":"Transformer une phrase faible","subtitle":"Du vague vers le solide","body":"Une phrase faible dit : je veux étudier en France car la France a de bonnes universités. Une phrase plus solide explique : la formation visée me permettra de renforcer mes compétences en gestion de projet et analyse financière, deux compétences indispensables pour mon objectif d'évoluer dans le conseil aux entreprises.","items":["Faible : j'aime cette filière depuis longtemps.","Solide : mon intérêt s'est renforcé à travers mes cours de… et mon projet de…","Faible : cette école est connue.","Solide : le programme de cette formation correspond à mon objectif grâce à…","Faible : je veux réussir ma vie.","Solide : je souhaite développer des compétences pour évoluer vers…" ]},
            {"id":"res-002-adaptation","screen_number":14,"section_type":"chapter","title":"Adapter le projet à chaque formation","subtitle":"Une seule base, plusieurs versions précises","body":"Tu peux garder une base commune, mais chaque formation doit avoir une justification adaptée. Les établissements doivent sentir que tu as compris leur programme. Une motivation identique pour toutes les formations donne une impression de candidature automatique.","items":["Garde le même projet global.","Change les arguments liés au programme.","Mentionne les matières ou spécialités pertinentes.","Adapte les débouchés si la formation a une orientation spécifique.","Vérifie que chaque version reste vraie à l'entretien." ]},
            {"id":"res-002-interview","screen_number":15,"section_type":"checklist","title":"Préparer la défense orale","subtitle":"Ton projet doit tenir à l'entretien","body":"L'entretien Campus France permet au candidat d'exposer son projet d'études, son parcours et ses motivations. Si tu ne sais pas expliquer ton texte naturellement, il faut le retravailler.","items":["Je peux résumer mon projet en 60 secondes.","Je peux expliquer pourquoi cette formation précise.","Je peux citer au moins deux éléments du programme.","Je peux expliquer le lien avec mon parcours.","Je peux parler de mon projet professionnel sans rester vague.","Je peux répondre sans lire ni réciter." ]},
            {"id":"res-002-mistakes","screen_number":16,"section_type":"mistakes","title":"Erreurs fréquentes","subtitle":"Ce qui rend le projet faible","body":"Les erreurs les plus dangereuses sont celles qui donnent l'impression que le candidat n'a pas réfléchi à son projet ou qu'il a copié un modèle trouvé ailleurs.","items":["Copier un modèle sans personnalisation.","Parler uniquement de la France, pas de la formation.","Choisir des formations sans lien logique.","Faire des phrases trop longues et abstraites.","Promettre des choses irréalistes.","Ne pas connaître le contenu des formations citées.","Avoir un projet professionnel sans rapport avec la formation." ]},
            {"id":"res-002-final-checklist","screen_number":17,"section_type":"checklist","title":"Checklist finale","subtitle":"Avant d'utiliser ton projet dans le dossier","body":"Utilise cette checklist avant d'envoyer ou de défendre ton projet. Si un point n'est pas clair, reprends le texte avant d'aller plus loin.","items":["Mon parcours est présenté clairement.","Mon domaine cible est justifié.","La formation choisie est expliquée avec des détails précis.","Le choix de la France est relié à mon objectif.","Mon projet professionnel est crédible.","Chaque version est adaptée à la formation concernée.","Je peux défendre mon projet à l'oral sans réciter.","Aucune phrase ne donne l'impression d'un copier-coller." ]},
            {"id":"res-002-sources","screen_number":18,"section_type":"sources","title":"Sources et repères officiels","subtitle":"À vérifier régulièrement","body":"Cette ressource organise une méthode de rédaction. Les attentes officielles et calendriers doivent toujours être vérifiés sur les pages Campus France de référence.","items":["Campus France Mali — Préparer son projet d'études : https://www.mali.campusfrance.org/preparer-son-projet-d-etudes","Campus France Togo — L'entretien Campus France : https://www.togo.campusfrance.org/l-entretien-campus-france","Campus France Maroc — Entretien de candidature : https://www.maroc.campusfrance.org/l-entretien-de-candidature-de-campus-france","Campus France Togo — Guide Études en France : https://www.togo.campusfrance.org/le-guide-d-utilisation-de-la-plateforme-etudes-en-france","Campus France — Procédure Études en France : https://www.campusfrance.org/fr/candidature-procedure-etudes-en-france" ]},
        ],
    },
    "checklist-dossier-complet": {
        "id": "res-003",
        "title": "Checklist dossier complet",
        "slug": "checklist-dossier-complet",
        "description": "Contrôler les pièces, les informations et la cohérence du dossier Campus France avant soumission.",
        "category": "Dossier",
        "reading_minutes": 35,
        "checkout_service_slug": "resource-checklist-dossier-complet",
        "sections": [
            {"id":"res-003-preview","screen_number":1,"section_type":"preview","title":"Checklist dossier complet","subtitle":"Aperçu gratuit","body":"Cette checklist t’aide à contrôler ton dossier avant soumission : identité, parcours, diplômes, relevés, justificatifs, formations, motivations et cohérence générale. L’objectif n’est pas d’empiler des documents, mais d’éviter un dossier incomplet, flou ou contradictoire.","items":["Tu comprends les familles de documents à préparer.","Tu vois les points qui bloquent souvent un dossier.","Tu apprends à vérifier la lisibilité et la cohérence.","Tu peux ensuite débloquer la checklist complète écran par écran."],"is_preview":True},
            {"id":"res-003-paywall","screen_number":2,"section_type":"paywall","title":"Débloque la checklist complète","subtitle":"Accès privé","body":"La suite contient le contrôle complet du dossier : documents par profil, identité, parcours, notes, diplômes, justificatifs, traductions, formations, motivation, entretien et contrôle final avant soumission. Aucun fichier partageable, aucun téléchargement : la checklist reste dans ton espace privé.","items":["Checklist guidée en format tunnel.","Contrôle des pièces selon le niveau du candidat.","Méthode anti-erreurs avant soumission.","Contenu protégé par ton compte et filigrane."],"is_locked":True},
            {"id":"res-003-purpose","screen_number":3,"section_type":"chapter","title":"Pourquoi une checklist sérieuse","subtitle":"Un dossier complet n’est pas forcément un bon dossier","body":"La procédure Études en France repose sur un dossier électronique. Les documents doivent prouver ce que tu déclares, mais ils doivent aussi être cohérents entre eux. Un dossier peut être rejeté ou affaibli par des pièces manquantes, illisibles, mal classées ou contradictoires.","items":["Chaque document doit correspondre à une information déclarée.","La lisibilité compte autant que la présence du document.","Les dates doivent être cohérentes d’une pièce à l’autre.","La checklist doit être faite avant la soumission, pas après." ]},
            {"id":"res-003-official-basis","screen_number":4,"section_type":"chapter","title":"Base officielle à vérifier","subtitle":"Les documents varient selon le profil","body":"Campus France Togo publie une liste des documents requis pour la procédure Études en France 2026-2027. La liste change selon le niveau du candidat : terminale, post-bac, Licence, Master ou autre parcours. Il faut donc vérifier la page officielle avant de considérer son dossier prêt.","items":["Ne te fie pas uniquement à une ancienne liste partagée par quelqu’un.","Vérifie la version officielle de l’année concernée.","Compare ton niveau réel avec la catégorie qui correspond.","Prépare aussi les pièces complémentaires liées à ton parcours." ]},
            {"id":"res-003-identity","screen_number":5,"section_type":"checklist","title":"Bloc 1 — Identité et informations personnelles","subtitle":"La base doit être exacte","body":"Les informations personnelles doivent être propres et constantes : nom, prénom, date de naissance, pays, coordonnées et pièces d’identité. Une différence entre le compte et les documents peut créer des complications.","items":["Pièce d’identité valide et lisible.","Nom et prénoms identiques sur les documents.","Date de naissance cohérente partout.","Adresse email fiable et consultée régulièrement.","Numéro de téléphone au format correct.","Photo ou éléments d’identité si demandés par l’espace Campus France local." ]},
            {"id":"res-003-academic-path","screen_number":6,"section_type":"checklist","title":"Bloc 2 — Parcours académique","subtitle":"Chaque année doit être compréhensible","body":"Ton parcours doit pouvoir être lu sans confusion. Les années de lycée, de bac, d’université, de redoublement, de pause ou de reprise doivent être claires. Les documents doivent couvrir les périodes importantes.","items":["Bulletins ou relevés des années demandées.","Relevé de notes du baccalauréat ou équivalent si concerné.","Attestation de réussite ou diplôme si disponible.","Attestation d’inscription ou certificat de fréquentation si l’année est en cours.","Relevés universitaires par année si tu es déjà dans le supérieur.","Explication cohérente en cas de pause, réorientation ou reprise." ]},
            {"id":"res-003-terminale","screen_number":7,"section_type":"checklist","title":"Profil terminale ou futur bachelier","subtitle":"Préparer maintenant, compléter après résultat","body":"Pour les candidats encore en terminale, Campus France Togo mentionne notamment les bulletins des années précédentes, les éléments liés au Bac 1, l’attestation d’inscription ou de fréquentation, puis les éléments du Bac 2 à compléter dès obtention.","items":["Bulletins de seconde selon l’organisation de l’année.","Bulletins de première selon l’organisation de l’année.","Relevé de notes du Bac 1 si applicable.","Attestation d’inscription ou certificat de fréquentation en terminale.","Relevé de notes du Bac 2 dès obtention.","Attestation de réussite du Bac 2 dès obtention." ]},
            {"id":"res-003-superior","screen_number":8,"section_type":"checklist","title":"Profil études supérieures","subtitle":"Chaque niveau doit être prouvé","body":"Si tu as déjà commencé des études supérieures, il faut préparer les relevés, attestations et diplômes correspondant à chaque année. Le dossier doit montrer une progression lisible jusqu’au niveau demandé.","items":["Relevés de notes de chaque année supérieure suivie.","Attestation de réussite ou diplôme obtenu.","Attestation d’inscription pour l’année en cours si nécessaire.","Documents liés aux stages, travaux ou expériences si utiles.","Explication claire en cas de redoublement ou changement de filière.","Cohérence entre niveau déclaré et pièces fournies." ]},
            {"id":"res-003-activities","screen_number":9,"section_type":"checklist","title":"Bloc 3 — Activités et expériences","subtitle":"Seulement ce qui renforce le dossier","body":"Les stages, emplois, formations, concours, bénévolat ou projets peuvent renforcer le dossier s’ils sont liés au parcours ou au projet. Mais chaque élément déclaré doit pouvoir être justifié proprement.","items":["Attestations de stage si tu déclares un stage.","Attestations de travail si tu déclares une expérience professionnelle.","Certificats de formation si tu les mentionnes.","Justificatifs de concours ou activités pertinentes.","Documents lisibles et cohérents avec les dates déclarées.","Évite d’ajouter des activités sans lien ni preuve." ]},
            {"id":"res-003-language","screen_number":10,"section_type":"chapter","title":"Bloc 4 — Langue et traductions","subtitle":"Un document incompréhensible ne sert pas le dossier","body":"Les exigences peuvent varier selon les pays, les établissements et les documents. Le principe reste simple : le lecteur doit pouvoir comprendre et vérifier la pièce. Si un document n’est pas en français ou dans un format acceptable, il faut vérifier s’il doit être traduit ou accompagné.","items":["Vérifie les exigences de ton espace Campus France local.","Vérifie aussi les exigences de l’établissement visé.","Les traductions doivent être propres et cohérentes avec les originaux.","Ne modifie jamais un document officiel.","Garde les originaux pour les contrôles éventuels." ]},
            {"id":"res-003-scan-quality","screen_number":11,"section_type":"checklist","title":"Bloc 5 — Qualité des fichiers","subtitle":"Lisible, complet, bien orienté","body":"Un document présent mais illisible peut poser problème. Avant de soumettre, vérifie chaque fichier comme si tu étais la personne qui va l’examiner pour la première fois.","items":["Le document est net et lisible.","Aucune partie importante n’est coupée.","Le fichier est dans le bon sens.","Toutes les pages nécessaires sont présentes.","Le nom du fichier permet de comprendre la pièce.","Le document correspond bien à la rubrique où il est ajouté." ]},
            {"id":"res-003-study-plan","screen_number":12,"section_type":"checklist","title":"Bloc 6 — Formations choisies","subtitle":"Les choix doivent être cohérents avec le dossier","body":"La checklist ne concerne pas seulement les pièces. Les formations choisies doivent être vérifiées avant soumission : niveau, prérequis, calendrier, procédure parallèle, langue et cohérence avec le projet d’études.","items":["Le niveau demandé correspond à mon niveau réel.","Les prérequis sont compatibles avec mon parcours.","Le contenu de la formation est bien compris.","La formation est cohérente avec mon projet professionnel.","J’ai vérifié les éventuelles démarches parallèles.","Je peux justifier chaque choix à l’entretien." ]},
            {"id":"res-003-motivation","screen_number":13,"section_type":"checklist","title":"Bloc 7 — Motivations et cohérence","subtitle":"Les documents doivent soutenir ton histoire","body":"Les motivations doivent être alignées avec les documents. Si tu dis vouloir une formation mais que ton parcours, tes justificatifs ou ton projet racontent autre chose, le dossier devient fragile.","items":["Mon projet d’études est clair.","Mes motivations ne sont pas génériques.","Je peux relier mon parcours à mes choix de formations.","Je peux expliquer pourquoi la France.","Mon projet professionnel reste crédible.","Mon dossier et mon discours racontent la même logique." ]},
            {"id":"res-003-before-submit","screen_number":14,"section_type":"timeline","title":"Contrôle avant soumission","subtitle":"Le dernier passage doit être méthodique","body":"Avant de soumettre, relis dans un ordre fixe. Ne fais pas une relecture émotionnelle. Fais un contrôle technique, puis un contrôle de cohérence, puis un contrôle de lisibilité.","items":["1. Contrôler les informations personnelles.","2. Ouvrir chaque document et vérifier sa lisibilité.","3. Comparer les dates et niveaux déclarés.","4. Vérifier les formations et prérequis.","5. Relire les motivations.","6. Garder les preuves et surveiller les messages officiels." ]},
            {"id":"res-003-mistakes","screen_number":15,"section_type":"mistakes","title":"Erreurs fréquentes","subtitle":"Ce qui fragilise le dossier","body":"La plupart des erreurs viennent d’une préparation trop tardive ou d’un mauvais contrôle final. Cette liste doit être relue juste avant soumission.","items":["Document flou ou incomplet.","Dates contradictoires entre le dossier et les pièces.","Rubrique mal remplie ou document mal classé.","Formation choisie sans vérifier les prérequis.","Projet d’études sans lien avec le parcours.","Compte consulté trop rarement après soumission.","Attendre le dernier jour pour corriger un document manquant." ]},
            {"id":"res-003-final-checklist","screen_number":16,"section_type":"checklist","title":"Checklist finale dossier complet","subtitle":"À cocher avant de continuer","body":"Cette checklist ne garantit pas une admission, mais elle réduit les risques d’un dossier incomplet, incohérent ou mal présenté.","items":["Mon identité est correcte et constante.","Mes documents académiques correspondent à mon niveau.","Mes justificatifs sont lisibles et complets.","Mes activités déclarées sont prouvables.","Mes formations sont cohérentes avec mon projet.","Mes motivations sont personnalisées.","Je connais les dates importantes.","Je suis prêt à expliquer mon dossier à l’entretien." ]},
            {"id":"res-003-sources","screen_number":17,"section_type":"sources","title":"Sources officielles à vérifier","subtitle":"Les listes peuvent changer","body":"Les exigences documentaires évoluent selon les pays, les campagnes et les profils. Vérifie toujours les pages officielles avant soumission.","items":["Campus France Togo — Liste des documents requis 2026-2027 : https://www.togo.campusfrance.org/liste-des-documents-requis-procedure-etudes-en-france-2026-2027","Campus France Togo — Document documents requis : https://www.togo.campusfrance.org/system/files/medias/documents/2025-10/Documents%20requis%20-%20corrections%20AM.pdf","Campus France Togo — Calendrier 2026-2027 : https://www.togo.campusfrance.org/calendrier-de-la-procedure-2026-2027","Campus France Togo — Les procédures et inscriptions : https://www.togo.campusfrance.org/les-procedures-et-inscriptions","Campus France — Procédure Études en France : https://www.campusfrance.org/fr/candidature-procedure-etudes-en-france" ]},
        ],
    },
    "preparer-entretien-campus-france": {
        "id": "res-004",
        "title": "Préparer votre entretien Campus France",
        "slug": "preparer-entretien-campus-france",
        "description": "Préparer l'entretien Campus France avec méthode : projet, parcours, motivations, formations, financement et réponses naturelles.",
        "category": "Entretien",
        "reading_minutes": 35,
        "checkout_service_slug": "resource-preparer-entretien-campus-france",
        "sections": [
            {"id":"res-004-preview","screen_number":1,"section_type":"preview","title":"Préparer votre entretien Campus France","subtitle":"Aperçu gratuit","body":"Cette ressource t’aide à préparer l’entretien Campus France sans réciter un texte artificiel. L’objectif est de savoir expliquer ton parcours, ton projet d’études, tes choix de formations, tes motivations et ton financement de façon claire et crédible.","items":["Comprendre ce que l’entretien cherche à vérifier.","Préparer ton projet sans apprendre un script par cœur.","Travailler les questions les plus fréquentes.","Identifier les erreurs qui fragilisent le discours."],"is_preview":True},
            {"id":"res-004-paywall","screen_number":2,"section_type":"paywall","title":"Débloque la préparation complète","subtitle":"Accès privé","body":"La suite contient la méthode complète : structure de réponse, questions fréquentes, simulation guidée, préparation du financement, documents à avoir, erreurs à éviter et checklist finale. Aucun fichier partageable, aucun téléchargement : tout reste dans ton espace privé.","items":["Parcours guidé en format tunnel.","Questions et méthode de réponse.","Simulation orale progressive.","Contenu protégé par ton compte et filigrane."],"is_locked":True},
            {"id":"res-004-role","screen_number":3,"section_type":"chapter","title":"Comprendre le rôle de l’entretien","subtitle":"Ce n’est pas une simple formalité","body":"Campus France Togo présente l’entretien comme un moment important où le candidat expose en détail son projet d’études, son parcours et ses motivations. Campus France Mali rappelle aussi que l’entretien permet d’évaluer la cohérence entre le projet, les motivations et le parcours académique.","items":["Tu dois expliquer ce que tu veux étudier.","Tu dois montrer le lien avec ton parcours.","Tu dois défendre tes choix de formations.","Tu dois parler naturellement de tes motivations." ]},
            {"id":"res-004-mindset","screen_number":4,"section_type":"chapter","title":"L’état d’esprit à avoir","subtitle":"Préparation sérieuse, discours naturel","body":"Le bon objectif n’est pas de trouver des réponses parfaites. Le bon objectif est de comprendre ton projet assez clairement pour pouvoir l’expliquer sans panique. Une réponse naturelle, précise et cohérente vaut mieux qu’un texte récité.","items":["Ne mens pas sur ton parcours.","Ne récite pas des phrases trouvées en ligne.","Reste simple et précis.","Assume ton parcours, même s’il comporte une pause ou une réorientation.","Montre que tu as réellement étudié les formations choisies." ]},
            {"id":"res-004-structure","screen_number":5,"section_type":"timeline","title":"La structure de réponse en 5 temps","subtitle":"Répondre sans se perdre","body":"Pour chaque grande question, utilise une structure courte. Elle t’aide à répondre clairement sans parler trop longtemps ni oublier l’essentiel.","items":["1. Réponse directe à la question.","2. Lien avec ton parcours.","3. Justification du choix de formation.","4. Lien avec ton projet professionnel.","5. Conclusion simple et crédible." ]},
            {"id":"res-004-project","screen_number":6,"section_type":"chapter","title":"Question : présentez votre projet","subtitle":"La réponse centrale","body":"Cette question vérifie si tu sais où tu vas. Ta réponse doit résumer ton niveau actuel, ton domaine, la formation visée, ton objectif professionnel et la logique globale. Évite les détails inutiles au début.","items":["Je suis actuellement…","Mon parcours m’a orienté vers…","Je souhaite poursuivre en…","Cette formation me permettra de…","À terme, je souhaite…" ]},
            {"id":"res-004-france","screen_number":7,"section_type":"chapter","title":"Question : pourquoi la France ?","subtitle":"Éviter les réponses trop générales","body":"Répondre que la France est un bon pays d’études ne suffit pas. Ta réponse doit relier la France à la qualité du programme, au domaine visé, à la pédagogie, aux compétences recherchées ou à la cohérence de ton projet.","items":["Parle du contenu académique, pas seulement du pays.","Explique pourquoi ce système d’études sert ton projet.","Mentionne la spécialisation ou les compétences que tu recherches.","Évite les phrases vagues comme : j’aime la culture française." ]},
            {"id":"res-004-formation","screen_number":8,"section_type":"chapter","title":"Question : pourquoi cette formation ?","subtitle":"Tu dois connaître ce que tu as choisi","body":"Un candidat solide peut citer des éléments concrets du programme : matières, parcours, compétences, stage, alternance, débouchés ou spécialisation. Si tu ne sais pas expliquer la formation, le choix paraît fragile.","items":["Cite au moins deux éléments du programme.","Explique le lien avec ton niveau actuel.","Explique le lien avec ton projet professionnel.","Prépare une phrase différente pour chaque formation importante." ]},
            {"id":"res-004-background","screen_number":9,"section_type":"chapter","title":"Question : lien avec votre parcours","subtitle":"La cohérence doit être visible","body":"Le conseiller peut chercher à comprendre pourquoi ton parcours mène vers ce choix. Même si tu te réorientes, tu dois expliquer la logique : compétences transférables, découverte progressive, objectif professionnel ou besoin de spécialisation.","items":["Quelles matières appuient ton choix ?","Quels projets ou expériences renforcent ton orientation ?","Quelle compétence veux-tu approfondir ?","Si tu changes de domaine, pourquoi ce changement est cohérent ?" ]},
            {"id":"res-004-career","screen_number":10,"section_type":"chapter","title":"Question : projet professionnel","subtitle":"Un objectif crédible, pas une promesse vague","body":"Le projet professionnel doit montrer une direction. Tu n’es pas obligé d’avoir tout figé, mais tu dois pouvoir expliquer le secteur, le métier ou la mission que tu vises, et pourquoi la formation t’aide à y arriver.","items":["À moyen terme, je souhaite évoluer vers…","La formation m’aidera à développer…","Ces compétences seront utiles pour…","Ce projet est cohérent avec mon parcours parce que…" ]},
            {"id":"res-004-funding","screen_number":11,"section_type":"chapter","title":"Question : financement du projet","subtitle":"Répondre clairement et sans approximation","body":"Le financement peut être abordé pendant l’entretien. Tu dois connaître les grandes lignes : qui finance, comment, avec quels justificatifs éventuels, et comment tu comptes organiser ton séjour. Ne réponds pas au hasard.","items":["Qui finance le projet ?","Quelle est la source principale de revenus ou soutien ?","Quels justificatifs pourront être fournis ?","As-tu réfléchi au logement, au budget et aux frais de vie ?","Ne donne pas de chiffres inventés si tu ne les maîtrises pas." ]},
            {"id":"res-004-documents","screen_number":12,"section_type":"checklist","title":"Documents et éléments à avoir en tête","subtitle":"Ne viens pas sans connaître ton dossier","body":"Campus France Maroc indique qu’il faut apporter la pièce d’identité originale et les originaux du dossier pédagogique scanné dans le dossier Études en France. Même si les consignes varient selon l’espace Campus France, le principe est clair : tu dois connaître et pouvoir justifier ton dossier.","items":["Pièce d’identité originale selon les consignes locales.","Originaux des documents scannés si demandés.","Relevés et diplômes importants.","Liste des formations choisies.","Arguments principaux du projet d’études.","Preuves ou éléments liés au financement si nécessaire." ]},
            {"id":"res-004-questions","screen_number":13,"section_type":"checklist","title":"Questions fréquentes à travailler","subtitle":"Préparer les idées, pas réciter","body":"Ces questions doivent être travaillées à voix haute. Le but n’est pas d’apprendre un texte, mais de vérifier que tu peux répondre avec calme et cohérence.","items":["Présentez-vous brièvement.","Pourquoi voulez-vous étudier en France ?","Pourquoi cette formation ?","Pourquoi cet établissement ?","Quel lien avec vos études précédentes ?","Quel est votre projet professionnel ?","Comment financez-vous vos études ?","Que ferez-vous si vous n’êtes pas accepté ?","Pourquoi ne pas poursuivre dans votre pays ?","Avez-vous vérifié les débouchés de cette formation ?" ]},
            {"id":"res-004-simulation","screen_number":14,"section_type":"timeline","title":"Simulation en 20 minutes","subtitle":"Un entraînement simple et efficace","body":"L’entretien Campus France Togo est présenté comme un échange d’environ vingt minutes. Utilise ce format pour t’entraîner : court, clair et structuré.","items":["Minutes 1-3 : présentation du parcours.","Minutes 4-7 : projet d’études et choix du domaine.","Minutes 8-11 : formations choisies et établissements.","Minutes 12-15 : projet professionnel.","Minutes 16-18 : financement et organisation.","Minutes 19-20 : questions finales et clarification." ]},
            {"id":"res-004-answer-method","screen_number":15,"section_type":"chapter","title":"Méthode pour améliorer une réponse","subtitle":"Court, précis, personnel","body":"Une bonne réponse n’est pas forcément longue. Elle doit être personnelle, précise et reliée au dossier. Si ta réponse pourrait être dite par n’importe quel candidat, elle est trop vague.","items":["Commence par répondre directement.","Ajoute un élément personnel de ton parcours.","Relie à une formation ou compétence précise.","Termine par le projet professionnel.","Évite les réponses apprises mot pour mot." ]},
            {"id":"res-004-video","screen_number":16,"section_type":"video","title":"Vidéos intégrées","subtitle":"Option volontairement limitée","body":"Pour cette ressource, aucune vidéo YouTube n’est intégrée pour le moment. La priorité est une préparation fiable, écrite et contrôlée dans l’espace privé. Une vidéo ne sera ajoutée que si elle est vraiment officielle, récente, claire et utile.","items":["Pas de vidéo moyenne ajoutée pour remplir la page.","La ressource reste complète sans vidéo.","Maximum deux vidéos pourront être ajoutées plus tard si elles respectent le niveau attendu.","La lecture doit rester sur le site, pas forcer l’étudiant à partir ailleurs." ]},
            {"id":"res-004-mistakes","screen_number":17,"section_type":"mistakes","title":"Erreurs fréquentes à éviter","subtitle":"Ce qui affaiblit l’entretien","body":"Les erreurs les plus fréquentes viennent d’un projet mal compris, de réponses trop générales ou d’un manque de connaissance des formations choisies.","items":["Réciter un texte appris par cœur.","Dire que la France est seulement un pays de rêve.","Ne pas connaître les formations choisies.","Avoir un projet professionnel flou.","Donner des réponses contradictoires avec le dossier.","Parler trop longtemps sans répondre à la question.","Inventer des informations sur le financement.","Traiter l’entretien comme une simple formalité." ]},
            {"id":"res-004-final-checklist","screen_number":18,"section_type":"checklist","title":"Checklist finale avant entretien","subtitle":"À valider avant le rendez-vous","body":"Avant ton entretien, vérifie ces points. S’il manque plusieurs réponses, il faut reprendre ton projet avant le rendez-vous.","items":["Je peux présenter mon parcours en une minute.","Je peux expliquer mon projet d’études clairement.","Je connais les formations que j’ai choisies.","Je peux justifier le choix de la France.","Je peux expliquer mon projet professionnel.","Je maîtrise les grandes lignes de mon financement.","Je connais les documents importants de mon dossier.","J’ai fait une simulation à voix haute.","Mes réponses ne contredisent pas mon dossier." ]},
            {"id":"res-004-sources","screen_number":19,"section_type":"sources","title":"Sources officielles à vérifier","subtitle":"Les consignes peuvent varier selon le pays","body":"Les informations sur l’entretien peuvent varier selon l’espace Campus France. Vérifie toujours les pages officielles de ton pays avant le rendez-vous.","items":["Campus France Togo — L’entretien Campus France : https://www.togo.campusfrance.org/l-entretien-campus-france","Campus France Mali — L’entretien Campus France : https://www.mali.campusfrance.org/l-entretien-campus-france-un-rendez-vous-a-ne-pas-manquer","Campus France Mali — Procédure Je suis accepté : https://www.mali.campusfrance.org/la-procedure-je-suis-accepte","Campus France Maroc — Entretien de candidature : https://www.maroc.campusfrance.org/l-entretien-de-candidature-de-campus-france","Campus France Togo — Calendrier 2026-2027 : https://www.togo.campusfrance.org/calendrier-de-la-procedure-2026-2027" ]},
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


def _resource_user_has_access(resource_id: str, user_id: str, access_token: str | None = None) -> bool:
    client = _client_or_none(access_token)
    if client is None:
        return False

    try:
        entitlement = (
            client.table("user_resource_entitlements")
            .select("id,status")
            .eq("user_id", user_id)
            .eq("resource_id", resource_id)
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

    has_access = _resource_user_has_access(resource["id"], user_id, access_token)
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
