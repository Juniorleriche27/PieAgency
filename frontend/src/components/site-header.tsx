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

  return (
    <>
      <header className={isScrolled ? "scrolled" : ""}>
        <div className="header-inner">
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
          </Link>

          <nav aria-label="Navigation principale">
            {navigation.map((item) => (
              <Link
                className={`nav-link ${isActive(item.href) ? "active" : ""}`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header-ctas">
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
          </div>

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
        </div>
      </header>

      <div className={`mobile-menu ${isMenuOpen ? "open" : ""}`}>
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
          <ActionLink
            href={sessionRole ? accountHref : "/connexion"}
            onClick={() => setIsMenuOpen(false)}
            variant="outline"
          >
            {accountLabel}
          </ActionLink>
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
            Commencer mon dossier
          </ActionLink>
        </div>
      </div>
    </>
  );
}
