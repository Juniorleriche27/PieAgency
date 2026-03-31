"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  clearStoredSession,
  getApiBaseUrl,
  saveStoredSession,
  type AuthSession,
  type AuthSignUpResponse,
} from "@/lib/auth";

type AuthMode =
  | "sign-in"
  | "sign-up"
  | "forgot-password"
  | "reset-password";

type AuthTab = "sign-in" | "sign-up" | "forgot-password";

type ErrorPayload = {
  detail?: string;
};

type MessagePayload = {
  message: string;
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

function decodeAuthUrlValue(value: string | null) {
  if (!value) {
    return "";
  }
  return decodeURIComponent(value.replace(/\+/g, " "));
}

function getRequestedMode(modeParam: string | null): AuthMode {
  if (modeParam === "signup") {
    return "sign-up";
  }
  if (modeParam === "forgot-password") {
    return "forgot-password";
  }
  if (modeParam === "recovery") {
    return "forgot-password";
  }
  return "sign-in";
}

function getActiveTab(mode: AuthMode): AuthTab {
  if (mode === "reset-password") {
    return "forgot-password";
  }
  return mode;
}

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const [mode, setMode] = useState<AuthMode>(getRequestedMode(searchParams.get("mode")));
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
  const [resetAccessToken, setResetAccessToken] = useState("");
  const [resetRefreshToken, setResetRefreshToken] = useState("");

  const nextPathParam = searchParams.get("next") ?? "/espace-etudiant";
  const nextPath = nextPathParam.startsWith("/") ? nextPathParam : "/espace-etudiant";
  const confirmedParam = searchParams.get("confirmed");

  useEffect(() => {
    if (resetAccessToken && resetRefreshToken) {
      return;
    }

    setMode(getRequestedMode(searchParams.get("mode")));
  }, [resetAccessToken, resetRefreshToken, searchParams]);

  useEffect(() => {
    if (confirmedParam === "1") {
      setMode("sign-in");
      setInfoMessage(
        "Email confirme. Vous pouvez maintenant vous connecter a votre espace.",
      );
    }
  }, [confirmedParam]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const queryParams = new URLSearchParams(window.location.search);
    const recoveryType =
      hashParams.get("type") || queryParams.get("type") || queryParams.get("mode");
    const accessToken =
      hashParams.get("access_token") || queryParams.get("access_token") || "";
    const refreshToken =
      hashParams.get("refresh_token") || queryParams.get("refresh_token") || "";
    const errorDescription = decodeAuthUrlValue(
      hashParams.get("error_description") || queryParams.get("error_description"),
    );

    if (errorDescription) {
      setMode("forgot-password");
      setErrorMessage(errorDescription);
      setInfoMessage("");
      return;
    }

    if (recoveryType === "recovery" && accessToken && refreshToken) {
      setResetAccessToken(accessToken);
      setResetRefreshToken(refreshToken);
      setMode("reset-password");
      setErrorMessage("");
      setInfoMessage(
        "Lien valide. Choisissez maintenant un nouveau mot de passe.",
      );
    }
  }, [searchParams]);

  function updateBrowserMode(nextMode: AuthMode) {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.delete("confirmed");
    params.delete("access_token");
    params.delete("refresh_token");
    params.delete("type");
    params.delete("error_description");

    if (nextMode === "sign-up") {
      params.set("mode", "signup");
    } else if (nextMode === "forgot-password") {
      params.set("mode", "forgot-password");
    } else if (nextMode === "reset-password") {
      params.set("mode", "recovery");
    } else {
      params.delete("mode");
    }

    const nextUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, "", nextUrl);
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrorMessage("");
    setInfoMessage("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);

    if (nextMode !== "reset-password") {
      setResetAccessToken("");
      setResetRefreshToken("");
    }

    updateBrowserMode(nextMode);
  }

  async function readErrorMessage(response: Response) {
    try {
      const payload = (await response.json()) as ErrorPayload;
      return payload.detail || "Une erreur est survenue.";
    } catch {
      return "Une erreur est survenue.";
    }
  }

  async function readInfoMessage(response: Response) {
    const payload = (await response.json()) as MessagePayload;
    return payload.message;
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

    switchMode("sign-in");
    setPassword("");
    setConfirmPassword("");
    setInfoMessage(payload.message);
  }

  async function handleForgotPassword() {
    const response = await fetch(`${apiBaseUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
      }),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    setInfoMessage(await readInfoMessage(response));
  }

  async function handleResetPassword() {
    if (!resetAccessToken || !resetRefreshToken) {
      throw new Error("Le lien de reinitialisation est invalide ou expire.");
    }

    if (password !== confirmPassword) {
      throw new Error("Les deux mots de passe ne correspondent pas.");
    }

    const response = await fetch(`${apiBaseUrl}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: resetAccessToken,
        refresh_token: resetRefreshToken,
        password,
      }),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    clearStoredSession();
    setResetAccessToken("");
    setResetRefreshToken("");
    setPassword("");
    setConfirmPassword("");
    setEmail("");
    switchMode("sign-in");
    setInfoMessage(await readInfoMessage(response));
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

      if (mode === "forgot-password") {
        await handleForgotPassword();
        return;
      }

      if (mode === "reset-password") {
        await handleResetPassword();
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

  const activeTab = getActiveTab(mode);
  const isPasswordMode = mode === "sign-in" || mode === "sign-up" || mode === "reset-password";

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Mode de connexion">
          <button
            className={`auth-tab ${activeTab === "sign-in" ? "active" : ""}`}
            onClick={() => switchMode("sign-in")}
            type="button"
          >
            Connexion
          </button>
          <button
            className={`auth-tab ${activeTab === "forgot-password" ? "active" : ""}`}
            onClick={() => switchMode("forgot-password")}
            type="button"
          >
            Mot de passe oublie
          </button>
          <button
            className={`auth-tab ${activeTab === "sign-up" ? "active" : ""}`}
            onClick={() => switchMode("sign-up")}
            type="button"
          >
            Creer un compte
          </button>
        </div>

        <div className="auth-copy">
          <div className="portal-card-kicker">
            {mode === "sign-in"
              ? "Acces plateforme"
              : mode === "sign-up"
                ? "Nouveau compte"
                : mode === "forgot-password"
                  ? "Reinitialisation"
                  : "Nouveau mot de passe"}
          </div>
          <h2>
            {mode === "sign-in"
              ? "Se connecter"
              : mode === "sign-up"
                ? "Creer son acces"
                : mode === "forgot-password"
                  ? "Mot de passe oublie"
                  : "Definir un nouveau mot de passe"}
          </h2>
          <p>
            {mode === "sign-in"
              ? "Connectez-vous pour acceder a votre espace etudiant ou admin."
              : mode === "sign-up"
                ? "Le compte est rattache a Supabase Auth. Un email de confirmation sera envoye avant la premiere connexion."
                : mode === "forgot-password"
                  ? "Entrez votre email pour recevoir un lien de reinitialisation sur la page de connexion."
                  : "Choisissez un nouveau mot de passe pour finaliser la reinitialisation."}
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

          {mode !== "reset-password" ? (
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
          ) : null}

          {isPasswordMode ? (
            <div className="auth-field">
              <label htmlFor="password">
                {mode === "reset-password" ? "Nouveau mot de passe" : "Mot de passe"}
              </label>
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
          ) : null}

          {mode === "sign-up" || mode === "reset-password" ? (
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
                <label htmlFor="phone">Telephone</label>
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

          {mode === "forgot-password" ? (
            <div className="auth-form-note">
              L&apos;email ouvrira un lien vers <strong>/connexion</strong> pour definir le
              nouveau mot de passe.
            </div>
          ) : null}

          {errorMessage ? <div className="auth-alert error">{errorMessage}</div> : null}
          {infoMessage ? <div className="auth-alert">{infoMessage}</div> : null}

          <button className="btn btn-primary" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? "Traitement..."
              : mode === "sign-in"
                ? "Se connecter"
                : mode === "sign-up"
                  ? "Creer le compte"
                  : mode === "forgot-password"
                    ? "Envoyer le lien"
                    : "Mettre a jour le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}
