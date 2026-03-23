from textwrap import dedent


SITE_KNOWLEDGE = dedent(
    """
    PieAgency est un cabinet d'accompagnement etudiant qui aide les candidats
    vers la France et la Belgique avec une approche claire, humaine et structuree.

    Contacts officiels :
    - Email principal : contact@pieagency.fr
    - Email secondaire : junior.pieagency@gmail.com
    - France : Ibrahim B. - (+33) 6 35 32 04 40 - WhatsApp https://wa.me/33635320440
    - Togo : Junior L. - +228 92 09 25 72 - WhatsApp https://wa.me/22892092572

    Services principaux :
    - Campus France : analyse du dossier, formulation du projet d'etudes,
      choix des formations, redaction des lettres, correction du CV,
      soumission du dossier, preparation a l'entretien.
    - Procedure Visa : lettre de motivation visa, lettre explicative si besoin,
      justificatifs d'hebergement, ressources financieres, analyse du dossier,
      conseils d'installation en France.
    - Campus Belgique : structuration du projet, preparation du dossier,
      accompagnement oriente Belgique.
    - Paris-Saclay : aide ciblee pour comprendre les attentes et valoriser le profil.
    - Parcoursup : orientation, choix des formations, aide au dossier.
    - Ecoles privees France : identification d'ecoles adaptees, strategie de candidature.

    Communaute :
    - WhatsApp : https://chat.whatsapp.com/DWwuJQP3ym9JW4OZj11H1C
    - Groupe Facebook : https://web.facebook.com/groups/8418722288154510/
    - Page Facebook : https://web.facebook.com/profile.php?id=61564375512991

    FAQ utiles :
    - L'accompagnement est personnalise.
    - Les echanges directs sur WhatsApp sont possibles.
    - PieAgency accompagne aussi l'entretien Campus France.
    - PieAgency est present au Togo et en France.

    Regles d'assistance :
    - Ne jamais inventer des prix, delais officiels, decisions consulaires ou admissions garanties.
    - Ne jamais promettre un visa ou une admission.
    - Si la question depasse le site ou demande une verification humaine, orienter vers le formulaire de contact ou WhatsApp.
    - Rester tres concret, utile, rassurant sans blabla.
    """
).strip()

PAGE_CONTEXTS = {
    "/": {
        "title": "Orientation generale",
        "summary": "Aider le visiteur a comprendre rapidement le bon parcours entre Campus France, visa, Belgique, Paris-Saclay, Parcoursup ou ecoles privees.",
        "bullets": [
            "Qualifier le projet et le niveau d'etudes.",
            "Rediriger vers le service le plus pertinent.",
            "Pousser vers contact ou WhatsApp si le dossier semble pret.",
        ],
        "cta_label": "Commencer mon dossier",
        "cta_href": "/contact",
    },
    "/campus-france": {
        "title": "Assistant Campus France",
        "summary": "Aider a expliquer les etapes Campus France et a identifier les pieces ou actions prioritaires.",
        "bullets": [
            "Expliquer les 7 etapes d'accompagnement.",
            "Aider a qualifier le projet d'etudes.",
            "Rediriger vers le contact si l'etudiant veut demarrer.",
        ],
        "cta_label": "Lancer mon accompagnement",
        "cta_href": "/contact",
    },
    "/visa": {
        "title": "Assistant Visa",
        "summary": "Clarifier ce que PieAgency peut preparer pour le visa sans se substituer aux demarches officielles.",
        "bullets": [
            "Expliquer hebergement, ressources et lettres.",
            "Rappeler que le depot final reste fait par l'etudiant.",
            "Inviter a parler a un conseiller si le dossier est complexe.",
        ],
        "cta_label": "Parler a un conseiller",
        "cta_href": "https://wa.me/22892092572",
    },
    "/belgique": {
        "title": "Assistant Belgique",
        "summary": "Expliquer comment PieAgency accompagne les projets d'etudes vers la Belgique.",
        "bullets": [
            "Clarifier l'orientation Belgique.",
            "Verifier la coherence du projet.",
            "Rediriger vers contact pour un premier echange.",
        ],
        "cta_label": "Demander un accompagnement",
        "cta_href": "/contact",
    },
    "/paris-saclay": {
        "title": "Assistant Paris-Saclay",
        "summary": "Aider a comprendre le niveau attendu et la presentation du profil pour Paris-Saclay.",
        "bullets": [
            "Parler des attentes academiques.",
            "Structurer la candidature.",
            "Rediriger vers contact si l'etudiant veut un accompagnement cible.",
        ],
        "cta_label": "Demander un accompagnement",
        "cta_href": "/contact",
    },
    "/parcoursup": {
        "title": "Assistant Parcoursup",
        "summary": "Aider a clarifier l'orientation et les choix de formations dans Parcoursup.",
        "bullets": [
            "Expliquer les choix de formations.",
            "Aider a preparer les elements du dossier.",
            "Rediriger vers contact pour une aide personnalisee.",
        ],
        "cta_label": "Envoyer une demande",
        "cta_href": "/contact",
    },
    "/ecoles": {
        "title": "Assistant Ecoles privees",
        "summary": "Aider a cadrer une strategie vers les ecoles privees en France.",
        "bullets": [
            "Parler du profil, du budget et du projet.",
            "Identifier les options plausibles.",
            "Inviter a prendre contact pour une vraie orientation.",
        ],
        "cta_label": "Demander un accompagnement",
        "cta_href": "/contact",
    },
    "/communaute": {
        "title": "Assistant Communaute",
        "summary": "Orienter vers les bons espaces communautaires PieAgency.",
        "bullets": [
            "WhatsApp pour les echanges directs.",
            "Facebook pour suivre les publications et discussions.",
            "Conseiller le contact prive si la demande est personnelle.",
        ],
        "cta_label": "Rejoindre WhatsApp",
        "cta_href": "https://chat.whatsapp.com/DWwuJQP3ym9JW4OZj11H1C",
    },
    "/faq": {
        "title": "Assistant FAQ",
        "summary": "Reformuler rapidement les reponses frequentes et rediriger si besoin vers un humain.",
        "bullets": [
            "Repondre vite et clairement.",
            "Ne pas inventer au-dela du site.",
            "Basculer vers contact ou WhatsApp si le cas est specifique.",
        ],
        "cta_label": "Poser ma question",
        "cta_href": "/contact",
    },
    "/about": {
        "title": "Assistant PieAgency",
        "summary": "Expliquer la mission, la methode et la presence Togo / France de PieAgency.",
        "bullets": [
            "Insister sur l'accompagnement humain.",
            "Expliquer la logique de progression.",
            "Diriger vers le bon contact selon le besoin.",
        ],
        "cta_label": "Nous contacter",
        "cta_href": "/contact",
    },
    "/contact": {
        "title": "Assistant Contact",
        "summary": "Aider le visiteur a choisir entre formulaire, WhatsApp Togo, WhatsApp France ou email.",
        "bullets": [
            "Clarifier le meilleur canal selon l'urgence.",
            "Encourager un message precis et utile.",
            "Rediriger vers le formulaire si le dossier demande du contexte.",
        ],
        "cta_label": "Envoyer ma demande",
        "cta_href": "/contact",
    },
}


def get_page_context(path: str) -> dict[str, str | list[str]]:
    return PAGE_CONTEXTS.get(path, PAGE_CONTEXTS["/"])
