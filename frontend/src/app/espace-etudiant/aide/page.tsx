import Link from "next/link";
import { HelpCircle, Mail, MessageCircle, ShieldCheck } from "lucide-react";

export const metadata = { title: "Aide | Espace étudiant — PieAgency" };

export default function StudentHelpPage() {
  return <div className="private-help-page">
    <header><HelpCircle size={30} /><div><h1>Centre d’aide</h1><p>Choisissez le canal adapté à votre besoin.</p></div></header>
    <div className="private-help-grid">
      <Link href="/espace-etudiant/assistant"><MessageCircle size={24} /><strong>Assistant dossier</strong><span>Questions sur votre procédure et vos prochaines étapes.</span></Link>
      <Link href="/communaute"><ShieldCheck size={24} /><strong>Communauté PieHUB</strong><span>Échanger avec les étudiants et consulter les réponses utiles.</span></Link>
      <Link href="/contact"><Mail size={24} /><strong>Contacter PieAgency</strong><span>Demande personnelle, document sensible ou accompagnement.</span></Link>
    </div>
    <section className="private-help-emergency"><strong>Un problème technique ?</strong><p>Précisez la page, l’action effectuée et le message affiché. Ne transmettez jamais votre mot de passe.</p><Link className="btn btn-primary" href="/contact">Signaler le problème</Link></section>
  </div>;
}
