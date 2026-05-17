# Handoff frontend Claude — Mon parcours guide

## Objectif

Creer le frontend du module **Mon parcours guide** dans l'espace candidat PieAgency, sans refaire les modules existants et sans casser l'espace candidat actuel.

Le backend est pret avec les endpoints suivants :

- `GET /api/candidate/progressive-path`
- `POST /api/candidate/progressive-path/steps/{step_id}/start`
- `POST /api/candidate/progressive-path/steps/{step_id}/complete`
- `POST /api/candidate/progressive-path/steps/{step_id}/reopen`
- `POST /api/candidate/progressive-path/official-deposit`

Ne pas modifier l'authentification, l'inscription, la connexion, le mot de passe oublie, le site public, ni les modules candidat deja fonctionnels.

## Ou placer le module

- Ajouter **Mon parcours guide** dans la sidebar de l'espace candidat.
- Le module doit etre visible pour les candidats.
- Le lien Admin doit rester visible uniquement aux utilisateurs autorises.
- Dans la topbar de l'espace candidat, afficher seulement un rappel rapide : etape actuelle + bouton **Continuer**.
- La page principale a creer est : `/espace-etudiant/parcours-guide`.

## Role exact du module

**Mon parcours guide** est le resume operationnel de l'espace candidat.

Il ne remplace pas :

- Tableau de bord
- Embarquement
- Diagnostic
- Produits digitaux
- Mes ressources
- Mes documents
- Assistant dossier
- Abonnement

Il doit seulement relier ces modules, afficher l'etape actuelle, les actions utiles, les ressources, les produits recommandes et les documents lies.

Regle centrale : ne cree aucun doublon. Le Copilote doit pointer vers les modules existants avec `target_module` et `target_path`.

Exemples :

- Completer mon profil -> Embarquement
- Lire mon diagnostic -> Diagnostic
- Preparer mes documents -> Mes documents
- Lire une ressource -> Mes ressources
- Ouvrir un produit recommande -> Produits digitaux
- Poser une question -> Assistant dossier
- Voir mon abonnement -> Abonnement

## Page principale

Route : `/espace-etudiant/parcours-guide`

Titre :

**Mon parcours guide**

Sous-titre :

**Avancez dans votre procedure etape par etape, avec les bonnes ressources au bon moment.**

Blocs a afficher :

- Progression globale
- Etape actuelle
- Timeline des 15 etapes
- Action gratuite recommandee
- Produit digital recommande
- Action assistant dossier
- Action document
- Bloc depot officiel si pertinent
- Boutons `start`, `complete`, `reopen` selon statut

## Regles UX importantes

Ne jamais ecrire que PieAgency soumet ou depose officiellement un dossier.

Ne pas utiliser :

- Soumettre mon dossier sur PieAgency
- Deposer via PieAgency
- Envoyer ma candidature depuis PieAgency

Utiliser :

- Preparer le depot officiel
- Verifier avant depot officiel
- Declarer le depot officiel comme fait
- Renseigner la date du depot officiel
- Renseigner la reference du dossier officiel
- Suivre apres depot officiel

Texte obligatoire dans le bloc depot officiel :

**PieAgency vous aide a preparer, verifier et suivre votre procedure. Le depot officiel se fait uniquement sur la plateforme concernee : Campus France, ecole privee, Parcoursup, Belgique ou service visa officiel.**

Important : le module peut enregistrer une declaration de suivi faite par le candidat, mais il ne doit jamais presenter PieAgency comme la plateforme officielle de depot.

## Contrat API

### GET `/api/candidate/progressive-path`

La reponse contient :

```json
{
  "candidate_id": "uuid",
  "current_step": {},
  "progress_percent": 40,
  "steps": [],
  "official_deposit": {},
  "recommendations": {}
}
```

Chaque `step` contient :

```json
{
  "id": "prepare-study-project",
  "title": "Preparer mon projet d'etudes",
  "order": 5,
  "status": "in_progress",
  "short_description": "Structurer un projet d'etudes clair, credible et defendable.",
  "is_current": true,
  "is_locked": false,
  "target_module": "produits_digitaux",
  "target_path": "/espace-etudiant/produits"
}
```

Statuts possibles :

- `not_started`
- `in_progress`
- `needs_review`
- `completed`
- `blocked`

Bloc `official_deposit` :

```json
{
  "has_declared": false,
  "platform_type": null,
  "platform_name": null,
  "official_deposit_date": null,
  "official_reference": null,
  "status": null,
  "comment": null
}
```

Si une declaration existe :

```json
{
  "has_declared": true,
  "platform_type": "campus_france",
  "platform_name": "Campus France Senegal",
  "official_deposit_date": "2026-05-17",
  "official_reference": "CF-2026-001",
  "status": "declared",
  "comment": "Depot officiel declare par le candidat pour suivi PieAgency."
}
```

Valeurs possibles pour `platform_type` :

- `campus_france`
- `private_school`
- `parcoursup`
- `belgium`
- `visa`
- `other`

Valeurs possibles pour `official_deposit.status` :

- `declared`
- `under_review`
- `accepted`
- `refused`
- `waiting`
- `other`

Bloc `recommendations` :

```json
{
  "current_step_id": "prepare-study-project",
  "free_action": {
    "title": "Continuer avec la checklist",
    "description": "Utilisez les ressources disponibles pour structurer votre projet d'etudes.",
    "target_module": "ressources",
    "target_path": "/espace-etudiant/ressources"
  },
  "recommended_product": {
    "title": "Generateur projet d'etudes",
    "description": "Un outil guide pour construire un projet d'etudes coherent.",
    "target_module": "produits_digitaux",
    "target_path": "/espace-etudiant/produits/prod-003",
    "requires_purchase": true
  },
  "assistant_action": {
    "title": "Poser une question a l'assistant dossier",
    "description": "Demandez a l'assistant de vous aider sur cette etape.",
    "target_module": "assistant_dossier",
    "target_path": "/espace-etudiant/assistant?context=prepare-study-project"
  },
  "document_action": null
}
```

Chaque action non nulle contient toujours :

- `title`
- `description`
- `target_module`
- `target_path`

`recommended_product` contient aussi :

- `requires_purchase`

## Endpoints mutation

### Demarrer une etape

`POST /api/candidate/progressive-path/steps/{step_id}/start`

Role :

- Mettre l'etape en `in_progress`
- Definir cette etape comme etape actuelle
- Refuser si l'etape est verrouillee

Retour : meme contrat que `GET /api/candidate/progressive-path`.

### Marquer une etape comme faite

`POST /api/candidate/progressive-path/steps/{step_id}/complete`

Role :

- Mettre l'etape en `completed`
- Deverrouiller l'etape suivante
- Mettre l'etape suivante en `in_progress` et `is_current: true`
- Ne pas forcer tout le parcours comme termine

Retour : meme contrat que `GET /api/candidate/progressive-path`.

### Rouvrir une etape

`POST /api/candidate/progressive-path/steps/{step_id}/reopen`

Role :

- Remettre l'etape en `in_progress`
- Definir cette etape comme etape actuelle
- Ne pas supprimer automatiquement les statuts deja termines apres elle

Retour : meme contrat que `GET /api/candidate/progressive-path`.

### Declarer le depot officiel externe

`POST /api/candidate/progressive-path/official-deposit`

Body :

```json
{
  "platform_type": "campus_france",
  "platform_name": "Campus France Senegal",
  "official_deposit_date": "2026-05-17",
  "official_reference": "CF-2026-001",
  "status": "declared",
  "comment": "Depot officiel declare par le candidat pour suivi PieAgency."
}
```

Role :

- Enregistrer ou mettre a jour la declaration de depot officiel externe du candidat
- Ne pas uploader de dossier
- Ne pas envoyer de candidature
- Ne pas appeler une plateforme officielle
- Seulement stocker une declaration de suivi faite par le candidat

Retour : meme contrat que `GET /api/candidate/progressive-path`.

## Comportement frontend attendu

- Cliquer sur une action doit rediriger vers `target_path`.
- Le Copilote ne doit pas recreer documents, ressources, produits ou assistant.
- Si l'etape est verrouillee, afficher un etat desactive.
- Si l'etape est actuelle, la mettre visuellement en avant.
- Si une etape est terminee, afficher un badge **Termine**.
- Si le candidat clique sur **Marquer comme fait**, appeler `complete`.
- Apres chaque action backend, rafraichir `GET /api/candidate/progressive-path`.
- En cas d'erreur API, afficher un message clair et ne pas casser l'ecran.
- Ne pas forcer l'achat d'un produit recommande. Afficher le produit comme une option utile.

## Suggestions UI

Structure recommandee :

- Header page : titre, sous-titre, progression globale.
- Carte etape actuelle : titre, description, statut, bouton principal.
- Carte recommandations : action gratuite, produit recommande, assistant, documents.
- Timeline : 15 etapes avec statut, verrouillage, etape actuelle.
- Bloc depot officiel : visible fortement pour l'etape `mark-official-filing-done` et utile aussi pour `track-after-official-filing`.

Boutons selon statut :

- `not_started` non verrouille : **Demarrer**
- `in_progress` : **Marquer comme fait**
- `completed` : **Rouvrir**
- `blocked` : etat bloque, pas d'action principale
- `needs_review` : afficher un etat attente/revision

## Design demande

- Style propre, premium, clair, humain.
- Interface SaaS educatif.
- Sidebar existante conservee.
- Cartes lisibles.
- Timeline verticale ou horizontale selon responsive.
- Couleurs coherentes avec PieAgency.
- Ne pas faire un design trop IA ou trop gadget.
- Le candidat doit toujours comprendre : ou il est, quoi faire maintenant, quoi faire apres.

Responsive obligatoire :

- Mobile : timeline verticale, cartes empilees, boutons pleine largeur si necessaire.
- Tablette : cartes en grille simple.
- Desktop : layout confortable avec progression + recommandations + timeline.

## Points de vigilance

- Ne pas toucher au site public.
- Ne pas changer les routes existantes.
- Ne pas cacher les modules existants.
- Ne pas rendre le lien Admin visible aux candidats non autorises.
- Ne pas coder de logique de paiement dans ce module.
- Ne pas coder de moteur IA.
- Ne pas dupliquer les donnees documents, ressources, produits ou assistant.

## Definition of done frontend

- Route `/espace-etudiant/parcours-guide` creee.
- Entree **Mon parcours guide** ajoutee dans la sidebar candidat.
- `GET /api/candidate/progressive-path` consomme.
- Timeline des 15 etapes affichee.
- Bloc recommandations affiche.
- Actions redirigent vers `target_path`.
- Boutons `start`, `complete`, `reopen` branches.
- Declaration de depot officiel externe possible.
- Responsive verifie mobile, tablette, desktop.
- Aucun texte interdit sur une soumission ou un depot officiel via PieAgency.
