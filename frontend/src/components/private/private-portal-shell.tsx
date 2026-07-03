"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  CreditCard,
  FileText,
  Globe2,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Milestone,
  Moon,
  Package,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  X,
  Zap,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PortalAccessPanel } from "@/components/portal-access-panel";
import { useAuthSession } from "@/hooks/use-auth-session";
import { clearStoredSession, getApiBaseUrl, type PlatformRole } from "@/lib/auth";
import { fetchOnboardingStatus, type OnboardingStatus } from "@/lib/private-onboarding";

const ONBOARDING_ALLOWED_PATHS = [
  "/espace-etudiant/onboarding",
  "/espace-etudiant/documents",
];

type PrivatePortalShellProps = {
  children: ReactNode;
  requiredRole: PlatformRole;
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
};

const studentNav: NavItem[] = [
  { href: "/espace-etudiant/onboarding", label: "Embarquement", icon: Zap },
  { href: "/espace-etudiant", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/espace-etudiant/parcours-guide", label: "Mon parcours guidé", icon: Milestone },
  { href: "/espace-etudiant/diagnostic", label: "Diagnostic", icon: ShieldCheck },
  { href: "/espace-etudiant/documents", label: "Mes documents", icon: FileText },
  { href: "/espace-etudiant/ressources", label: "Mes ressources", icon: BookOpen },
  { href: "/espace-etudiant/produits", label: "Produits digitaux", icon: Package },
  { href: "/espace-etudiant/assistant", label: "Assistant dossier", icon: MessageCircle },
  { href: "/espace-etudiant/abonnement", label: "Abonnement", icon: CreditCard },
  { href: "/communaute", label: "Communauté", icon: Users },
  { href: "/espace-etudiant/aide", label: "Aide", icon: HelpCircle },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Pilotage", icon: LayoutDashboard },
  { href: "/admin/candidats", label: "Candidats", icon: Users },
  { href: "/admin/produits", label: "Produits", icon: Package },
  { href: "/admin/ressources", label: "Ressources", icon: BookOpen },
  { href: "/admin/abonnements", label: "Abonnements", icon: CreditCard },
  { href: "/admin/paiements", label: "Paiements", icon: FileText },
  { href: "/admin/statistiques", label: "Statistiques", icon: Settings },
  { href: "/partenariat", label: "Formulaire partenariat", icon: Globe2 },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin" || href === "/espace-etudiant") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PrivatePortalShell({
  children,
  requiredRole,
}: PrivatePortalShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const { session, isReady } = useAuthSession(apiBaseUrl);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>(null);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("pie-theme") === "dark",
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  function toggleDark() {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("pie-theme", next ? "dark" : "light");
      return next;
    });
  }

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    function onScroll() {
      setIsScrolled((el?.scrollTop ?? 0) > 12);
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let active = true;
    if (!isReady || !session || requiredRole !== "student" || session.user.role === "admin") {
      window.setTimeout(() => {
        if (active) setOnboardingChecked(true);
      }, 0);
      return () => {
        active = false;
      };
    }
    // Always ask the backend. The stored auth session can be stale after signup
    // or account switching, while onboarding gates must reflect the database.
    // On failure it returns not_started, so a
    // new/unverified candidate is never allowed into the dashboard by default.
    void fetchOnboardingStatus().then((status) => {
      if (!active) return;
      setOnboardingStatus(status);
      setOnboardingChecked(true);
    });
    return () => {
      active = false;
    };
  }, [isReady, session, requiredRole]);

  // Gate: redirect student to onboarding if not validated.
  useEffect(() => {
    if (!onboardingChecked) return;
    if (requiredRole !== "student") return;
    if (session?.user.role === "admin") return;
    if (onboardingStatus === null) return; // backend not ready yet — don't block
    if (onboardingStatus === "validated") return;
    if (ONBOARDING_ALLOWED_PATHS.some((p) => pathname.startsWith(p))) return;
    router.replace("/espace-etudiant/onboarding");
  }, [onboardingChecked, onboardingStatus, pathname, requiredRole, router, session?.user.role]);

  const isGated =
    requiredRole === "student" &&
    session?.user.role !== "admin" &&
    onboardingStatus !== null &&
    onboardingStatus !== "validated";

  const navItems = requiredRole === "admin" ? adminNav : studentNav;
  const title = requiredRole === "admin" ? "Admin PieAgency" : "Espace candidat";
  const oppositeHref = requiredRole === "admin" ? "/espace-etudiant" : "/admin";
  const canAccess =
    session?.user.role === requiredRole ||
    (session?.user.role === "admin" && requiredRole === "student");
  const quickLinks: NavItem[] = session?.user.role === "admin"
    ? [
        { href: "/", label: "Site public", icon: Globe2 },
        requiredRole === "admin"
          ? { href: "/espace-etudiant", label: "Espace candidat", icon: LayoutDashboard }
          : { href: "/admin", label: "Admin", icon: Settings },
      ]
    : [{ href: "/", label: "Site public", icon: Globe2 }];

  function handleLogout() {
    clearStoredSession();
    router.push(`/connexion?next=${encodeURIComponent(pathname)}`);
  }

  if (!isReady) {
    return (
      <div className="private-loading">
        <div className="portal-access-card">
          <div className="portal-card-kicker">Authentification</div>
          <h2>Verification de la session</h2>
          <p>Chargement de votre acces PieAgency...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <PortalAccessPanel
        description="Connectez-vous pour acceder a cette partie privee de la plateforme."
        kicker="Connexion requise"
        primaryHref={`/connexion?next=${encodeURIComponent(pathname)}`}
        primaryLabel="Se connecter"
        secondaryHref="/"
        secondaryLabel="Retour au site"
        title="Acces protege"
      />
    );
  }

  if (requiredRole === "student" && !onboardingChecked) {
    return (
      <div className="private-loading">
        <div className="portal-access-card">
          <div className="portal-card-kicker">Embarquement</div>
          <h2>Verification de votre dossier</h2>
          <p>Nous verifions si votre embarquement est deja valide.</p>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <PortalAccessPanel
        description="Votre compte est actif, mais il ne correspond pas au role attendu pour cette zone."
        kicker="Role incompatible"
        primaryHref={oppositeHref}
        primaryLabel={requiredRole === "admin" ? "Ouvrir mon espace" : "Ouvrir l'admin"}
        secondaryHref="/connexion"
        secondaryLabel="Changer de compte"
        title="Acces refuse"
      />
    );
  }

  return (
    <div className="private-app-shell" data-theme={isDark ? "dark" : "light"}>
      <aside className={`private-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="private-sidebar-head">
          <Link className="private-brand" href="/">
            <div className="private-brand-avatar">
              <Image
                alt="PieAgency"
                height={40}
                priority
                src="/pieagency-logo.jpg"
                width={40}
              />
            </div>
            <div>
              <span>PieAgency</span>
              <small>{title}</small>
            </div>
          </Link>
          <button
            aria-label="Fermer le menu"
            className="private-icon-button mobile-only"
            onClick={() => setIsSidebarOpen(false)}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="private-nav" aria-label="Navigation privee">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);
            const locked = isGated && !ONBOARDING_ALLOWED_PATHS.some((p) => item.href.startsWith(p));

            if (locked) {
              return (
                <span
                  className="private-nav-item private-nav-item--locked"
                  key={item.href}
                  title="Votre espace sera ouvert après validation de votre dossier"
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </span>
              );
            }

            return (
              <Link
                className={`private-nav-item ${active ? "active" : ""}`}
                href={item.href}
                key={item.href}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {isGated ? (
          <div className="private-nav-gate-msg">
            Votre espace de suivi sera ouvert après analyse et validation de votre dossier par l&apos;équipe PieAgency.
          </div>
        ) : null}

        {session?.user.role === "admin" ? (
          <div className="private-nav-section" aria-label="Acces rapides">
            <span>Acces rapides</span>
            {quickLinks.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  className={`private-nav-item private-nav-item-secondary ${active ? "active" : ""}`}
                  href={item.href}
                  key={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ) : null}

        <div className="private-sidebar-foot">
          <button
            aria-label="Se deconnecter"
            className="private-nav-item private-nav-logout"
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={18} />
            <span>Deconnexion</span>
          </button>
        </div>
      </aside>

      {isSidebarOpen ? (
        <button
          aria-label="Fermer le menu"
          className="private-sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <div className={`private-main${isScrolled ? " scrolled" : ""}`} ref={mainRef}>
        <header className={`private-topbar${isScrolled ? " scrolled" : ""}${pathname === "/espace-etudiant/parcours-guide" ? " private-topbar-copilot" : ""}`}>
          <button
            aria-label="Ouvrir le menu"
            className="private-icon-button mobile-only"
            onClick={() => setIsSidebarOpen(true)}
            type="button"
          >
            <Menu size={18} />
          </button>
          <div>
            <span>{title}</span>
            <strong>
              {requiredRole === "admin" && pathname === "/admin"
                ? "Pilotage PieAgency + PieHUB"
                : session.user.full_name || session.user.email}
            </strong>
          </div>
          {pathname === "/espace-etudiant/parcours-guide" ? (
            <p className="private-topbar-copilot-phrase">
              Avancez étape par étape — bons modules, bonnes ressources, bonnes actions.
            </p>
          ) : null}
          <div className="private-topbar-actions">
            <button
              aria-label={isDark ? "Mode clair" : "Mode sombre"}
              className="private-icon-button"
              onClick={toggleDark}
              type="button"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              aria-label="Notifications"
              className="private-icon-button"
              type="button"
            >
              <Bell size={18} />
            </button>
          </div>
        </header>

        <div className="private-content">{children}</div>
      </div>
    </div>
  );
}
