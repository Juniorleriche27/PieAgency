import { ActionLink } from "@/components/action-link";
import { homeTestimonials } from "@/content/site";

const proofMetrics = [
  { value: "+350", label: "dossiers accompagnés", detail: "Campus France, visa, Belgique et autres parcours." },
  { value: "+20", label: "pays représentés", detail: "Une expérience utile pour plusieurs profils africains." },
  { value: "4", label: "étapes critiques", detail: "Diagnostic, documents, entretien, suivi final." },
];

const studentCases = [
  {
    tag: "Campus France",
    title: "Dossier accepté après restructuration du projet",
    before: "Projet trop général, choix de formations peu cohérent et lettre peu personnalisée.",
    after: "Projet clarifié, liste de formations réalignée et argumentaire renforcé avant soumission.",
    result: "Admission obtenue sur un parcours cohérent.",
  },
  {
    tag: "Visa étudiant",
    title: "Dossier visa sécurisé avant dépôt",
    before: "Pièces financières dispersées, justification du projet faible, stress avant rendez-vous.",
    after: "Checklist complète, preuves classées, préparation aux questions sensibles.",
    result: "Dépôt plus propre et étudiant plus confiant.",
  },
  {
    tag: "Belgique",
    title: "Orientation simplifiée pour une procédure inconnue",
    before: "L’étudiant ne savait pas quelle école viser ni quel ordre suivre.",
    after: "Plan d’action, documents prioritaires et calendrier de candidature posés.",
    result: "Procédure lancée sans blocage initial.",
  },
];

const trustChecks = [
  "Diagnostic avant recommandation d’offre",
  "Documents relus avec logique de procédure",
  "Préparation aux entretiens et questions sensibles",
  "Suivi dans l’espace étudiant quand le dossier démarre",
];

export function SocialProofShowcase() {
  const featured = homeTestimonials.slice(0, 3);

  return (
    <section className="section social-proof-section">
      <div className="container">
        <div className="social-proof-hero">
          <div>
            <span className="social-proof-eyebrow">Preuve sociale</span>
            <h2>Des étudiants ne cherchent pas seulement une information. Ils cherchent une méthode qui rassure.</h2>
            <p>
              PieAgency renforce la confiance avec des retours d’expérience, des cas anonymisés
              et une méthode lisible avant toute décision d’accompagnement.
            </p>
          </div>
          <div className="social-proof-scorecard">
            <strong>Confiance</strong>
            <span>Diagnostic → dossier → suivi</span>
            <ActionLink href="/contact?source=social_proof&intent=diagnostic" variant="gold">
              Vérifier mon profil
            </ActionLink>
          </div>
        </div>

        <div className="social-proof-metrics">
          {proofMetrics.map((metric) => (
            <div className="social-proof-metric" key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
              <p>{metric.detail}</p>
            </div>
          ))}
        </div>

        <div className="student-case-grid">
          {studentCases.map((item) => (
            <article className="student-case-card" key={item.title}>
              <span>{item.tag}</span>
              <h3>{item.title}</h3>
              <div className="student-case-compare">
                <div>
                  <small>Avant</small>
                  <p>{item.before}</p>
                </div>
                <div>
                  <small>Après PieAgency</small>
                  <p>{item.after}</p>
                </div>
              </div>
              <strong className="student-case-result">{item.result}</strong>
            </article>
          ))}
        </div>

        <div className="social-proof-bottom-grid">
          <div className="social-proof-reviews">
            {featured.map((item) => (
              <div className="social-proof-review" key={item.name}>
                <p>“{item.quote}”</p>
                <div>
                  <span style={{ background: item.color }}>{item.initials}</span>
                  <strong>{item.name}</strong>
                  <small>{item.origin} → {item.destination} · {item.program}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="social-proof-method-card">
            <span className="social-proof-eyebrow">Pourquoi ça rassure</span>
            <h3>La preuve n’est pas seulement dans les avis. Elle est dans la méthode.</h3>
            <div className="social-proof-checks">
              {trustChecks.map((check) => (
                <div key={check}>✓ {check}</div>
              ))}
            </div>
            <div className="social-proof-actions">
              <ActionLink href="/contact?source=proof_method&intent=diagnostic" variant="primary">
                Demander un diagnostic
              </ActionLink>
              <ActionLink href="/communaute" variant="outline">
                Voir PieHUB
              </ActionLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
