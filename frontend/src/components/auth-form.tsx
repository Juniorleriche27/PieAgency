"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getApiBaseUrl,
  saveStoredSession,
  type AuthSession,
  type AuthSignUpResponse,
} from "@/lib/auth";

type AuthMode = "sign-in" | "sign-up";

type ErrorPayload = {
  detail?: string;
};

function PasswordToggleIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M3 4.5 20 19.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M10.58 10.59A2 2 0 0 0 12 14a2 2 0 0 0 1.41-.58"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M9.88 5.08A10.94 10.94 0 0 1 12 4.9c5.05 0 9.27 3.11 10.5 7.1a11.57 11.57 0 0 1-4.17 5.76"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M6.61 6.62A11.3 11.3 0 0 0 1.5 12c1.23 3.99 5.45 7.1 10.5 7.1 1.49 0 2.91-.27 4.21-.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ) : (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M1.5 12c1.23-3.99 5.45-7.1 10.5-7.1s9.27 3.11 10.5 7.1c-1.23 3.99-5.45 7.1-10.5 7.1S2.73 15.99 1.5 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function getRedirectPath(session: AuthSession, nextPath: string) {
  if (session.user.role === "admin") {
    return "/admin";
  }
  return nextPath || "/espace-etudiant";
}

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const [mode, setMode] = useState<AuthMode>(
    searchParams.get("mode") === "signup" ? "sign-up" : "sign-in",
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Togo");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const nextPathParam = searchParams.get("next") ?? "/espace-etudiant";
  const nextPath = nextPathParam.startsWith("/") ? nextPathParam : "/espace-etudiant";
  const confirmedParam = searchParams.get("confirmed");

  useEffect(() => {
    if (confirmedParam === "1") {
      setMode("sign-in");
      setInfoMessage(
        "Email confirme. Vous pouvez maintenant vous connecter a votre espace.",
      );
    }
  }, [confirmedParam]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrorMessage("");
    setInfoMessage("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  async function readErrorMessage(response: Response) {
    try {
      const payload = (await response.json()) as ErrorPayload;
      return payload.detail || "Une erreur est survenue.";
    } catch {
      return "Une erreur est survenue.";
    }
  }

  async function handleSignIn() {
    const response = await fetch(`${apiBaseUrl}/api/auth/sign-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const payload = (await response.json()) as AuthSession;
    saveStoredSession(payload);
    router.push(getRedirectPath(payload, nextPath));
  }

  async function handleSignUp() {
    const response = await fetch(`${apiBaseUrl}/api/auth/sign-up`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name: fullName,
        email,
        password,
        phone: phone || null,
        country: country || null,
      }),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const payload = (await response.json()) as AuthSignUpResponse;
    setInfoMessage(payload.message);

    if (payload.session) {
      saveStoredSession(payload.session);
      router.push(getRedirectPath(payload.session, nextPath));
      return;
    }

    setMode("sign-in");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      if (mode === "sign-up") {
        if (password !== confirmPassword) {
          throw new Error("Les deux mots de passe ne correspondent pas.");
        }
        await handleSignUp();
        return;
      }

      await handleSignIn();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Une erreur est survenue.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Mode de connexion">
          <button
            className={`auth-tab ${mode === "sign-in" ? "active" : ""}`}
            onClick={() => switchMode("sign-in")}
            type="button"
          >
            Connexion
          </button>
          <button
            className={`auth-tab ${mode === "sign-up" ? "active" : ""}`}
            onClick={() => switchMode("sign-up")}
            type="button"
          >
            Creer un compte
          </button>
        </div>

        <div className="auth-copy">
          <div className="portal-card-kicker">
            {mode === "sign-in" ? "Acces plateforme" : "Nouveau compte"}
          </div>
          <h2>{mode === "sign-in" ? "Se connecter" : "Creer son acces"}</h2>
          <p>
            {mode === "sign-in"
              ? "Connectez-vous pour acceder a votre espace etudiant ou admin."
              : "Le compte est rattache a Supabase Auth. Un email de confirmation sera envoye avant la premiere connexion."}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "sign-up" ? (
            <div className="auth-field">
              <label htmlFor="full-name">Nom complet</label>
              <input
                id="full-name"
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Ex: Kossi Mensah"
                required
                value={fullName}
              />
            </div>
          ) : null}

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vous@example.com"
              required
              type="email"
              value={email}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Mot de passe</label>
            <div className="auth-password-wrap">
              <input
                id="password"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Au moins 8 caracteres"
                required
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="auth-password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                <PasswordToggleIcon visible={showPassword} />
              </button>
            </div>
          </div>

          {mode === "sign-up" ? (
            <div className="auth-field">
              <label htmlFor="confirm-password">Confirmer le mot de passe</label>
              <div className="auth-password-wrap">
                <input
                  id="confirm-password"
                  minLength={8}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Retapez le mot de passe"
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                />
                <button
                  aria-label={
                    showConfirmPassword
                      ? "Masquer la confirmation du mot de passe"
                      : "Afficher la confirmation du mot de passe"
                  }
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  type="button"
                >
                  <PasswordToggleIcon visible={showConfirmPassword} />
                </button>
              </div>
            </div>
          ) : null}

          {mode === "sign-up" ? (
            <div className="auth-grid">
              <div className="auth-field">
                <label htmlFor="phone">Telephone / WhatsApp</label>
                <input
                  id="phone"
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+228..."
                  value={phone}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="country">Pays</label>
                <input
                  id="country"
                  onChange={(event) => setCountry(event.target.value)}
                  placeholder="Togo"
                  value={country}
                />
              </div>
            </div>
          ) : null}

          {errorMessage ? <div className="auth-alert error">{errorMessage}</div> : null}
          {infoMessage ? <div className="auth-alert">{infoMessage}</div> : null}

          <button className="btn btn-primary" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? "Traitement..."
              : mode === "sign-in"
                ? "Se connecter"
                : "Creer le compte"}
          </button>
        </form>
      </div>
    </div>
  );
}
