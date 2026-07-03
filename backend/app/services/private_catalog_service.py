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
        url="/espace-etudiant/ressources/exemple-projet-etudes-commente",
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
        url="/espace-etudiant/ressources/structurer-motivation",
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
        url="/espace-etudiant/ressources/guide-visa-etudiant",
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
        url="/espace-etudiant/ressources/modele-lettre-motivation",
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
        url="/espace-etudiant/ressources/checklist-documents-visa",
    ),
    PrivateResourceItem(
        id="res-010",
        title="Questions fréquentes Campus France",
        description="FAQ privée pour répondre aux blocages les plus courants de la procédure.",
        category="Campus France",
        resource_type="video",
        badge_label="FAQ interactive",
        action_label="Ouvrir",
        duration_label="35 min",
        access_level="student",
        url="/espace-etudiant/ressources/questions-frequentes-campus-france",
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
    },
    "exemple-projet-etudes-commente": {
        "id": "res-005",
        "title": "Exemple projet d'études commenté",
        "slug": "exemple-projet-etudes-commente",
        "description": "Analyser un projet d'études faible puis une version améliorée, avec commentaires phrase par phrase.",
        "category": "Projet d'études",
        "reading_minutes": 40,
        "checkout_service_slug": "resource-exemple-projet-etudes-commente",
        "sections": [
            {"id":"res-005-preview","screen_number":1,"section_type":"preview","title":"Exemple projet d'études commenté","subtitle":"Aperçu gratuit","body":"Cette ressource te montre comment passer d’un projet d’études vague à une version claire, cohérente et défendable. Tu vas voir les erreurs d’un exemple faible, puis comprendre pourquoi la version améliorée fonctionne mieux.","items":["Comparer un projet faible et un projet amélioré.","Comprendre les commentaires phrase par phrase.","Repérer les formulations trop génériques.","Adapter la méthode à ton propre parcours sans copier."],"is_preview":True},
            {"id":"res-005-paywall","screen_number":2,"section_type":"paywall","title":"Débloque l'exemple complet","subtitle":"Accès privé","body":"La suite contient l'exemple faible, la correction complète, les commentaires phrase par phrase, la méthode d'adaptation, les erreurs à éviter et la checklist finale. Aucun fichier partageable, aucun téléchargement : tout reste dans ton espace privé.","items":["Exemple faible expliqué sans détour.","Version améliorée structurée.","Commentaires phrase par phrase.","Checklist pour adapter sans copier."],"is_locked":True},
            {"id":"res-005-purpose","screen_number":3,"section_type":"chapter","title":"Pourquoi travailler sur un exemple","subtitle":"Voir concrètement ce qui change","body":"Un modèle seul peut pousser au copier-coller. Un exemple commenté sert plutôt à comprendre la logique : pourquoi une phrase est faible, pourquoi une autre est plus crédible, et comment relier parcours, formation et projet professionnel.","items":["Tu apprends la logique, pas une formule magique.","Tu vois les différences entre vague et précis.","Tu comprends comment personnaliser ton texte.","Tu prépares aussi les réponses d’entretien." ]},
            {"id":"res-005-official-expectation","screen_number":4,"section_type":"chapter","title":"Ce que ton projet doit démontrer","subtitle":"Cohérence écrite et orale","body":"Campus France Mali explique qu’un projet d’études est prêt lorsque le candidat est capable d’en parler librement et de le présenter à l’écrit ou à l’oral. Campus France Togo rappelle que l’entretien permet d’exposer le projet d’études, le parcours et les motivations. Ton texte doit donc être défendable, pas seulement joli.","items":["Le projet doit être compréhensible à l’écrit.","Tu dois pouvoir l’expliquer naturellement à l’oral.","Les formations choisies doivent être cohérentes avec le projet.","Les motivations doivent rester personnelles et crédibles." ]},
            {"id":"res-005-weak-example","screen_number":5,"section_type":"example","title":"Exemple faible","subtitle":"Ce qu’il ne faut pas reproduire","body":"Je veux étudier en France parce que la France est un grand pays avec de bonnes universités. J’aime beaucoup le commerce et je veux faire une grande carrière internationale. Cette formation va m’aider à réussir dans la vie et à avoir un bon avenir. Je suis très motivé et je ferai tout pour réussir mes études.","items":["Le texte pourrait être envoyé par n’importe quel candidat.","Aucune formation précise n’est réellement justifiée.","Le parcours du candidat n’apparaît presque pas.","Le projet professionnel reste vague.","La motivation est déclarée, mais pas prouvée." ]},
            {"id":"res-005-weak-commentary","screen_number":6,"section_type":"mistakes","title":"Pourquoi cet exemple est faible","subtitle":"Les erreurs ligne par ligne","body":"Ce texte n’est pas catastrophique parce qu’il est court. Il est faible parce qu’il ne prouve rien. Il affirme une motivation, mais il ne montre pas la cohérence du parcours, ni la connaissance de la formation, ni un objectif professionnel précis.","items":["“La France est un grand pays” : phrase trop générale.","“Bonnes universités” : aucune formation ou programme cité.","“J’aime le commerce” : intérêt non expliqué.","“Grande carrière internationale” : objectif trop vague.","“Réussir dans la vie” : formule faible et non académique.","“Très motivé” : motivation déclarée, pas démontrée." ]},
            {"id":"res-005-strong-example","screen_number":7,"section_type":"example","title":"Version améliorée","subtitle":"Un exemple plus défendable","body":"Actuellement en deuxième année de licence en gestion, j’ai progressivement orienté mon parcours vers le marketing et l’analyse commerciale à travers mes cours de comportement du consommateur, de statistiques appliquées et de stratégie d’entreprise. Je souhaite poursuivre en licence ou bachelor spécialisé en marketing afin de renforcer mes compétences en étude de marché, communication digitale et gestion de projet commercial. Ce choix est cohérent avec mon objectif professionnel : évoluer à moyen terme dans le développement commercial d’une entreprise ou d’un cabinet de conseil, en particulier sur des projets liés à l’analyse des besoins clients et à la stratégie de marque.","items":["Le niveau actuel est clair.","Le domaine visé est précis.","Les matières appuient le choix.","La formation recherchée est liée à des compétences concrètes.","Le projet professionnel est crédible et relié au parcours." ]},
            {"id":"res-005-strong-commentary","screen_number":8,"section_type":"chapter","title":"Pourquoi cette version fonctionne mieux","subtitle":"Elle prouve au lieu d’affirmer","body":"La version améliorée ne se contente pas de dire que le candidat est motivé. Elle montre une continuité entre le parcours, les matières étudiées, les compétences recherchées et le projet professionnel. Le lecteur comprend la logique du candidat.","items":["Le candidat situe son niveau dès le départ.","Il nomme des matières concrètes.","Il explique les compétences qu’il veut renforcer.","Il relie la formation au projet professionnel.","Il reste crédible sans promettre des choses irréalistes." ]},
            {"id":"res-005-comment-intro","screen_number":9,"section_type":"chapter","title":"Commentaire — l’introduction","subtitle":"Situer sans raconter toute sa vie","body":"Une bonne introduction doit répondre vite à trois questions : qui es-tu académiquement, vers quel domaine vas-tu, et pourquoi cette direction commence à être logique dans ton parcours. Elle ne doit pas devenir une biographie complète.","items":["Commence par ton niveau actuel.","Mentionne ton domaine principal.","Ajoute un élément concret de ton parcours.","Annonce la direction de ton projet." ]},
            {"id":"res-005-comment-field","screen_number":10,"section_type":"chapter","title":"Commentaire — le choix du domaine","subtitle":"Justifier avec des preuves","body":"Le domaine choisi doit être justifié par des éléments concrets : matières, projets, stage, expérience personnelle ou objectif professionnel. Si tu écris seulement “j’aime ce domaine”, le lecteur ne voit pas pourquoi il doit te croire.","items":["Cite une matière ou un projet lié au domaine.","Explique ce que cette expérience t’a fait comprendre.","Montre le lien avec la suite des études.","Reste précis et personnel." ]},
            {"id":"res-005-comment-training","screen_number":11,"section_type":"chapter","title":"Commentaire — la formation visée","subtitle":"Nommer les compétences recherchées","body":"Un bon projet ne dit pas seulement “je veux intégrer cette formation”. Il explique ce que la formation apporte : compétences, spécialisation, méthode, stage, projet, débouchés ou progression académique.","items":["Identifie les compétences clés de la formation.","Relie ces compétences à ton parcours.","Explique pourquoi tu en as besoin maintenant.","Évite de choisir seulement une réputation ou une ville." ]},
            {"id":"res-005-comment-career","screen_number":12,"section_type":"chapter","title":"Commentaire — le projet professionnel","subtitle":"Un objectif assez précis pour être crédible","body":"Le projet professionnel ne doit pas être un rêve vague. Il peut rester ouvert, mais il doit indiquer un secteur, une mission, une fonction ou une direction réaliste. Le plus important est le lien entre formation et objectif.","items":["Indique un secteur ou une mission.","Explique pourquoi la formation prépare cet objectif.","Reste crédible par rapport à ton niveau actuel.","Évite les phrases comme “réussir ma vie”." ]},
            {"id":"res-005-before-after","screen_number":13,"section_type":"timeline","title":"Transformations utiles","subtitle":"Faible → solide","body":"Voici les réflexes à adopter quand tu corriges ton propre texte. Chaque phrase vague doit être remplacée par une phrase qui apporte une information vérifiable ou personnelle.","items":["Faible : j’aime la gestion → Solide : mes cours de gestion m’ont permis de découvrir…","Faible : la France a de bonnes écoles → Solide : le programme visé propose des enseignements en…","Faible : je suis motivé → Solide : mon parcours montre cet intérêt à travers…","Faible : je veux un bon avenir → Solide : je vise à moyen terme…","Faible : cette formation est parfaite → Solide : cette formation correspond à mon besoin de renforcer…" ]},
            {"id":"res-005-adaptation","screen_number":14,"section_type":"chapter","title":"Adapter sans copier","subtitle":"Le modèle doit disparaître derrière ton parcours","body":"Tu peux t’inspirer de la structure, mais pas copier le contenu. Le bon texte final doit sembler impossible à envoyer par un autre candidat, parce qu’il contient ton niveau, tes expériences, tes choix et ton objectif.","items":["Remplace le domaine par ton vrai domaine.","Remplace les matières par tes vraies matières.","Remplace l’objectif par ton vrai objectif.","Ajoute des éléments du programme réel.","Supprime toute phrase qui ne parle pas de toi." ]},
            {"id":"res-005-version-template","screen_number":15,"section_type":"chapter","title":"Structure à utiliser après l’exemple","subtitle":"Une trame claire","body":"Actuellement en [niveau] dans le domaine de [domaine], j’ai développé un intérêt pour [sujet précis] à travers [matières/projets/expériences]. Je souhaite poursuivre en [formation visée] afin de renforcer mes compétences en [compétences]. Ce choix est cohérent avec mon objectif de [objectif professionnel], car [lien entre formation et objectif].", "items":["Garde la structure, change tout le contenu personnel.","Ajoute une phrase sur la France si elle renforce ton projet.","Ajoute une phrase adaptée à chaque formation.","Relis à voix haute pour vérifier que tu peux défendre le texte." ]},
            {"id":"res-005-interview-check","screen_number":16,"section_type":"checklist","title":"Test entretien","subtitle":"Ton exemple doit tenir à l’oral","body":"Après avoir écrit ton projet, teste-le comme si tu étais déjà à l’entretien. Si tu ne peux pas répondre naturellement aux questions, ton texte doit être retravaillé.","items":["Pourquoi ce domaine ?","Pourquoi cette formation ?","Pourquoi maintenant ?","Quel lien avec ton parcours ?","Quel objectif professionnel ?","Pourquoi la France ?","Quelles compétences veux-tu acquérir ?","Pourquoi ces établissements ?" ]},
            {"id":"res-005-mistakes","screen_number":17,"section_type":"mistakes","title":"Erreurs à éviter","subtitle":"Ce qui transforme un exemple en mauvais copier-coller","body":"Le danger d’un exemple commenté est de croire qu’il faut reprendre les phrases. Non. Il faut reprendre la logique. Un texte copié est souvent incohérent à l’entretien, parce que le candidat ne sait pas le défendre.","items":["Copier la version améliorée sans personnaliser.","Garder un domaine qui n’est pas le tien.","Citer des matières que tu n’as jamais étudiées.","Inventer un projet professionnel pour paraître sérieux.","Utiliser exactement la même motivation pour toutes les formations.","Écrire un texte impossible à expliquer à l’oral." ]},
            {"id":"res-005-final-checklist","screen_number":18,"section_type":"checklist","title":"Checklist finale","subtitle":"Avant d’utiliser ton projet","body":"Utilise cette checklist avant de réutiliser ton projet dans le dossier, les motivations ou la préparation entretien.","items":["Mon niveau actuel est clairement présenté.","Mon domaine est justifié par mon parcours.","Je cite au moins un élément concret de mon expérience.","La formation visée est reliée à des compétences précises.","Mon projet professionnel est crédible.","Aucune phrase ne semble générique.","Je peux défendre chaque phrase à l’oral.","Chaque formation reçoit une adaptation spécifique." ]},
            {"id":"res-005-sources","screen_number":19,"section_type":"sources","title":"Sources et repères officiels","subtitle":"À vérifier régulièrement","body":"Cette ressource propose une méthode d’écriture et de commentaire. Les attentes officielles, calendriers et consignes doivent toujours être vérifiés sur les pages Campus France de référence.","items":["Campus France Mali — Préparer son projet d'études : https://www.mali.campusfrance.org/preparer-son-projet-d-etudes","Campus France Togo — L'entretien Campus France : https://www.togo.campusfrance.org/l-entretien-campus-france","Campus France Maroc — Entretien de candidature : https://www.maroc.campusfrance.org/l-entretien-de-candidature-de-campus-france","Campus France Togo — Guide Études en France : https://www.togo.campusfrance.org/le-guide-d-utilisation-de-la-plateforme-etudes-en-france","Campus France — Procédure Études en France : https://www.campusfrance.org/fr/candidature-procedure-etudes-en-france" ]},
        ],
    },
    "structurer-motivation": {
        "id": "res-006",
        "title": "Exercice : Structurer votre motivation",
        "slug": "structurer-motivation",
        "description": "Transformer une motivation vague en arguments clairs, personnels et défendables pour le dossier et l'entretien.",
        "category": "Motivation",
        "reading_minutes": 35,
        "checkout_service_slug": "resource-structurer-motivation",
        "sections": [
            {"id":"res-006-preview","screen_number":1,"section_type":"preview","title":"Structurer votre motivation","subtitle":"Aperçu gratuit","body":"Cette ressource est un exercice guidé. Elle t’aide à transformer des idées vagues en arguments clairs : pourquoi ce domaine, pourquoi cette formation, pourquoi la France, pourquoi ce projet professionnel et pourquoi ton parcours rend ce choix crédible.","items":["Clarifier tes vraies raisons.","Passer d’une motivation vague à une motivation structurée.","Préparer les arguments pour les lettres et l’entretien.","Éviter les phrases génériques qui affaiblissent le dossier."],"is_preview":True},
            {"id":"res-006-paywall","screen_number":2,"section_type":"paywall","title":"Débloque l’exercice complet","subtitle":"Accès privé","body":"La suite contient l’exercice complet : questions d’introspection, tri des arguments, lien parcours-formation, projet professionnel, choix de la France, formulation, test entretien, erreurs fréquentes et checklist finale. Aucun fichier partageable, aucun téléchargement : tout reste dans ton espace privé.","items":["Exercice guidé étape par étape.","Transformation motivation vague → argument solide.","Questions à réutiliser pour les lettres et l’entretien.","Contenu protégé par ton compte et filigrane."],"is_locked":True},
            {"id":"res-006-purpose","screen_number":3,"section_type":"chapter","title":"Pourquoi structurer la motivation","subtitle":"La motivation ne doit pas seulement être déclarée","body":"Dire “je suis motivé” ne suffit pas. Une motivation forte prouve une logique : ton parcours t’a mené vers un domaine, ce domaine mène vers une formation, cette formation mène vers un objectif professionnel, et ton choix de pays renforce ce projet.","items":["La motivation doit être personnelle.","Elle doit être cohérente avec ton parcours.","Elle doit expliquer le choix de formation.","Elle doit être défendable à l’entretien." ]},
            {"id":"res-006-official-context","screen_number":4,"section_type":"chapter","title":"Ce que l’entretien vérifie","subtitle":"Ton discours doit tenir à l’oral","body":"Campus France Togo présente l’entretien comme le moment où le candidat expose son projet d’études, son parcours et ses motivations. Campus France Mali rappelle qu’un projet doit pouvoir être présenté à l’écrit ou à l’oral. Ta motivation doit donc être claire, pas seulement bien écrite.","items":["Tu dois pouvoir expliquer tes choix naturellement.","Ton dossier et ton discours doivent raconter la même histoire.","Les motivations trop générales sont fragiles.","L’exercice prépare à la fois le dossier et l’entretien." ]},
            {"id":"res-006-map","screen_number":5,"section_type":"timeline","title":"La méthode en 6 blocs","subtitle":"Construire la motivation comme une chaîne logique","body":"Une motivation solide se construit en blocs. Chaque bloc répond à une question simple. Si un bloc manque, le discours devient incomplet.","items":["1. Mon parcours : d’où je viens.","2. Mon déclic : ce qui m’a orienté.","3. Mon domaine : ce que je veux approfondir.","4. Ma formation : pourquoi ce programme.","5. Mon projet : où je veux aller.","6. Ma cohérence : pourquoi tout cela forme un ensemble." ]},
            {"id":"res-006-profile","screen_number":6,"section_type":"exercise","title":"Exercice 1 — Clarifier ton parcours","subtitle":"Identifier les preuves dans ton histoire","body":"Réponds mentalement ou dans ton brouillon personnel. Ne cherche pas encore une belle phrase. Cherche d’abord les faits qui prouvent ton intérêt.","items":["Quelles matières t’ont le plus marqué ?","Quels projets, stages ou expériences appuient ton choix ?","Quelles compétences as-tu déjà commencé à développer ?","Quel problème ou sujet t’intéresse vraiment ?","Quel élément de ton parcours donne du poids à ce choix ?" ]},
            {"id":"res-006-trigger","screen_number":7,"section_type":"exercise","title":"Exercice 2 — Trouver le déclic","subtitle":"Pourquoi ce domaine maintenant ?","body":"Le déclic peut être une matière, une expérience, un stage, une difficulté observée, un objectif professionnel ou une évolution progressive. Il doit expliquer pourquoi ton choix n’est pas tombé au hasard.","items":["J’ai commencé à m’intéresser à ce domaine quand…","Cet intérêt s’est renforcé grâce à…","J’ai compris que je voulais approfondir…","Ce choix est cohérent avec mon parcours parce que…" ]},
            {"id":"res-006-field","screen_number":8,"section_type":"exercise","title":"Exercice 3 — Justifier le domaine","subtitle":"Passer de “j’aime” à “je comprends pourquoi”","body":"Une justification forte explique ce que le domaine permet de faire : analyser, créer, accompagner, gérer, soigner, enseigner, développer, protéger, organiser ou résoudre un problème.","items":["Ce domaine me permet de travailler sur…","Il correspond à mes compétences en…","Il répond à mon intérêt pour…","Il est utile pour mon objectif de…","Il prolonge mon parcours car…" ]},
            {"id":"res-006-training","screen_number":9,"section_type":"exercise","title":"Exercice 4 — Relier la formation","subtitle":"La formation doit répondre à un besoin précis","body":"Tu dois pouvoir dire pourquoi cette formation vient maintenant dans ton parcours. Elle doit apporter des compétences que tu n’as pas encore ou que tu veux renforcer.","items":["Cette formation m’intéresse parce qu’elle propose…","Elle me permettra de renforcer…","Elle complète mon parcours actuel par…","Elle correspond à mon objectif car…","Les enseignements importants pour moi sont…" ]},
            {"id":"res-006-france","screen_number":10,"section_type":"exercise","title":"Exercice 5 — Justifier le choix de la France","subtitle":"Éviter les phrases touristiques","body":"Le choix de la France doit renforcer ton projet académique. Évite les réponses centrées uniquement sur le rêve, la culture ou la réputation générale. Relie le choix au programme, à la pédagogie, aux compétences et à ton objectif.","items":["La France m’intéresse pour le cadre académique lié à…","Les formations visées proposent…","Ce parcours me permettra de développer…","Ce choix est cohérent avec mon projet professionnel car…" ]},
            {"id":"res-006-career","screen_number":11,"section_type":"exercise","title":"Exercice 6 — Clarifier le projet professionnel","subtitle":"Une direction réaliste","body":"Ton projet professionnel n’a pas besoin d’être figé à vie. Il doit montrer une direction crédible. Choisis un secteur, un métier, une mission ou un type de contribution.","items":["À moyen terme, je souhaite évoluer vers…","Je veux travailler dans le secteur de…","Les compétences visées seront utiles pour…","Mon objectif est de contribuer à…","Cette formation est une étape nécessaire parce que…" ]},
            {"id":"res-006-sort","screen_number":12,"section_type":"checklist","title":"Trier les bons arguments","subtitle":"Tout n’a pas la même valeur","body":"Après les exercices, garde seulement les arguments utiles. Un bon argument est personnel, précis, cohérent et défendable. Un mauvais argument est vague, copié ou impossible à expliquer.","items":["Je garde les faits réels de mon parcours.","Je garde les compétences précises que je veux développer.","Je garde les éléments liés aux formations choisies.","Je retire les phrases générales sur la France.","Je retire les arguments que je ne peux pas défendre à l’oral." ]},
            {"id":"res-006-vague-to-solid","screen_number":13,"section_type":"timeline","title":"Transformer une motivation vague","subtitle":"Avant → après","body":"Le travail consiste à remplacer les déclarations générales par des liens précis entre parcours, formation et projet.","items":["Vague : je suis très motivé → Solide : mon intérêt s’est construit à travers…","Vague : j’aime cette filière → Solide : ce domaine me permet de développer…","Vague : la France est un bon pays → Solide : les formations visées proposent…","Vague : je veux réussir → Solide : je souhaite évoluer vers…","Vague : cette école est parfaite → Solide : ce programme correspond à mon besoin de…" ]},
            {"id":"res-006-formula","screen_number":14,"section_type":"chapter","title":"Formule de motivation structurée","subtitle":"Une phrase utile à adapter","body":"Mon intérêt pour [domaine] s’est construit à travers [élément du parcours]. Je souhaite poursuivre en [formation] afin de renforcer mes compétences en [compétences précises]. Ce choix est cohérent avec mon objectif de [projet professionnel], car [lien concret entre formation et objectif].", "items":["Remplace chaque crochet par une information réelle.","Ajoute un élément précis du programme visé.","Ne garde aucune phrase qui ne parle pas de toi.","Teste ensuite la phrase à voix haute." ]},
            {"id":"res-006-letter-use","screen_number":15,"section_type":"chapter","title":"Utiliser l’exercice dans une lettre","subtitle":"Ne pas tout mettre, choisir les meilleurs arguments","body":"Une lettre ou une motivation courte ne peut pas contenir tout ton parcours. Utilise l’exercice pour choisir les deux ou trois arguments les plus forts : parcours, formation, projet professionnel et choix de la France.","items":["Argument 1 : lien avec le parcours.","Argument 2 : lien avec la formation.","Argument 3 : lien avec le projet professionnel.","Option : choix de la France si cela renforce la logique.","Évite de multiplier les idées sans hiérarchie." ]},
            {"id":"res-006-interview-use","screen_number":16,"section_type":"checklist","title":"Utiliser l’exercice à l’entretien","subtitle":"Préparer les réponses sans réciter","body":"Les réponses d’entretien doivent rester naturelles. Utilise les arguments comme repères, pas comme texte à apprendre mot pour mot.","items":["Je peux expliquer mon domaine en une phrase.","Je peux citer un élément réel de mon parcours.","Je peux expliquer pourquoi cette formation.","Je peux expliquer mon projet professionnel.","Je peux justifier le choix de la France.","Je peux répondre sans lire ni réciter." ]},
            {"id":"res-006-mistakes","screen_number":17,"section_type":"mistakes","title":"Erreurs fréquentes","subtitle":"Ce qui affaiblit la motivation","body":"Une motivation faible donne l’impression que le candidat a rempli une formalité. Une motivation forte donne l’impression que le projet existe réellement avant le formulaire.","items":["Copier une phrase trouvée en ligne.","Dire seulement que tu es motivé.","Parler de la France sans parler de la formation.","Avoir un projet professionnel sans lien avec le programme.","Inventer des expériences ou compétences.","Écrire un texte que tu ne peux pas défendre à l’entretien.","Utiliser la même motivation pour toutes les formations." ]},
            {"id":"res-006-final-checklist","screen_number":18,"section_type":"checklist","title":"Checklist finale","subtitle":"Avant d’utiliser tes motivations","body":"Valide ces points avant d’utiliser tes motivations dans une lettre, un projet d’études ou une préparation entretien.","items":["Mes motivations viennent de mon parcours réel.","Je sais expliquer mon déclic.","Je justifie le domaine choisi.","Je relie la formation à des compétences précises.","Je relie la France à mon projet académique.","Mon projet professionnel est crédible.","Je peux défendre mes arguments à l’oral.","Aucune phrase ne ressemble à un copier-coller." ]},
            {"id":"res-006-sources","screen_number":19,"section_type":"sources","title":"Sources et repères officiels","subtitle":"À vérifier régulièrement","body":"Cette ressource structure la motivation. Les consignes officielles, les calendriers et les attentes locales doivent toujours être vérifiés sur les pages Campus France de référence.","items":["Campus France Mali — Préparer son projet d'études : https://www.mali.campusfrance.org/preparer-son-projet-d-etudes","Campus France Togo — L'entretien Campus France : https://www.togo.campusfrance.org/l-entretien-campus-france","Campus France Maroc — Entretien de candidature : https://www.maroc.campusfrance.org/l-entretien-de-candidature-de-campus-france","Campus France Togo — Guide Études en France : https://www.togo.campusfrance.org/le-guide-d-utilisation-de-la-plateforme-etudes-en-france","Campus France — Procédure Études en France : https://www.campusfrance.org/fr/candidature-procedure-etudes-en-france" ]},
        ],
    },
    "guide-visa-etudiant": {
        "id": "res-007",
        "title": "Guide visa étudiant",
        "slug": "guide-visa-etudiant",
        "description": "Préparer la demande de visa étudiant France avec méthode : France-Visas, justificatifs, financement, hébergement et rendez-vous.",
        "category": "Visa",
        "reading_minutes": 45,
        "checkout_service_slug": "resource-guide-visa-etudiant",
        "sections": [
            {"id":"res-007-preview","screen_number":1,"section_type":"preview","title":"Guide visa étudiant","subtitle":"Aperçu gratuit","body":"Cette ressource t’aide à préparer la phase visa étudiant après l’admission ou l’avancement Campus France. Elle ne remplace pas France-Visas : elle t’aide à organiser la démarche, comprendre les pièces, éviter les erreurs et vérifier les sources officielles avant le rendez-vous.","items":["Comprendre le rôle de France-Visas.","Préparer les familles de documents.","Vérifier financement, hébergement et assurance.","Éviter les erreurs qui fragilisent la demande."],"is_preview":True},
            {"id":"res-007-paywall","screen_number":2,"section_type":"paywall","title":"Débloque le guide complet visa","subtitle":"Accès privé","body":"La suite contient le parcours complet : type de visa, compte France-Visas, formulaire, documents, financement, hébergement, assurance, rendez-vous, biométrie, suivi, arrivée en France et checklist finale. Aucun fichier partageable, aucun téléchargement : tout reste dans ton espace privé.","items":["Guide visa en format tunnel.","Checklist avant rendez-vous.","Points de vigilance par famille de documents.","Contenu protégé par ton compte et filigrane."],"is_locked":True},
            {"id":"res-007-role","screen_number":3,"section_type":"chapter","title":"Comprendre la phase visa","subtitle":"Campus France n’est pas la décision visa","body":"La phase visa est distincte de l’admission. Campus France Togo rappelle que le service consulaire consulte le dossier électronique, examine le dossier consulaire et décide de l’attribution du visa pour études. Tu dois donc préparer le visa comme un dossier à part entière.","items":["Admission ou accord pédagogique ne garantit pas le visa.","Le consulat examine les justificatifs et la cohérence globale.","France-Visas reste la référence pour la demande.","Les consignes peuvent varier selon le pays de résidence." ]},
            {"id":"res-007-visa-type","screen_number":4,"section_type":"chapter","title":"Identifier le bon visa","subtitle":"Court séjour ou long séjour","body":"Campus France explique que le visa étudiant long séjour concerne les études, recherches ou stages en France d’une durée supérieure à trois mois pour les candidats non exemptés. France-Visas indique que tout séjour de plus de 90 jours nécessite une demande de visa long séjour lorsque la nationalité ne dispense pas de cette obligation.","items":["Séjour court : situation particulière, concours ou séjour limité.","Séjour long : études supérieures de plus de trois mois.","VLS-TS étudiant : visa long séjour valant titre de séjour selon situation.","Vérifie toujours avec l’assistant visa France-Visas." ]},
            {"id":"res-007-france-visas","screen_number":5,"section_type":"timeline","title":"Le parcours France-Visas","subtitle":"La demande se prépare en ligne puis au rendez-vous","body":"France-Visas centralise les informations visa. Service-Public rappelle que les documents à présenter varient selon le motif du séjour et qu’il faut consulter France-Visas pour connaître la liste applicable à sa situation.","items":["1. Vérifier le besoin de visa avec l’assistant France-Visas.","2. Identifier le type de visa demandé.","3. Préparer les justificatifs selon la liste générée.","4. Remplir la demande en ligne.","5. Prendre rendez-vous selon le pays de dépôt.","6. Déposer le dossier et suivre la demande." ]},
            {"id":"res-007-calendar","screen_number":6,"section_type":"chapter","title":"Anticiper le calendrier","subtitle":"La phase visa ne se prépare pas à la dernière minute","body":"Le visa doit être préparé dès que ton projet devient concret. Certains justificatifs prennent du temps : passeport, admission, attestation Campus France, logement, ressources financières, assurance, rendez-vous et documents originaux. Plus tu attends, plus tu subis les délais.","items":["Vérifie la validité du passeport tôt.","Prépare les justificatifs financiers avant le rendez-vous.","Anticipe le logement ou la preuve d’hébergement.","Surveille les créneaux de rendez-vous.","Garde des copies propres de chaque document." ]},
            {"id":"res-007-passport","screen_number":7,"section_type":"checklist","title":"Bloc 1 — Passeport et identité","subtitle":"La base administrative doit être propre","body":"Avant de préparer les autres pièces, vérifie l’identité. Une erreur de nom, date, numéro de passeport ou validité peut bloquer ou retarder la demande.","items":["Passeport en bon état et valide selon les exigences applicables.","Nom et prénoms identiques aux documents académiques.","Date et lieu de naissance cohérents.","Copies lisibles des pages demandées.","Adresse email et téléphone fiables.","Photo d’identité conforme si demandée par la procédure locale." ]},
            {"id":"res-007-admission","screen_number":8,"section_type":"checklist","title":"Bloc 2 — Admission et statut étudiant","subtitle":"Prouver pourquoi tu pars","body":"France-Visas indique que les justificatifs sont précisés par l’assistant visa et qu’il faut notamment inclure le certificat d’inscription dans l’établissement d’enseignement supérieur qui t’a accepté. La preuve d’admission ou d’inscription est donc centrale.","items":["Lettre d’admission, préinscription ou certificat selon situation.","Attestation ou élément Campus France si applicable dans ton pays.","Identité de l’établissement et formation clairement visibles.","Dates et niveau de formation cohérents.","Même formation que celle expliquée dans ton projet et ton dossier." ]},
            {"id":"res-007-resources","screen_number":9,"section_type":"checklist","title":"Bloc 3 — Ressources financières","subtitle":"Prouver que le séjour est soutenable","body":"Les justificatifs financiers sont une partie sensible du dossier visa. Les exigences exactes dépendent de ta situation et du pays de dépôt. Le principe reste clair : le consulat doit comprendre qui finance, comment, et avec quels justificatifs sérieux.","items":["Source de financement clairement identifiable.","Relevés, attestations ou garanties selon la liste France-Visas.","Prise en charge si une personne finance le séjour.","Cohérence entre ressources, durée du séjour et coût de vie.","Évite les mouvements bancaires artificiels ou incompréhensibles.","Prépare une explication simple si la situation financière est complexe." ]},
            {"id":"res-007-housing","screen_number":10,"section_type":"checklist","title":"Bloc 4 — Hébergement","subtitle":"Montrer où tu comptes vivre","body":"L’hébergement est souvent demandé sous une forme adaptée à ta situation : réservation, attestation d’accueil, bail, logement universitaire, lettre explicative ou autre justificatif selon le pays et la liste France-Visas. Ce point doit être cohérent avec la ville de formation.","items":["Justificatif d’hébergement selon la liste demandée.","Ville cohérente avec l’établissement.","Nom et coordonnées de l’hébergeant si applicable.","Durée ou période couverte clairement indiquée.","Explication crédible si le logement définitif n’est pas encore signé." ]},
            {"id":"res-007-insurance","screen_number":11,"section_type":"chapter","title":"Bloc 5 — Assurance et santé","subtitle":"Vérifier selon ton cas","body":"Les exigences d’assurance varient selon le visa, la durée et le pays de dépôt. Ne suppose pas. Vérifie la liste générée par France-Visas et les consignes du centre de dépôt. Prépare aussi les informations utiles pour l’arrivée en France.","items":["Vérifie si une assurance est demandée avant le départ.","Vérifie la durée de couverture exigée si elle existe.","Garde les attestations lisibles et nominatives.","Ne confonds pas assurance voyage, santé et démarches d’arrivée." ]},
            {"id":"res-007-form","screen_number":12,"section_type":"chapter","title":"Remplir la demande en ligne","subtitle":"Cohérence avec tout le dossier","body":"Le formulaire visa doit être rempli avec attention. Les informations doivent correspondre à ton passeport, ton admission, ton hébergement, ton financement et ton projet. Une incohérence peut créer un doute inutile.","items":["Vérifie chaque donnée avant validation.","Utilise les mêmes noms que sur le passeport.","Renseigne la formation et l’établissement correctement.","Vérifie les dates prévues de séjour.","Conserve le récépissé ou formulaire généré selon la procédure." ]},
            {"id":"res-007-appointment","screen_number":13,"section_type":"timeline","title":"Rendez-vous visa","subtitle":"Venir avec un dossier maîtrisé","body":"Le rendez-vous sert à déposer le dossier, effectuer les formalités nécessaires et présenter les justificatifs demandés. Selon le pays, les modalités peuvent varier. Tu dois venir avec les documents demandés, les originaux si exigés, et une compréhension claire de ton projet.","items":["Relire la liste France-Visas avant le rendez-vous.","Préparer les originaux et copies demandés.","Classer les documents dans un ordre logique.","Arriver avec une marge suffisante.","Savoir expliquer le projet, le financement et l’hébergement." ]},
            {"id":"res-007-after-submit","screen_number":14,"section_type":"chapter","title":"Après le dépôt","subtitle":"Suivre sans paniquer","body":"Après le dépôt, suis les instructions du centre de dépôt ou du consulat. Évite les démarches non officielles et surveille les messages. Si un complément est demandé, réponds vite et proprement.","items":["Garde le récépissé de dépôt.","Surveille les notifications officielles.","Ne multiplie pas les demandes contradictoires.","Prépare-toi à fournir un complément si demandé.","Ne prends pas de décisions coûteuses sans vérifier l’état réel du dossier." ]},
            {"id":"res-007-arrival","screen_number":15,"section_type":"chapter","title":"Arrivée en France","subtitle":"Le visa peut nécessiter des démarches après l’entrée","body":"France-Visas indique qu’un VLS-TS doit être validé dans les trois mois suivant l’arrivée en France. Campus France rappelle aussi que le VLS-TS étudiant permet de séjourner en France un an sans demander immédiatement un titre de séjour, mais qu’il doit être validé à l’arrivée.","items":["Vérifie si ton visa doit être validé en ligne après arrivée.","Respecte le délai indiqué.","Garde passeport, visa, adresse en France et justificatifs utiles.","Prépare les démarches de logement, assurance, banque et inscription.","Ne confonds pas obtention du visa et fin des démarches administratives." ]},
            {"id":"res-007-mistakes","screen_number":16,"section_type":"mistakes","title":"Erreurs fréquentes","subtitle":"Ce qui fragilise le dossier visa","body":"Les erreurs visa sont souvent liées à l’urgence, à l’incohérence ou à l’improvisation. Cette liste doit être relue avant de soumettre et avant le rendez-vous.","items":["Préparer le visa seulement après avoir tout laissé traîner.","Ne pas vérifier la liste France-Visas personnalisée.","Présenter un financement peu clair.","Avoir un hébergement incohérent avec la ville d’études.","Déposer des documents illisibles ou contradictoires.","Confondre admission, Campus France et décision visa.","Ne pas savoir expliquer son projet au rendez-vous.","Oublier la validation du VLS-TS après arrivée si elle s’applique." ]},
            {"id":"res-007-final-checklist","screen_number":17,"section_type":"checklist","title":"Checklist finale visa étudiant","subtitle":"À valider avant rendez-vous","body":"Cette checklist ne garantit pas l’obtention du visa, mais elle réduit les risques d’un dossier incomplet, incohérent ou mal préparé.","items":["J’ai vérifié mon type de visa sur France-Visas.","Mon passeport et mon identité sont cohérents.","J’ai une preuve d’admission ou d’inscription.","J’ai préparé mes justificatifs financiers.","J’ai préparé mon justificatif d’hébergement.","J’ai vérifié l’assurance ou les exigences santé si demandées.","Mon formulaire correspond à mes documents.","Mes documents sont lisibles et classés.","Je sais expliquer mon projet, mon financement et mon logement.","Je connais les démarches à faire après arrivée si mon visa l’exige." ]},
            {"id":"res-007-sources","screen_number":18,"section_type":"sources","title":"Sources officielles à vérifier","subtitle":"La liste exacte dépend de ta situation","body":"Les règles visa changent selon la nationalité, le pays de résidence, la durée du séjour et la situation du candidat. Vérifie toujours France-Visas et les pages officielles de ton pays de dépôt.","items":["France-Visas — Étudiant : https://france-visas.gouv.fr/etudiant","France-Visas — Visa de long séjour : https://france-visas.gouv.fr/visa-de-long-sejour","France-Visas — Votre arrivée en France : https://france-visas.gouv.fr/votre-arrivee-en-france","Campus France — Visas et cartes de séjour : https://www.campusfrance.org/fr/visas-et-cartes-de-sejour","Campus France — VLS-TS étudiant : https://www.campusfrance.org/fr/visa-long-sejour-etudiant","Campus France Togo — Procédures et inscriptions : https://www.togo.campusfrance.org/les-procedures-et-inscriptions","Service-Public — Visa de long séjour : https://www.service-public.gouv.fr/particuliers/vosdroits/F16162" ]},
        ],
    },
    "modele-lettre-motivation": {
        "id": "res-008",
        "title": "Modèle lettre de motivation",
        "slug": "modele-lettre-motivation",
        "description": "Rédiger une lettre de motivation claire, personnalisée et cohérente avec le projet d'études.",
        "category": "Lettres",
        "reading_minutes": 40,
        "checkout_service_slug": "resource-modele-lettre-motivation",
        "sections": [
            {"id":"res-008-preview","screen_number":1,"section_type":"preview","title":"Modèle lettre de motivation","subtitle":"Aperçu gratuit","body":"Cette ressource t’aide à rédiger une lettre de motivation qui ne ressemble pas à un copier-coller. Elle te montre comment relier ton parcours, la formation visée, ton projet d’études, ton projet professionnel et tes arguments personnels.","items":["Comprendre le rôle d’une lettre de motivation.","Structurer la lettre sans écrire une page confuse.","Adapter la lettre à chaque formation.","Éviter les phrases génériques qui affaiblissent le dossier."],"is_preview":True},
            {"id":"res-008-paywall","screen_number":2,"section_type":"paywall","title":"Débloque le modèle complet","subtitle":"Accès privé","body":"La suite contient la méthode complète : structure, introduction, parcours, choix de formation, choix de l’établissement, projet professionnel, modèle phrase par phrase, variantes, erreurs fréquentes et checklist finale. Aucun fichier partageable, aucun téléchargement : tout reste dans ton espace privé.","items":["Modèle interactif en format tunnel.","Phrases à adapter sans copier-coller.","Méthode pour personnaliser chaque lettre.","Contenu protégé par ton compte et filigrane."],"is_locked":True},
            {"id":"res-008-purpose","screen_number":3,"section_type":"chapter","title":"Le rôle de la lettre","subtitle":"Convaincre par la cohérence","body":"La lettre de motivation ne doit pas répéter tout le dossier. Elle doit expliquer pourquoi ton parcours mène vers cette formation, pourquoi ce choix est logique maintenant, et comment la formation s’inscrit dans ton projet professionnel.","items":["Elle montre une intention claire.","Elle relie parcours, formation et projet.","Elle personnalise ta candidature.","Elle prépare aussi ton discours d’entretien." ]},
            {"id":"res-008-official-context","screen_number":4,"section_type":"chapter","title":"Ce que la lettre doit respecter","subtitle":"Écrit défendable à l’oral","body":"Campus France Mali rappelle qu’un projet d’études doit pouvoir être présenté à l’écrit ou à l’oral. Campus France Togo indique que l’entretien permet d’exposer projet d’études, parcours et motivations. Ta lettre doit donc rester vraie, claire et défendable si on te pose des questions dessus.","items":["Ne promets pas ce que tu ne peux pas expliquer.","N’invente pas d’expérience.","Ne copie pas une lettre générique.","Chaque phrase importante doit pouvoir être défendue à l’oral." ]},
            {"id":"res-008-structure","screen_number":5,"section_type":"timeline","title":"Structure en 5 blocs","subtitle":"Une lettre claire, pas une accumulation","body":"Une bonne lettre suit une progression simple. Chaque bloc a un rôle. Si tu mélanges tout, le lecteur ne comprend plus ton projet.","items":["1. Accroche : situation actuelle et objectif.","2. Parcours : éléments qui justifient le domaine.","3. Formation : pourquoi ce programme précis.","4. Projet : objectif professionnel ou académique.","5. Conclusion : disponibilité, sérieux et cohérence." ]},
            {"id":"res-008-intro","screen_number":6,"section_type":"chapter","title":"Bloc 1 — Introduction","subtitle":"Entrer vite dans le sujet","body":"L’introduction doit dire qui tu es et ce que tu demandes. Évite les formules longues ou trop polies qui n’apportent rien. Le lecteur doit comprendre en quelques lignes ton niveau, ton domaine et la formation visée.","items":["Actuellement en [niveau] dans le domaine de [domaine]…","Je souhaite intégrer [formation] afin de…","Mon parcours m’a progressivement orienté vers…","Cette candidature s’inscrit dans mon projet de…" ]},
            {"id":"res-008-background","screen_number":7,"section_type":"chapter","title":"Bloc 2 — Parcours","subtitle":"Prouver l’intérêt avec des faits","body":"Le parcours sert à montrer que ton intérêt est réel. Parle de matières, projets, stages, expériences, compétences ou difficultés qui expliquent ton choix. Le but est de donner du poids à ta motivation.","items":["Mes cours de… m’ont permis de…","Un projet réalisé en… m’a amené à…","Cette expérience a renforcé mon intérêt pour…","J’ai développé des compétences en…","Je souhaite maintenant approfondir…" ]},
            {"id":"res-008-training","screen_number":8,"section_type":"chapter","title":"Bloc 3 — Formation visée","subtitle":"Montrer que tu as lu le programme","body":"La formation doit être justifiée par des éléments précis : contenus, compétences, spécialisation, pédagogie, stage, alternance ou débouchés. Une lettre faible pourrait être envoyée à n’importe quelle formation sans modification.","items":["Votre formation m’intéresse pour ses enseignements en…","Elle correspond à mon besoin de renforcer…","Le programme est cohérent avec mon objectif car…","Les compétences visées sont utiles pour…","L’approche proposée correspond à mon projet de…" ]},
            {"id":"res-008-school","screen_number":9,"section_type":"chapter","title":"Bloc 4 — Établissement","subtitle":"Éviter les compliments vides","body":"Ne dis pas seulement que l’établissement est prestigieux. Explique ce qui t’intéresse concrètement : programme, spécialité, encadrement, professionnalisation, projets, réseau, localisation utile ou lien avec ton objectif.","items":["J’ai identifié dans votre programme…","La dimension [professionnelle/recherche/projet] m’intéresse car…","Les enseignements en… sont directement liés à…","Cette formation se distingue pour moi par…" ]},
            {"id":"res-008-career","screen_number":10,"section_type":"chapter","title":"Bloc 5 — Projet professionnel","subtitle":"La lettre doit montrer une direction","body":"Ton projet professionnel peut rester évolutif, mais il doit indiquer une direction crédible. Relie la formation à un secteur, un métier, une mission ou une contribution concrète.","items":["À moyen terme, je souhaite évoluer vers…","Cette formation me permettra d’acquérir…","Ces compétences seront utiles pour…","Mon objectif est de contribuer à…","Ce projet est cohérent avec mon parcours car…" ]},
            {"id":"res-008-model","screen_number":11,"section_type":"example","title":"Modèle complet à adapter","subtitle":"Structure, pas texte à copier","body":"Actuellement en [niveau] dans le domaine de [domaine], je souhaite intégrer [nom de la formation] afin de renforcer mes compétences en [compétences précises]. Mon parcours m’a permis de développer un intérêt particulier pour [sujet], notamment à travers [matières/projets/expériences]. Votre formation m’intéresse pour [éléments précis du programme], qui correspondent à mon objectif de [projet professionnel]. Je souhaite ainsi construire un parcours cohérent me permettant de [objectif concret].", "items":["Remplace chaque crochet par une information vraie.","Ajoute des éléments propres à chaque formation.","Supprime toute phrase qui pourrait convenir à n’importe qui.","Relis à voix haute pour vérifier que tu peux défendre le texte." ]},
            {"id":"res-008-weak-vs-solid","screen_number":12,"section_type":"timeline","title":"Faible → solide","subtitle":"Corriger les phrases génériques","body":"Une lettre devient plus forte quand chaque phrase apporte une information personnelle ou vérifiable. Remplace les compliments et déclarations générales par des liens concrets.","items":["Faible : votre école est très réputée → Solide : votre programme propose des enseignements en…","Faible : je suis très motivé → Solide : mon intérêt s’est renforcé à travers…","Faible : je veux réussir ma carrière → Solide : je souhaite évoluer vers…","Faible : j’aime cette formation → Solide : cette formation correspond à mon besoin de…","Faible : la France offre de bonnes études → Solide : ce parcours en France renforce mon projet car…" ]},
            {"id":"res-008-adapt","screen_number":13,"section_type":"exercise","title":"Adapter chaque lettre","subtitle":"Une base commune, pas un envoi automatique","body":"Tu peux garder une base commune, mais chaque lettre doit être adaptée à la formation. Si toutes tes lettres sont identiques, elles deviennent faibles.","items":["Garde ton parcours principal.","Change les éléments liés au programme.","Mentionne des compétences propres à la formation.","Adapte le projet selon les débouchés.","Vérifie que chaque lettre peut être défendue à l’entretien." ]},
            {"id":"res-008-tone","screen_number":14,"section_type":"chapter","title":"Ton et style","subtitle":"Simple, professionnel, précis","body":"Une lettre efficace n’est pas forcément compliquée. Évite les phrases trop longues, les formulations dramatiques et les promesses irréalistes. Le ton doit être sérieux, clair et naturel.","items":["Privilégie des phrases courtes.","Évite les superlatifs excessifs.","Ne supplie pas l’établissement.","Ne raconte pas toute ta vie.","Utilise un vocabulaire que tu maîtrises." ]},
            {"id":"res-008-opening-closing","screen_number":15,"section_type":"chapter","title":"Ouverture et conclusion","subtitle":"Finir proprement","body":"La conclusion doit rappeler le sérieux de la candidature sans répéter toute la lettre. Elle peut exprimer la disponibilité, l’intérêt pour la formation et la cohérence du projet.","items":["Je serais honoré de pouvoir intégrer votre formation…","Je reste disponible pour tout complément d’information…","Cette formation représente une étape cohérente dans mon projet…","Je vous remercie pour l’attention portée à ma candidature…" ]},
            {"id":"res-008-interview-test","screen_number":16,"section_type":"checklist","title":"Test entretien","subtitle":"Ta lettre doit tenir face aux questions","body":"Avant d’envoyer ta lettre, vérifie que tu peux expliquer chaque phrase importante. Si une phrase sonne bien mais que tu ne peux pas la défendre, elle doit être supprimée ou réécrite.","items":["Pourquoi cette formation ?","Pourquoi cet établissement ?","Quel lien avec ton parcours ?","Quel projet professionnel ?","Quelle compétence veux-tu développer ?","Pourquoi cette lettre est différente des autres ?","Peux-tu expliquer chaque phrase sans lire ?" ]},
            {"id":"res-008-mistakes","screen_number":17,"section_type":"mistakes","title":"Erreurs fréquentes","subtitle":"Ce qui affaiblit une lettre","body":"La plupart des lettres faibles donnent l’impression d’avoir été copiées ou écrites trop vite. Une lettre doit être adaptée, cohérente et défendable.","items":["Copier une lettre trouvée en ligne.","Envoyer la même lettre partout.","Parler seulement de la réputation de l’école.","Oublier le lien avec le parcours.","Écrire un projet professionnel vague.","Multiplier les phrases longues et confuses.","Utiliser des arguments impossibles à défendre à l’oral." ]},
            {"id":"res-008-final-checklist","screen_number":18,"section_type":"checklist","title":"Checklist finale","subtitle":"Avant d’utiliser la lettre","body":"Utilise cette checklist avant d’envoyer une lettre ou de reprendre son contenu dans ton dossier.","items":["Mon niveau et mon domaine sont clairs.","Mon parcours appuie ma motivation.","La formation est justifiée avec des éléments précis.","L’établissement n’est pas complimenté de façon vide.","Mon projet professionnel est cohérent.","La lettre est adaptée à la formation.","Aucune phrase ne ressemble à un copier-coller.","Je peux défendre chaque partie à l’entretien." ]},
            {"id":"res-008-sources","screen_number":19,"section_type":"sources","title":"Sources et repères officiels","subtitle":"À vérifier régulièrement","body":"Cette ressource structure la rédaction d’une lettre. Les calendriers, consignes locales et attentes de candidature doivent toujours être vérifiés sur les pages officielles Campus France et les sites des établissements.","items":["Campus France Mali — Préparer son projet d'études : https://www.mali.campusfrance.org/preparer-son-projet-d-etudes","Campus France Togo — L'entretien Campus France : https://www.togo.campusfrance.org/l-entretien-campus-france","Campus France Maroc — Entretien de candidature : https://www.maroc.campusfrance.org/l-entretien-de-candidature-de-campus-france","Campus France Togo — Guide Études en France : https://www.togo.campusfrance.org/le-guide-d-utilisation-de-la-plateforme-etudes-en-france","Campus France — Procédure Études en France : https://www.campusfrance.org/fr/candidature-procedure-etudes-en-france" ]},
        ],
    },
    "checklist-documents-visa": {
        "id": "res-009",
        "title": "Checklist documents visa",
        "slug": "checklist-documents-visa",
        "description": "Contrôler les documents essentiels de la demande de visa étudiant avant dépôt et rendez-vous.",
        "category": "Visa",
        "reading_minutes": 40,
        "checkout_service_slug": "resource-checklist-documents-visa",
        "sections": [
            {"id":"res-009-preview","screen_number":1,"section_type":"preview","title":"Checklist documents visa","subtitle":"Aperçu gratuit","body":"Cette checklist t’aide à contrôler les documents de visa étudiant avant la demande, le rendez-vous et le dépôt. Elle ne remplace pas France-Visas : elle t’aide à vérifier les familles de pièces, la cohérence et les erreurs fréquentes.","items":["Préparer les documents par famille.","Vérifier passeport, admission, financement et hébergement.","Contrôler originaux, copies et fichiers numériques.","Éviter les pièces incohérentes ou illisibles."],"is_preview":True},
            {"id":"res-009-paywall","screen_number":2,"section_type":"paywall","title":"Débloque la checklist visa complète","subtitle":"Accès privé","body":"La suite contient le contrôle complet : France-Visas, passeport, formulaire, admission, ressources, hébergement, assurance, photos, rendez-vous, originaux, copies, cohérence et checklist finale. Aucun fichier partageable, aucun téléchargement : tout reste dans ton espace privé.","items":["Checklist visa en format tunnel.","Contrôle document par document.","Méthode de classement avant rendez-vous.","Contenu protégé par ton compte et filigrane."],"is_locked":True},
            {"id":"res-009-official-rule","screen_number":3,"section_type":"chapter","title":"Règle principale","subtitle":"La liste exacte vient de France-Visas","body":"Service-Public rappelle que les documents à présenter varient selon le motif du séjour et qu’il faut consulter France-Visas pour connaître la liste applicable à sa situation. Cette checklist est donc une méthode de contrôle, pas une liste officielle unique.","items":["Commence par l’assistant visa France-Visas.","Utilise la liste générée selon ton profil.","Vérifie les consignes du centre de dépôt de ton pays.","Ne te base pas uniquement sur une ancienne liste partagée." ]},
            {"id":"res-009-digital-copies","screen_number":4,"section_type":"chapter","title":"Copies numériques","subtitle":"Préparer les fichiers avant le rendez-vous","body":"France-Visas indique que les étudiants peuvent déposer les copies numériques de l’ensemble des pièces justificatives sollicitées dès la saisie de la demande en ligne. Les documents doivent donc être prêts, lisibles et bien nommés avant la validation.","items":["Scanne les documents en bonne qualité.","Vérifie que toutes les pages utiles sont présentes.","Nomme les fichiers de façon compréhensible.","Garde les originaux à part pour le rendez-vous.","Ne modifie jamais un document officiel." ]},
            {"id":"res-009-passport","screen_number":5,"section_type":"checklist","title":"Bloc 1 — Passeport et identité","subtitle":"La base du dossier","body":"Le passeport et l’identité doivent être cohérents avec tous les autres documents. Une différence de nom, de date ou de numéro peut créer un doute ou retarder le traitement.","items":["Passeport valide selon les exigences applicables.","Pages d’identité lisibles.","Nom et prénoms identiques aux documents scolaires.","Date et lieu de naissance cohérents.","Copies propres si demandées.","Photo d’identité conforme selon les consignes France-Visas ou centre de dépôt." ]},
            {"id":"res-009-form","screen_number":6,"section_type":"checklist","title":"Bloc 2 — Formulaire et récépissés","subtitle":"Les données doivent correspondre aux pièces","body":"Le formulaire France-Visas doit correspondre au passeport, à l’admission, au logement, aux dates de séjour et au financement. Le moindre écart doit être revérifié avant dépôt.","items":["Formulaire complété avec les mêmes informations que le passeport.","Dates de séjour cohérentes avec la formation.","Établissement et formation correctement indiqués.","Récépissé ou document généré conservé.","Référence de rendez-vous ou convocation si applicable.","Coordonnées fiables pour recevoir les notifications." ]},
            {"id":"res-009-admission","screen_number":7,"section_type":"checklist","title":"Bloc 3 — Admission ou inscription","subtitle":"Prouver le motif d’études","body":"France-Visas précise que les pièces justificatives sont indiquées par l’assistant visa et incluent notamment le certificat d’inscription dans l’établissement d’enseignement supérieur qui accepte le candidat. Cette preuve doit être claire et cohérente.","items":["Lettre d’admission, préinscription ou certificat selon situation.","Nom de l’établissement lisible.","Formation, niveau et année indiqués clairement.","Dates compatibles avec la demande de visa.","Cohérence avec le projet d’études et le dossier Campus France.","Traduction ou complément si exigé par la liste officielle." ]},
            {"id":"res-009-campus-france","screen_number":8,"section_type":"checklist","title":"Bloc 4 — Campus France si applicable","subtitle":"Selon le pays de résidence","body":"Dans les pays concernés par Études en France, la procédure Campus France et l’avis ou les éléments du dossier peuvent intervenir avant la demande de visa. Les consignes exactes dépendent du pays et doivent être vérifiées localement.","items":["Attestation, avis ou justificatif Campus France si demandé.","Cohérence entre choix de formation Campus France et visa.","Messages officiels conservés.","Numéro ou référence de dossier si utile.","Vérification des consignes de l’espace Campus France du pays." ]},
            {"id":"res-009-finance","screen_number":9,"section_type":"checklist","title":"Bloc 5 — Ressources financières","subtitle":"La partie la plus sensible","body":"Service-Public indique que l’étudiant étranger doit justifier de ressources, sauf exception, et mentionne un repère de 615 euros par mois. La forme des justificatifs dépend de ta situation et de la liste France-Visas.","items":["Justificatifs de ressources selon la liste France-Visas.","Relevés, attestation bancaire ou garantie selon situation.","Prise en charge signée si une personne finance le séjour.","Pièce d’identité et justificatifs du garant si demandés.","Cohérence entre montant, durée et coût de vie.","Explication claire si les ressources viennent de plusieurs sources." ]},
            {"id":"res-009-housing","screen_number":10,"section_type":"checklist","title":"Bloc 6 — Hébergement","subtitle":"Prouver où tu vas vivre","body":"L’hébergement doit être cohérent avec la ville d’études et les dates d’arrivée. Selon la situation, la preuve peut prendre plusieurs formes : réservation, attestation, bail, logement universitaire ou autre justificatif demandé.","items":["Justificatif d’hébergement demandé par France-Visas.","Ville cohérente avec l’établissement.","Nom, adresse et période lisibles.","Coordonnées de l’hébergeant si applicable.","Lien entre hébergement et date prévue d’arrivée.","Explication si le logement est provisoire." ]},
            {"id":"res-009-insurance","screen_number":11,"section_type":"checklist","title":"Bloc 7 — Assurance et santé","subtitle":"Vérifier selon la liste officielle","body":"Les exigences d’assurance varient selon le visa, la durée et le pays de dépôt. La bonne méthode consiste à vérifier la liste France-Visas et les consignes du centre de dépôt avant de souscrire ou joindre un document.","items":["Assurance demandée ou non selon ta liste France-Visas.","Attestation nominative si exigée.","Dates de couverture visibles.","Type d’assurance cohérent avec la demande.","Document lisible et non expiré.","Informations utiles pour l’arrivée conservées." ]},
            {"id":"res-009-civil-status","screen_number":12,"section_type":"checklist","title":"Bloc 8 — État civil et situation personnelle","subtitle":"Selon ton profil","body":"Certaines situations peuvent demander des justificatifs complémentaires : mineur, changement de nom, situation familiale, prise en charge, autorisation parentale, traduction ou légalisation selon le pays. Ne les ajoute pas au hasard : vérifie la liste officielle.","items":["Acte de naissance ou document d’état civil si demandé.","Autorisation parentale si le profil l’exige.","Documents du garant ou hébergeant si demandés.","Traductions conformes si nécessaires.","Documents cohérents avec le passeport.","Aucun document non officiel ou douteux." ]},
            {"id":"res-009-photos-fees","screen_number":13,"section_type":"checklist","title":"Bloc 9 — Photos, frais et rendez-vous","subtitle":"Les détails pratiques comptent","body":"Le jour du rendez-vous, les détails pratiques peuvent créer du stress inutile : photos, frais, convocation, moyens de paiement, horaires, ordre des documents et copies. Vérifie ces points avant de partir.","items":["Photos conformes si demandées.","Convocation ou confirmation de rendez-vous.","Frais et moyen de paiement selon consignes.","Adresse du centre de dépôt vérifiée.","Heure d’arrivée anticipée.","Téléphone, email et références de dossier disponibles." ]},
            {"id":"res-009-originals","screen_number":14,"section_type":"timeline","title":"Originaux, copies et classement","subtitle":"Préparer deux niveaux de dossier","body":"Prépare un dossier physique propre, même si des copies numériques ont été déposées. Classe les documents par famille pour retrouver rapidement une pièce demandée.","items":["1. Originaux importants dans une pochette séparée.","2. Copies classées selon l’ordre France-Visas.","3. Documents académiques ensemble.","4. Documents financiers ensemble.","5. Hébergement et assurance ensemble.","6. Convocation, formulaire et récépissés au-dessus." ]},
            {"id":"res-009-consistency","screen_number":15,"section_type":"checklist","title":"Contrôle de cohérence","subtitle":"Le dossier doit raconter la même histoire","body":"Avant le rendez-vous, compare les documents entre eux. Le visa n’est pas seulement une pile de pièces : c’est un dossier qui doit expliquer clairement pourquoi tu pars, comment tu finances et où tu vas vivre.","items":["Nom identique partout.","Dates cohérentes entre admission, logement et séjour.","Formation identique entre admission, formulaire et projet.","Ville d’hébergement cohérente avec l’établissement.","Ressources cohérentes avec durée du séjour.","Aucun document illisible ou contradictoire." ]},
            {"id":"res-009-mistakes","screen_number":16,"section_type":"mistakes","title":"Erreurs fréquentes","subtitle":"Ce qui fragilise le dépôt","body":"Les erreurs documentaires viennent souvent d’une mauvaise lecture de la liste officielle ou d’une préparation trop tardive. Relis cette page avant le rendez-vous.","items":["Utiliser une liste trouvée sur un groupe au lieu de France-Visas.","Scanner des documents flous ou coupés.","Oublier les originaux demandés.","Présenter un financement incompréhensible.","Avoir un logement sans lien avec la ville d’études.","Mettre des dates contradictoires.","Ajouter des documents non demandés pour compenser une pièce faible.","Ne pas savoir expliquer les documents de son propre dossier." ]},
            {"id":"res-009-final-checklist","screen_number":17,"section_type":"checklist","title":"Checklist finale documents visa","subtitle":"À valider avant rendez-vous","body":"Cette checklist ne garantit pas l’obtention du visa, mais elle réduit les risques d’un dossier incomplet, désordonné ou incohérent.","items":["J’ai généré ou vérifié ma liste France-Visas.","Mon passeport est valide et lisible.","Mon formulaire et ma convocation sont prêts.","Ma preuve d’admission ou inscription est prête.","Mes justificatifs financiers sont cohérents.","Mon hébergement est justifié.","L’assurance est vérifiée si elle est demandée.","Les documents d’état civil nécessaires sont prêts.","Mes originaux et copies sont classés.","Je peux expliquer chaque document important." ]},
            {"id":"res-009-sources","screen_number":18,"section_type":"sources","title":"Sources officielles à vérifier","subtitle":"La liste dépend de ta situation","body":"Les pièces visa changent selon la nationalité, le pays de résidence, le type de visa et la situation personnelle. Vérifie toujours les sources officielles avant dépôt.","items":["France-Visas — Étudiant : https://france-visas.gouv.fr/etudiant","France-Visas — La démarche d’obtention de visa : https://france-visas.gouv.fr/la-demarche","France-Visas — Visa de long séjour : https://france-visas.gouv.fr/visa-de-long-sejour","Campus France — Visas et cartes de séjour : https://www.campusfrance.org/fr/visas-et-cartes-de-sejour","Campus France — VLS-TS étudiant : https://www.campusfrance.org/fr/visa-long-sejour-etudiant","Service-Public — Étudiant étranger visa long séjour : https://www.service-public.fr/particuliers/vosdroits/F2231","Service-Public — Visa de long séjour : https://www.service-public.fr/particuliers/vosdroits/F16162" ]},
        ],
    },
    "questions-frequentes-campus-france": {
        "id": "res-010",
        "title": "Questions fréquentes Campus France",
        "slug": "questions-frequentes-campus-france",
        "description": "Réponses structurées aux questions fréquentes sur la procédure Études en France, l'entretien, les formations et le visa.",
        "category": "Campus France",
        "reading_minutes": 35,
        "checkout_service_slug": "resource-questions-frequentes-campus-france",
        "sections": [
            {"id":"res-010-preview","screen_number":1,"section_type":"preview","title":"Questions fréquentes Campus France","subtitle":"Aperçu gratuit","body":"Cette ressource rassemble les réponses utiles aux questions que les candidats se posent souvent pendant la procédure Campus France : compte Études en France, documents, formations, projet d’études, paiement, entretien, réponses des établissements et passage vers le visa.","items":["Comprendre les grandes étapes de la procédure.","Éviter les confusions entre Campus France, établissement et consulat.","Préparer les questions importantes avant soumission.","Savoir où vérifier les sources officielles."],"is_preview":True},
            {"id":"res-010-paywall","screen_number":2,"section_type":"paywall","title":"Débloque la FAQ complète","subtitle":"Accès privé","body":"La suite contient une FAQ structurée écran par écran : procédure, compte, calendrier, documents, formations, motivations, entretien, réponses, visa, erreurs fréquentes et checklist finale. Aucun fichier partageable, aucun téléchargement : tout reste dans ton espace privé.","items":["FAQ privée en format tunnel.","Réponses courtes et actionnables.","Liens entre dossier, entretien et visa.","Contenu protégé par ton compte et filigrane."],"is_locked":True},
            {"id":"res-010-procedure","screen_number":3,"section_type":"chapter","title":"À quoi sert Campus France ?","subtitle":"Ne pas confondre les rôles","body":"Campus France accompagne la procédure Études en France et la préparation du dossier. La plateforme Études en France permet de gérer les démarches d’inscription jusqu’à la demande de visa. Les établissements évaluent les candidatures et le service consulaire décide du visa.","items":["Campus France encadre la procédure selon le pays.","Les établissements donnent les réponses d’admission.","Le consulat décide de la demande de visa.","Une admission ne garantit pas automatiquement le visa." ]},
            {"id":"res-010-eef","screen_number":4,"section_type":"chapter","title":"Qu’est-ce que la procédure Études en France ?","subtitle":"Un dossier électronique guidé","body":"Campus France présente Études en France comme un service en ligne unique et dématérialisé. Le candidat crée un dossier électronique personnel, renseigne les informations, dépose les demandes et suit les étapes selon sa situation.","items":["Créer un dossier personnel.","Renseigner les informations demandées.","Sélectionner ou déclarer les formations selon le cas.","Soumettre le dossier et suivre les réponses.","Préparer ensuite l’étape visa si nécessaire." ]},
            {"id":"res-010-account","screen_number":5,"section_type":"checklist","title":"FAQ compte et dossier","subtitle":"Les premières erreurs arrivent souvent ici","body":"Le compte Études en France doit être fiable. Les informations saisies doivent correspondre aux documents officiels. Une erreur d’identité, d’email ou de parcours peut compliquer la suite.","items":["Puis-je créer plusieurs comptes ? Évite. Utilise un compte fiable et conserve l’accès.","Que faire si mon email n’est plus accessible ? Contacte l’espace Campus France local avant de recréer au hasard.","Puis-je modifier après soumission ? Certaines modifications peuvent être limitées selon l’étape.","Dois-je remplir toutes les rubriques ? Remplis toutes les rubriques demandées avec cohérence.","Les informations doivent-elles correspondre aux documents ? Oui, toujours." ]},
            {"id":"res-010-calendar","screen_number":6,"section_type":"chapter","title":"FAQ calendrier","subtitle":"Les dates sont locales et peuvent changer","body":"Campus France Togo publie un calendrier 2026-2027 et détaille les étapes. Les dates varient selon pays, niveau, type de procédure et établissements. Le bon réflexe est de vérifier la page locale de Campus France avant d’agir.","items":["Quand commencer ? Dès l’ouverture officielle et avant l’urgence.","Puis-je soumettre au dernier moment ? Mauvaise idée : une pièce manquante peut bloquer.","Les calendriers sont-ils les mêmes dans tous les pays ? Non.","Les établissements peuvent-ils avoir leurs propres dates ? Oui, il faut vérifier.","Le calendrier visa est-il séparé ? Oui, il faut aussi anticiper la phase visa." ]},
            {"id":"res-010-documents","screen_number":7,"section_type":"checklist","title":"FAQ documents","subtitle":"Présent ne veut pas dire correct","body":"Les documents doivent être lisibles, complets et cohérents. Campus France Togo publie une liste de documents requis selon les profils. Les exigences peuvent changer selon la campagne et le niveau du candidat.","items":["Dois-je scanner tous les documents ? Selon les rubriques demandées par la plateforme.","Un document flou suffit-il ? Non, il doit être lisible.","Dois-je garder les originaux ? Oui, ils peuvent être demandés à l’entretien ou au visa.","Que faire si un document manque ? Vérifie les consignes locales et prépare une justification si possible.","Les traductions sont-elles toujours nécessaires ? Pas toujours, vérifie les consignes officielles." ]},
            {"id":"res-010-formations","screen_number":8,"section_type":"chapter","title":"FAQ choix des formations","subtitle":"Choisir avec cohérence","body":"Le choix des formations doit être relié au parcours, au niveau, aux prérequis et au projet professionnel. Une liste de formations incohérente peut fragiliser le dossier et l’entretien.","items":["Puis-je choisir des formations très différentes ? Possible, mais il faut justifier la cohérence.","Dois-je vérifier les prérequis ? Oui, toujours.","Le prestige suffit-il ? Non, le contenu du programme compte.","Puis-je changer de domaine ? Oui, si la réorientation est expliquée.","Dois-je connaître les formations à l’entretien ? Oui, c’est indispensable." ]},
            {"id":"res-010-project","screen_number":9,"section_type":"chapter","title":"FAQ projet d’études","subtitle":"Ton projet doit tenir debout","body":"Campus France Mali explique qu’un projet d’études est prêt quand le candidat peut en parler librement et le présenter à l’écrit ou à l’oral. Le projet doit donc être personnel, cohérent et défendable.","items":["Un projet d’études est-il une lettre ? Non, c’est la logique de ton parcours et de tes choix.","Puis-je copier un modèle ? Non, utilise une structure mais personnalise tout.","Faut-il parler du projet professionnel ? Oui, il donne une direction.","Faut-il expliquer le choix de la France ? Oui, avec une raison académique ou professionnelle.","Que faire si mon parcours est irrégulier ? L’expliquer clairement, sans mentir." ]},
            {"id":"res-010-payment-submit","screen_number":10,"section_type":"chapter","title":"FAQ soumission et paiement","subtitle":"Valider seulement quand le dossier est prêt","body":"Campus France Togo détaille une étape où le candidat soumet son dossier et paie les frais d’inscription Campus France. Avant de payer ou soumettre, il faut vérifier le dossier et les recommandations locales.","items":["Puis-je payer avant d’avoir tout vérifié ? Mauvaise idée.","Le paiement corrige-t-il un dossier faible ? Non.","Puis-je revenir en arrière après soumission ? Cela dépend de l’étape et du pays.","Que dois-je vérifier avant soumission ? Identité, documents, formations, motivations, cohérence.","Dois-je garder une preuve du paiement ? Oui, garde les reçus ou confirmations." ]},
            {"id":"res-010-interview","screen_number":11,"section_type":"chapter","title":"FAQ entretien Campus France","subtitle":"Préparer les idées, pas réciter","body":"Campus France Togo présente l’entretien comme un moment où le candidat expose son projet d’études, son parcours et ses motivations. Campus France Maroc indique aussi que les originaux du dossier pédagogique peuvent être demandés selon les consignes locales.","items":["Combien de temps dure l’entretien ? Cela dépend du pays, mais il faut préparer un échange structuré.","Dois-je apprendre un texte ? Non, prépare des idées claires.","Quelles questions reviennent souvent ? Parcours, formations, France, projet professionnel, financement.","Dois-je connaître mon dossier ? Oui, parfaitement.","Dois-je apporter des originaux ? Vérifie les consignes de ton espace Campus France." ]},
            {"id":"res-010-answers","screen_number":12,"section_type":"chapter","title":"FAQ réponses des établissements","subtitle":"Suivre la plateforme et les consignes","body":"Selon Campus France Maroc, la procédure de candidature inclut la connexion à la plateforme pour consulter les réponses des établissements. Les délais et modalités peuvent varier selon les formations et les établissements.","items":["Où voir les réponses ? Sur la plateforme Études en France et parfois les portails établissements.","Puis-je recevoir une réponse hors plateforme ? Selon les établissements, mais garde tout officiel.","Que faire en cas de refus ? Analyse la cohérence du dossier avant de relancer.","Que faire en cas d’acceptation ? Suivre les consignes pour confirmer et préparer la suite.","L’acceptation suffit-elle pour le visa ? Non, la demande visa reste une étape distincte." ]},
            {"id":"res-010-visa","screen_number":13,"section_type":"chapter","title":"FAQ passage vers le visa","subtitle":"Admission et visa sont liés mais différents","body":"Campus France Togo rappelle que le service consulaire consulte le dossier électronique, examine le dossier consulaire et décide de l’attribution du visa pour études. La préparation visa doit donc être sérieuse et distincte.","items":["Quand préparer le visa ? Dès que la phase admission avance sérieusement.","France-Visas est-il obligatoire ? C’est la référence officielle pour vérifier le visa et les pièces.","Campus France donne-t-il le visa ? Non.","Que faut-il préparer ? Passeport, admission, ressources, hébergement, assurance selon liste officielle.","Dois-je garder une cohérence avec mon dossier Campus France ? Oui, absolument." ]},
            {"id":"res-010-common-questions","screen_number":14,"section_type":"checklist","title":"Questions fréquentes à préparer","subtitle":"Pour le dossier et l’entretien","body":"Ces questions doivent être travaillées avant l’entretien et avant les validations importantes. Le but est de répondre avec cohérence, pas avec des phrases apprises par cœur.","items":["Pourquoi ce domaine ?","Pourquoi cette formation ?","Pourquoi cet établissement ?","Pourquoi la France ?","Quel lien avec ton parcours ?","Quel est ton projet professionnel ?","Comment finances-tu tes études ?","Que feras-tu si tu n’es pas accepté ?","Que feras-tu après tes études ?","Pourquoi ton dossier est cohérent ?" ]},
            {"id":"res-010-mistakes","screen_number":15,"section_type":"mistakes","title":"Erreurs fréquentes","subtitle":"Ce qui crée des blocages","body":"Les erreurs Campus France viennent souvent d’une mauvaise compréhension de la procédure, d’un dossier incomplet ou d’un discours incohérent entre documents, formations et projet.","items":["Créer plusieurs comptes sans raison.","Attendre le dernier jour pour préparer les documents.","Choisir des formations sans lire les prérequis.","Copier un projet d’études ou une lettre.","Payer ou soumettre sans vérifier la cohérence.","Arriver à l’entretien sans connaître ses formations.","Penser que Campus France garantit le visa.","Ignorer les consignes locales du pays." ]},
            {"id":"res-010-final-checklist","screen_number":16,"section_type":"checklist","title":"Checklist finale FAQ Campus France","subtitle":"À valider avant d’avancer","body":"Cette checklist te permet de vérifier que les bases sont solides avant de passer à l’étape suivante de la procédure.","items":["Je connais mon calendrier local.","Mon compte Études en France est fiable.","Mes documents sont lisibles et cohérents.","Mes formations sont justifiées.","Mon projet d’études est défendable.","Je sais expliquer mes motivations.","Je comprends le rôle de l’entretien.","Je sais où consulter les réponses.","Je distingue admission, Campus France et visa.","Je vérifie toujours les sources officielles avant d’agir." ]},
            {"id":"res-010-sources","screen_number":17,"section_type":"sources","title":"Sources officielles à vérifier","subtitle":"Les consignes varient selon le pays","body":"Cette FAQ donne une méthode et des réponses pratiques. Les dates, documents et consignes doivent toujours être confirmés sur les sources officielles Campus France et Études en France.","items":["Campus France — Procédure Études en France : https://www.campusfrance.org/fr/candidature-procedure-etudes-en-france","Campus France Togo — Les 8 étapes de la procédure : https://www.togo.campusfrance.org/les-etapes-de-la-procedure-campusfrance-et-le-calendrier-de-la-procedure-campus-france","Campus France Togo — L’entretien Campus France : https://www.togo.campusfrance.org/l-entretien-campus-france","Campus France Togo — Procédures et inscriptions : https://www.togo.campusfrance.org/les-procedures-et-inscriptions","Campus France Maroc — Procédure de candidature Études en France : https://www.maroc.campusfrance.org/la-procedure-de-candidature-sur-etudes-en-france-de-campus-france","Campus France Maroc — Entretien de candidature : https://www.maroc.campusfrance.org/l-entretien-de-candidature-de-campus-france","Campus France Mali — Préparer son projet d’études : https://www.mali.campusfrance.org/preparer-son-projet-d-etudes" ]},
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
