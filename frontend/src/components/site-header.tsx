"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { ActionLink } from "@/components/action-link";
import { clearStoredSession, readStoredSession } from "@/lib/auth";

const campusFranceItems = {
  groups: [
    {
      label: "Admission",
      items: [
        { icon: "🎓", label: "Parcoursup", sub: "Universités françaises", href: "/parcoursup" },
        { icon: "🔬", label: "Paris-Saclay", sub: "Grandes écoles & recherche", href: "/paris-saclay" },
        { icon: "🏫", label: "Écoles privées", sub: "Business, Design, Ingénierie", href: "/ecoles" },
      ],
    },
    {
      label: "Visa",
      items: [
        { icon: "🇫🇷", label: "Visa étudiant France", sub: "Campus France & Ambassade", href: "/visa" },
      ],
    },
  ],
};

const campusBelgiqueItems = {
  groups: [
    {
      label: "Admission",
      items: [
        { icon: "🎓", label: "Universités belges", sub: "ULB, UCLouvain, ULiège...", href: "/belgique" },
        { icon: "🏫", label: "Hautes écoles", sub: "BTS, Bachelor professionnalisant", href: "/belgique#hautes-ecoles" },
      ],
    },
    {
      label: "Visa",
      items: [
        { icon: "🇧🇪", label: "Visa étudiant Belgique", sub: "Titre de séjour & démarches", href: "/belgique#visa" },
      ],
    },
  ],
};

const ressourcesItems = [
  { icon: "❓", label: "FAQ", sub: "Questions fréquentes", href: "/faq" },
  { icon: "💳", label: "Paiement", sub: "Régler votre accompagnement", href: "/paiement" },
  { icon: "🏢", label: "À propos", sub: "Notre équipe et mission", href: "/about" },
  { icon: "✉️", label: "Contact", sub: "Nous écrire directement", href: "/contact" },
];

type DropdownKey = "campus-france" | "belgique" | "ressources" | "procedure" | null;

export function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [sessionRole, setSessionRole] = useState<"student" | "admin" | null>(null);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function syncSession() {
      const session = readStoredSession();
      setSessionRole(session?.user.role ?? null);
    }
    syncSession();
    window.addEventListener("pieagency-auth-changed", syncSession);
    window.addEventListener("storage", syncSession);
    return () => {
      window.removeEventListener("pieagency-auth-changed", syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenDropdown(null); };
    const onClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".nav-dropdown-wrap")) setOpenDropdown(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick, { capture: true });
    };
  }, []);

  function openMenu(key: DropdownKey) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenDropdown(key);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 120);
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  const accountHref = sessionRole === "admin" ? "/admin" : "/espace-etudiant";
  const accountLabel = sessionRole === "admin" ? "Admin" : sessionRole === "student" ? "Mon espace" : "Connexion";

  function handleLogout() {
    clearStoredSession();
    setIsMenuOpen(false);
  }

  const headerClassName = [isScrolled ? "scrolled" : "", isAdminRoute ? "header-admin" : ""].filter(Boolean).join(" ");

  return (
    <>
      <header className={headerClassName}>
        <div className={`header-inner ${isAdminRoute ? "is-admin" : ""}`}>
          <div className="header-left">
            <button
              aria-expanded={isMenuOpen}
              aria-label="Menu"
              className={`hamburger ${isMenuOpen ? "open" : ""}`}
              onClick={() => setIsMenuOpen((v) => !v)}
              type="button"
            >
              <span /><span /><span />
            </button>
            <Link className="logo" href="/">
              <Image alt="PieAgency" className="brand-image" height={40} priority src="/pieagency-logo.jpg" width={40} />
              <span className="logo-wordmark">Pie<span className="logo-wordmark-accent">Agency</span></span>
              {isAdminRoute ? <span className="logo-context-chip">Admin</span> : null}
            </Link>
          </div>

          {!isAdminRoute && (
            <nav aria-label="Navigation principale" className="site-header-nav">
              <Link className={`nav-link ${isActive("/") ? "active" : ""}`} href="/">Accueil</Link>

              {/* Campus France */}
              <div
                className={`nav-dropdown-wrap ${openDropdown === "campus-france" ? "open" : ""}`}
                onMouseEnter={() => openMenu("campus-france")}
                onMouseLeave={scheduleClose}
              >
                <button
                  className={`nav-link nav-dropdown-trigger ${["/campus-france", "/parcoursup", "/paris-saclay", "/ecoles", "/visa"].some(isActive) ? "active" : ""}`}
                  onClick={() => setOpenDropdown(openDropdown === "campus-france" ? null : "campus-france")}
                  type="button"
                >
                  Campus France
                  <svg className="nav-chevron" viewBox="0 0 12 8" fill="none" width="10" height="10">
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="nav-dropdown nav-dropdown-grouped" onMouseEnter={() => openMenu("campus-france")} onMouseLeave={scheduleClose}>
                  {campusFranceItems.groups.map((group) => (
                    <div className="nav-dropdown-group" key={group.label}>
                      <div className="nav-dropdown-group-label">{group.label}</div>
                      {group.items.map((item) => (
                        <Link className="nav-dropdown-item" href={item.href} key={item.href} onClick={() => setOpenDropdown(null)}>
                          <span className="nav-dropdown-icon">{item.icon}</span>
                          <span>
                            <span className="nav-dropdown-item-title">{item.label}</span>
                            <span className="nav-dropdown-item-sub">{item.sub}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Campus Belgique */}
              <div
                className={`nav-dropdown-wrap ${openDropdown === "belgique" ? "open" : ""}`}
                onMouseEnter={() => openMenu("belgique")}
                onMouseLeave={scheduleClose}
              >
                <button
                  className={`nav-link nav-dropdown-trigger ${isActive("/belgique") ? "active" : ""}`}
                  onClick={() => setOpenDropdown(openDropdown === "belgique" ? null : "belgique")}
                  type="button"
                >
                  Campus Belgique
                  <svg className="nav-chevron" viewBox="0 0 12 8" fill="none" width="10" height="10">
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="nav-dropdown nav-dropdown-grouped" onMouseEnter={() => openMenu("belgique")} onMouseLeave={scheduleClose}>
                  {campusBelgiqueItems.groups.map((group) => (
                    <div className="nav-dropdown-group" key={group.label}>
                      <div className="nav-dropdown-group-label">{group.label}</div>
                      {group.items.map((item) => (
                        <Link className="nav-dropdown-item" href={item.href} key={item.href} onClick={() => setOpenDropdown(null)}>
                          <span className="nav-dropdown-icon">{item.icon}</span>
                          <span>
                            <span className="nav-dropdown-item-title">{item.label}</span>
                            <span className="nav-dropdown-item-sub">{item.sub}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <Link className={`nav-link ${isActive("/communaute") ? "active" : ""}`} href="/communaute">Communauté</Link>

              {/* Ressources */}
              <div
                className={`nav-dropdown-wrap ${openDropdown === "ressources" ? "open" : ""}`}
                onMouseEnter={() => openMenu("ressources")}
                onMouseLeave={scheduleClose}
              >
                <button
                  className={`nav-link nav-dropdown-trigger ${["/faq", "/paiement", "/about", "/contact"].some(isActive) ? "active" : ""}`}
                  onClick={() => setOpenDropdown(openDropdown === "ressources" ? null : "ressources")}
                  type="button"
                >
                  Ressources
                  <svg className="nav-chevron" viewBox="0 0 12 8" fill="none" width="10" height="10">
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="nav-dropdown" onMouseEnter={() => openMenu("ressources")} onMouseLeave={scheduleClose}>
                  {ressourcesItems.map((item) => (
                    <Link className="nav-dropdown-item" href={item.href} key={item.href} onClick={() => setOpenDropdown(null)}>
                      <span className="nav-dropdown-icon">{item.icon}</span>
                      <span>
                        <span className="nav-dropdown-item-title">{item.label}</span>
                        <span className="nav-dropdown-item-sub">{item.sub}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          )}

          <div className={`header-ctas ${isAdminRoute ? "is-admin" : ""}`}>
            {isAdminRoute ? (
              <>
                <ActionLink href="/" variant="outline" size="sm" className="header-admin-link">Voir le site</ActionLink>
                <ActionLink href="/partenariat" variant="gold" size="sm">Partenariat</ActionLink>
                <button className="btn btn-outline btn-sm" onClick={handleLogout} type="button">Déconnexion</button>
              </>
            ) : sessionRole ? (
              <div className="header-account">
                <button className="btn btn-outline btn-sm header-account-trigger" type="button">
                  {accountLabel}
                  <span className="header-account-arrow">▾</span>
                </button>
                <div className="header-account-menu">
                  <Link className="header-account-link" href={accountHref}>
                    {sessionRole === "admin" ? "Accéder à l'admin" : "Ouvrir mon espace"}
                  </Link>
                  <button className="header-account-link header-account-action" onClick={handleLogout} type="button">
                    Déconnexion
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="header-user-wrap">
                  <button className="header-user-icon" type="button" aria-label="Compte">
                    <User size={20} strokeWidth={1.8} />
                  </button>
                  <div className="header-user-dropdown">
                    <Link className="header-user-item" href="/connexion">Connexion</Link>
                    <Link className="header-user-item" href="/inscription">Inscription</Link>
                    <button className="header-user-item header-user-item--action" onClick={handleLogout} type="button">Déconnexion</button>
                  </div>
                </div>
                <ActionLink href="/partenariat" variant="gold" size="sm">Partenariat</ActionLink>
                <div
                  className={`nav-dropdown-wrap header-procedure-wrap ${openDropdown === "procedure" ? "open" : ""}`}
                  onMouseEnter={() => openMenu("procedure")}
                  onMouseLeave={scheduleClose}
                >
                  <button
                    className={`btn btn-primary btn-sm header-procedure-trigger ${["/contact", "/espace-etudiant"].some(isActive) ? "active" : ""}`}
                    onClick={() => setOpenDropdown(openDropdown === "procedure" ? null : "procedure")}
                    type="button"
                  >
                    Ma procédure
                    <svg className="nav-chevron" viewBox="0 0 12 8" fill="none" width="10" height="10">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className="nav-dropdown header-procedure-dropdown" onMouseEnter={() => openMenu("procedure")} onMouseLeave={scheduleClose}>
                    <Link className="nav-dropdown-item" href="/espace-etudiant/produits" onClick={() => setOpenDropdown(null)}>
                      <span className="nav-dropdown-icon">📚</span>
                      <span>
                        <span className="nav-dropdown-item-title">Espace candidat / Produits</span>
                        <span className="nav-dropdown-item-sub">Accéder aux outils privés</span>
                      </span>
                    </Link>
                    <Link className="nav-dropdown-item" href="/contact" onClick={() => setOpenDropdown(null)}>
                      <span className="nav-dropdown-icon">📝</span>
                      <span>
                        <span className="nav-dropdown-item-title">Commencer mon dossier</span>
                        <span className="nav-dropdown-item-sub">Lancer votre accompagnement</span>
                      </span>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <button aria-label="Fermer le menu" className="mobile-menu-backdrop" onClick={() => setIsMenuOpen(false)} type="button" />
      )}

      <div className={`mobile-menu ${isMenuOpen ? "open" : ""}`}>
        <div className="mobile-menu-panel">
          <div className="mobile-menu-head">
            <div>
              <div className="mobile-menu-kicker">Navigation</div>
              <div className="mobile-menu-title">PieAgency</div>
            </div>
            <button aria-label="Fermer le menu" className="mobile-menu-close" onClick={() => setIsMenuOpen(false)} type="button">✕</button>
          </div>

          <Link className={`mobile-nav-link ${isActive("/") ? "active" : ""}`} href="/" onClick={() => setIsMenuOpen(false)}>Accueil</Link>

          {/* Campus France mobile */}
          <div className="mobile-nav-group">
            <button
              className={`mobile-nav-link mobile-nav-expander ${mobileExpanded === "campus-france" ? "expanded" : ""}`}
              onClick={() => setMobileExpanded(mobileExpanded === "campus-france" ? null : "campus-france")}
              type="button"
            >
              Campus France
              <svg className="mobile-nav-chevron" viewBox="0 0 12 8" fill="none" width="10" height="10">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {mobileExpanded === "campus-france" && (
              <div className="mobile-nav-sub">
                {campusFranceItems.groups.map((group) => (
                  <div key={group.label}>
                    <div className="mobile-nav-sub-label">{group.label}</div>
                    {group.items.map((item) => (
                      <Link className="mobile-nav-sub-link" href={item.href} key={item.href} onClick={() => setIsMenuOpen(false)}>
                        {item.icon} {item.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Campus Belgique mobile */}
          <div className="mobile-nav-group">
            <button
              className={`mobile-nav-link mobile-nav-expander ${mobileExpanded === "belgique" ? "expanded" : ""}`}
              onClick={() => setMobileExpanded(mobileExpanded === "belgique" ? null : "belgique")}
              type="button"
            >
              Campus Belgique
              <svg className="mobile-nav-chevron" viewBox="0 0 12 8" fill="none" width="10" height="10">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {mobileExpanded === "belgique" && (
              <div className="mobile-nav-sub">
                {campusBelgiqueItems.groups.map((group) => (
                  <div key={group.label}>
                    <div className="mobile-nav-sub-label">{group.label}</div>
                    {group.items.map((item) => (
                      <Link className="mobile-nav-sub-link" href={item.href} key={item.href} onClick={() => setIsMenuOpen(false)}>
                        {item.icon} {item.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link className={`mobile-nav-link ${isActive("/communaute") ? "active" : ""}`} href="/communaute" onClick={() => setIsMenuOpen(false)}>Communauté</Link>

          {/* Ressources mobile */}
          <div className="mobile-nav-group">
            <button
              className={`mobile-nav-link mobile-nav-expander ${mobileExpanded === "ressources" ? "expanded" : ""}`}
              onClick={() => setMobileExpanded(mobileExpanded === "ressources" ? null : "ressources")}
              type="button"
            >
              Ressources
              <svg className="mobile-nav-chevron" viewBox="0 0 12 8" fill="none" width="10" height="10">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {mobileExpanded === "ressources" && (
              <div className="mobile-nav-sub">
                {ressourcesItems.map((item) => (
                  <Link className="mobile-nav-sub-link" href={item.href} key={item.href} onClick={() => setIsMenuOpen(false)}>
                    {item.icon} {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mobile-ctas">
            <ActionLink href={sessionRole ? accountHref : "/connexion"} onClick={() => setIsMenuOpen(false)} variant="outline">
              {accountLabel}
            </ActionLink>
            <ActionLink href="/partenariat" onClick={() => setIsMenuOpen(false)} variant="gold">Partenariat</ActionLink>
            {sessionRole && (
              <button className="btn btn-outline" onClick={handleLogout} type="button">Déconnexion</button>
            )}
            <ActionLink href="/espace-etudiant/produits" onClick={() => setIsMenuOpen(false)} variant="outline">
              Espace candidat / Produits
            </ActionLink>
            <ActionLink href="/contact" onClick={() => setIsMenuOpen(false)} variant="primary">
              Commencer mon dossier
            </ActionLink>
          </div>
        </div>
      </div>
    </>
  );
}
