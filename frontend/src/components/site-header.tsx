"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ActionLink } from "@/components/action-link";
import { company, navigation } from "@/content/site";
import { clearStoredSession, readStoredSession } from "@/lib/auth";

export function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [sessionRole, setSessionRole] = useState<"student" | "admin" | null>(null);
  const isAdminRoute = pathname.startsWith("/admin");
  const primaryNavigation = navigation.filter((item) =>
    ["/", "/campus-france", "/visa", "/belgique", "/communaute"].includes(item.href),
  );
  const secondaryNavigation = navigation.filter(
    (item) => !primaryNavigation.some((entry) => entry.href === item.href),
  );

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
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname === href;
  }

  const accountHref = sessionRole === "admin" ? "/admin" : "/espace-etudiant";
  const accountLabel =
    sessionRole === "admin"
      ? "Admin"
      : sessionRole === "student"
        ? "Mon espace"
        : "Connexion";

  function handleLogout() {
    clearStoredSession();
    setIsMenuOpen(false);
  }

  const headerClassName = [isScrolled ? "scrolled" : "", isAdminRoute ? "header-admin" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <header className={headerClassName}>
        <div className={`header-inner ${isAdminRoute ? "is-admin" : ""}`}>
          <button
            aria-expanded={isMenuOpen}
            aria-label="Menu"
            className={`hamburger ${isMenuOpen ? "open" : ""}`}
            onClick={() => setIsMenuOpen((current) => !current)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>

          <Link className="logo" href="/">
            <Image
              alt="PieAgency"
              className="brand-image"
              height={40}
              priority
              src="/pieagency-logo.jpg"
              width={40}
            />
            <span className="logo-wordmark">
              Pie<span className="logo-wordmark-accent">Agency</span>
            </span>
            {isAdminRoute ? <span className="logo-context-chip">Admin</span> : null}
          </Link>

          <nav aria-label="Navigation principale" className={isAdminRoute ? "header-nav-admin" : ""}>
            {primaryNavigation.map((item) => (
              <Link
                className={`nav-link ${isActive(item.href) ? "active" : ""}`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
            {secondaryNavigation.length ? (
              <div className={`nav-more ${secondaryNavigation.some((item) => isActive(item.href)) ? "active" : ""}`}>
                <button
                  aria-expanded={secondaryNavigation.some((item) => isActive(item.href))}
                  className="nav-link nav-more-trigger"
                  type="button"
                >
                  More
                  <span className="nav-more-arrow">+</span>
                </button>
                <div className="nav-more-menu">
                  {secondaryNavigation.map((item) => (
                    <Link
                      className={`nav-more-link ${isActive(item.href) ? "active" : ""}`}
                      href={item.href}
                      key={item.href}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </nav>

          <div className={`header-ctas ${isAdminRoute ? "is-admin" : ""}`}>
            {isAdminRoute ? (
              <>
                <ActionLink href="/" variant="outline" size="sm" className="header-admin-link">
                  Voir le site
                </ActionLink>
                <ActionLink href="/partenariat" variant="gold" size="sm">
                  Partenariat
                </ActionLink>
                <button className="btn btn-outline btn-sm" onClick={handleLogout} type="button">
                  Deconnexion
                </button>
              </>
            ) : (
              <>
                <ActionLink href={sessionRole ? accountHref : "/connexion"} variant="outline" size="sm">
                  {accountLabel}
                </ActionLink>
                <ActionLink href="/partenariat" variant="gold" size="sm">
                  Partenariat
                </ActionLink>
                {sessionRole ? (
                  <button className="btn btn-outline btn-sm" onClick={handleLogout} type="button">
                    Deconnexion
                  </button>
                ) : null}
                <ActionLink href="/contact" variant="primary" size="sm">
                  Commencer mon dossier
                </ActionLink>
              </>
            )}
          </div>
        </div>
      </header>

      {isMenuOpen ? (
        <button
          aria-label="Fermer le menu"
          className="mobile-menu-backdrop"
          onClick={() => setIsMenuOpen(false)}
          type="button"
        />
      ) : null}

      <div className={`mobile-menu ${isMenuOpen ? "open" : ""}`}>
        <div className="mobile-menu-panel">
          <div className="mobile-menu-head">
            <div>
              <div className="mobile-menu-kicker">Navigation</div>
              <div className="mobile-menu-title">PieAgency</div>
            </div>
            <button
              aria-label="Fermer le menu"
              className="mobile-menu-close"
              onClick={() => setIsMenuOpen(false)}
              type="button"
            >
              X
            </button>
          </div>

          {navigation.map((item) => (
            <Link
              className={`mobile-nav-link ${isActive(item.href) ? "active" : ""}`}
              href={item.href}
              key={item.href}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          <div className="mobile-ctas">
            {isAdminRoute ? (
              <ActionLink href="/" onClick={() => setIsMenuOpen(false)} variant="outline">
                Voir le site
              </ActionLink>
            ) : (
              <ActionLink
                href={sessionRole ? accountHref : "/connexion"}
                onClick={() => setIsMenuOpen(false)}
                variant="outline"
              >
                {accountLabel}
              </ActionLink>
            )}
            <ActionLink
              href="/partenariat"
              onClick={() => setIsMenuOpen(false)}
              variant="gold"
            >
              Partenariat
            </ActionLink>
            {sessionRole ? (
              <button className="btn btn-outline" onClick={handleLogout} type="button">
                Deconnexion
              </button>
            ) : null}
            <ActionLink
              href={company.contacts.togo.whatsappHref}
              onClick={() => setIsMenuOpen(false)}
              variant="waTogo"
              external
            >
              WhatsApp Togo
            </ActionLink>
            <ActionLink
              href={company.contacts.france.whatsappHref}
              onClick={() => setIsMenuOpen(false)}
              variant="waFrance"
              external
            >
              WhatsApp France
            </ActionLink>
            <ActionLink
              href="/contact"
              onClick={() => setIsMenuOpen(false)}
              variant="primary"
            >
              {isAdminRoute ? "Formulaire contact" : "Commencer mon dossier"}
            </ActionLink>
          </div>
        </div>
      </div>
    </>
  );
}
