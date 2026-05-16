# Integration portail prive

## Routes frontend cible

Les routes privees restent integrees au frontend Next.js existant.

- Candidat: `/espace-etudiant/*`
- Admin: `/admin/*`
- Ne pas creer de prefixe `/portail/*`.

## Endpoints backend disponibles

Tous les endpoints ci-dessous sont prefixes par `/api`.

### Auth

- `POST /auth/sign-in`
- `POST /auth/sign-up`
- `POST /auth/refresh`
- `GET /auth/me`

### Candidat

- `GET /student-space`
- `GET /private/documents`
- `POST /private/onboarding`
- `GET /private/diagnostic`
- `GET /private/products`
- `GET /private/products/{product_id}`
- `GET /private/resources`
- `GET /private/subscriptions`

### Admin

- `GET /admin/dashboard`
- `GET /admin/candidates`
- `GET /admin/pages`
- `PATCH /admin/pages/{page_id}`
- `GET /admin/conversations/{conversation_id}`
- `GET /admin/exports/catalog`
- `GET /admin/exports/{dataset_key}`
- `POST /admin/community/posts/{post_id}/archive`
- `POST /admin/community/posts/{post_id}/restore`
- `DELETE /admin/community/comments/{comment_id}`

### Communaute

- `GET /community/bootstrap`
- `POST /community/posts`
- `POST /community/posts/{post_id}/comments`
- `POST /community/posts/{post_id}/reactions/{reaction_kind}`
- `POST /community/posts/{post_id}/poll-votes`
- `GET /community/assistant/thread`
- `POST /community/assistant/messages`
- `GET /community/groups`
- `POST /community/groups`
- `POST /community/groups/{group_id}/membership`
- `GET /community/events-calendar`
- `POST /community/events-calendar`
- `POST /community/events-calendar/{event_id}/attendance`
- `GET /community/notifications`
- `POST /community/notifications/{notification_id}/read`
- `GET /community/ads`
- `POST /community/ads`
- `POST /community/ai-rewrite`
- `GET /community/groups/{group_id}/posts`

### Paiements

- `GET /payments/config`
- `POST /payments/maketou/checkout`
- `GET /payments/maketou/carts/{cart_id}`
- `POST /payments/receipt`

## Endpoints ajoutes pour la migration privee

Les endpoints suivants sont proteges par auth:

- `GET /api/private/products`
- `GET /api/private/products/{product_id}`
- `GET /api/private/resources`
- `GET /api/private/subscriptions`
- `GET /api/private/documents`
- `POST /api/private/onboarding`
- `GET /api/private/diagnostic`
- `GET /api/admin/candidates`

Produits, ressources et abonnements utilisent pour l'instant un catalogue serveur statique. `private/documents` lit la table Supabase `case_documents` via le dernier dossier rattache au compte connecte. `private/onboarding` tente de synchroniser la table `student_onboarding`, puis repond sans casser si la table n'est pas encore creee. `private/diagnostic` produit une recommandation a partir de cet onboarding quand il existe, sinon renvoie un diagnostic par defaut.

## Branchement paiement prive

- Les abonnements pointent vers `/paiement?service={service_slug}`.
- Les produits pointent vers `/paiement?service={service_slug}&amount={price}&reason={label}`.
- `PaymentForm` accepte maintenant les query params `service`, `amount` et `reason` pour pre-remplir le formulaire avant checkout MakeTou.

## Manques backend a traiter ensuite

- `POST /private/documents` pour upload ou declaration de document
- CRUD admin produits
- CRUD admin ressources
- gestion admin abonnements
- historique paiements interne rattache aux comptes

## Regles de migration frontend

- Responsive obligatoire des la migration de chaque ecran.
- Pas de scroll horizontal global.
- Les listes et tableaux admin doivent se compacter ou scroller dans leur conteneur.
- Les donnees mockees peuvent rester temporaires, mais le fichier doit etre isole et remplacable par les endpoints ci-dessus.
