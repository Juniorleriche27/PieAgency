import Image from "next/image";
import Link from "next/link";
import { ActionLink } from "@/components/action-link";
import { company, navigation } from "@/content/site";

export function SiteFooter() {
  const visibleCommunityLinks = company.communityLinks;

  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">
              <Image
                alt="PieAgency"
                className="brand-image"
                height={42}
                src="/pieagency-logo.jpg"
                width={42}
              />
              <span className="footer-wordmark">
                Pie<span className="footer-wordmark-accent">Agency</span>
              </span>
            </div>
            <p className="footer-desc">{company.tagline}</p>
            <div className="footer-actions">
              <ActionLink href="/contact" variant="primary" size="sm">
                Formulaire
              </ActionLink>
              <ActionLink href="/faq" variant="outline" size="sm">
                FAQ
              </ActionLink>
            </div>
            <div className="community-stack mt-16">
              <Link className="footer-link" href="/connexion">
                Connexion plateforme
              </Link>
              <Link className="footer-link" href="/espace-etudiant">
                Espace etudiant
              </Link>
              <Link className="footer-link" href="/partenariat">
                Partenariat
              </Link>
              <Link className="footer-link" href="/admin">
                Interface admin
              </Link>
            </div>
          </div>

          <div className="footer-col">
            <h4>Navigation</h4>
            {navigation.map((item) => (
              <Link className="footer-link" href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="footer-col">
            <h4>Contacts</h4>
            <a className="footer-link" href={`mailto:${company.emails.primary}`}>
              {company.emails.primary}
            </a>
            <a className="footer-link" href={`mailto:${company.emails.secondary}`}>
              {company.emails.secondary}
            </a>
            <a className="footer-link" href={company.contacts.france.phoneHref}>
              {company.contacts.france.person} - {company.contacts.france.phoneDisplay}
            </a>
            <a className="footer-link" href={company.contacts.togo.phoneHref}>
              {company.contacts.togo.person} - {company.contacts.togo.phoneDisplay}
            </a>
          </div>

          <div className="footer-col">
            <h4>Communaute</h4>
            {visibleCommunityLinks.map((community) => (
              <a
                className="footer-link"
                href={community.href}
                key={community.href}
                rel="noreferrer"
                target="_blank"
              >
                {community.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">PieAgency - Tous droits reserves</div>
      </div>
    </footer>
  );
}
