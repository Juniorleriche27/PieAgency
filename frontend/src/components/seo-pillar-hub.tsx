import { ActionLink } from "@/components/action-link";

const pillarTopics = [
  {
    badge: "Campus France",
    title: "Campus France : dossier, formations et entretien",
    intent: "Pour les étudiants qui veulent comprendre comment structurer leur candidature et éviter un dossier trop général.",
    href: "/campus-france",
    keywords: ["choix des formations", "lettre de motivation", "entretien Campus France"],
  },
  {
    badge: "Visa étudiant",
    title: "Visa France : preuves, hébergement et ressources",
    intent: "Pour préparer les pièces sensibles avant le dépôt et réduire les incohérences du dossier.",
    href: "/visa",
    keywords: ["justificatifs financiers", "hébergement", "lettre explicative"],
  },
  {
    badge: "Belgique",
    title: "Étudier en Belgique : écoles, dossier et visa",
    intent: "Pour les profils qui cherchent une alternative claire à la France avec un calendrier d’action.",
    href: "/belgique",
    keywords: ["universités belges", "hautes écoles", "titre de séjour"],
  },
  {
    badge: "Documents",
    title: "Documents étudiants : CV, lettres et pièces à préparer",
    intent: "Pour transformer une liste de pièces en dossier cohérent, lisible et prêt à relire.",
    href: "/contact?source=seo_pillar&intent=documents",
    keywords: ["CV étudiant", "lettre de motivation", "checklist dossier"],
  },
  {
    badge: "Logement",
    title: "Logement étudiant : bail, attestation et cohérence visa",
    intent: "Pour anticiper l’hébergement avant les étapes administratives sensibles.",
    href: "/visa#hebergement",
    keywords: ["attestation hébergement", "contrat de bail", "preuve logement"],
  },
  {
    badge: "Bourses",
    title: "Bourses et budget : clarifier les ressources du projet",
    intent: "Pour estimer le budget, organiser les preuves et mieux expliquer le financement.",
    href: "/contact?source=seo_pillar&intent=budget-bourses",
    keywords: ["budget étudiant", "ressources suffisantes", "bourse d’étude"],
  },
];

const searchQuestions = [
  "Comment savoir si mon dossier Campus France est cohérent ?",
  "Quels documents préparer avant une demande de visa étudiant ?",
  "France ou Belgique : quelle procédure correspond à mon profil ?",
  "Comment expliquer mon projet d’études à l’entretien ?",
];

export function SeoPillarHub() {
  return (
    <section className="section seo-pillar-section">
      <div className="container">
        <div className="seo-pillar-head">
          <div>
            <span className="seo-pillar-eyebrow">Pages piliers</span>
            <h2>Les recherches clés des étudiants doivent mener vers un diagnostic PieAgency.</h2>
            <p>
              Campus France, visa, Belgique, documents, logement ou budget : chaque sujet devient
              une porte d’entrée claire vers la bonne procédure et le bon accompagnement.
            </p>
          </div>
          <ActionLink href="/contact?source=seo_hub&intent=diagnostic" variant="gold" size="lg">
            Analyser mon cas
          </ActionLink>
        </div>

        <div className="seo-pillar-grid">
          {pillarTopics.map((topic) => (
            <a className="seo-pillar-card" href={topic.href} key={topic.title}>
              <span>{topic.badge}</span>
              <h3>{topic.title}</h3>
              <p>{topic.intent}</p>
              <div>
                {topic.keywords.map((keyword) => (
                  <em key={keyword}>{keyword}</em>
                ))}
              </div>
              <strong>Lire / démarrer →</strong>
            </a>
          ))}
        </div>

        <div className="seo-question-strip">
          <div>
            <span className="seo-pillar-eyebrow">Intentions Google</span>
            <strong>Questions qui doivent convertir</strong>
          </div>
          <div className="seo-question-list">
            {searchQuestions.map((question) => (
              <a href={`/contact?source=seo_question&intent=${encodeURIComponent(question)}`} key={question}>
                {question}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
