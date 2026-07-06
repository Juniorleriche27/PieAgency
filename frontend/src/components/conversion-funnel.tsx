import { ActionLink } from "@/components/action-link";

const funnelSteps = [
  {
    number: "01",
    title: "Diagnostic",
    text: "On comprend votre profil, votre pays, vos délais et vos risques avant de parler de paiement.",
  },
  {
    number: "02",
    title: "Espace étudiant",
    text: "Vous créez votre accès pour suivre vos étapes, vos documents et les consignes PieAgency.",
  },
  {
    number: "03",
    title: "Plan d’action",
    text: "Un conseiller vous indique le bon parcours : Campus France, Visa, Belgique ou autre voie.",
  },
  {
    number: "04",
    title: "Accompagnement",
    text: "Vous démarrez avec un paiement sécurisé, puis le suivi devient organisé et mesurable.",
  },
];

export function ConversionFunnel() {
  return (
    <section className="section conversion-funnel-section">
      <div className="container">
        <div className="conversion-funnel-hero">
          <div>
            <span className="conversion-eyebrow">Tunnel clair</span>
            <h2>Du premier message au dossier suivi, chaque étape pousse vers l’action utile.</h2>
            <p>
              PieAgency ne laisse pas l’étudiant hésiter. Le parcours guide vers un diagnostic,
              une inscription, un espace privé, puis un accompagnement adapté.
            </p>
          </div>
          <div className="conversion-funnel-ctas">
            <ActionLink href="/contact?source=funnel&intent=diagnostic" variant="gold" size="lg">
              Faire mon diagnostic
            </ActionLink>
            <ActionLink href="/connexion?mode=sign-up&next=/espace-etudiant/diagnostic" variant="outlineWhite" size="lg">
              Créer mon espace
            </ActionLink>
          </div>
        </div>

        <div className="conversion-step-grid">
          {funnelSteps.map((step) => (
            <div className="conversion-step-card" key={step.number}>
              <span>{step.number}</span>
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </div>
          ))}
        </div>

        <div className="conversion-proof-strip">
          <div>
            <strong>Prochaine action recommandée</strong>
            <span>Remplir le formulaire de contact ou créer son espace étudiant.</span>
          </div>
          <ActionLink href="/contact?source=funnel_bottom&intent=diagnostic" variant="primary">
            Commencer maintenant
          </ActionLink>
        </div>
      </div>
    </section>
  );
}

export function ContactConversionAside() {
  return (
    <div className="contact-conversion-aside">
      <span className="conversion-eyebrow">Avant d’envoyer</span>
      <h2>Votre demande doit devenir un plan clair.</h2>
      <p>
        Plus votre diagnostic est précis, plus le conseiller peut vous orienter vite vers la bonne procédure.
      </p>
      <div className="contact-conversion-list">
        <div><strong>1</strong><span>Votre profil et votre pays</span></div>
        <div><strong>2</strong><span>Votre objectif d’étude</span></div>
        <div><strong>3</strong><span>Vos délais et blocages</span></div>
        <div><strong>4</strong><span>L’accompagnement recommandé</span></div>
      </div>
      <ActionLink href="/connexion?mode=sign-up&next=/espace-etudiant/diagnostic" variant="outline">
        Préparer aussi mon espace
      </ActionLink>
    </div>
  );
}
