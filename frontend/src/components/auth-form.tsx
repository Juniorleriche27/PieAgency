"use client";

import { type FormEvent, useMemo, useState } from "react";
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
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Togo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const nextPathParam = searchParams.get("next") ?? "/espace-etudiant";
  const nextPath = nextPathParam.startsWith("/") ? nextPathParam : "/espace-etudiant";

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
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      if (mode === "sign-up") {
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
            onClick={() => setMode("sign-in")}
            type="button"
          >
            Connexion
          </button>
          <button
            className={`auth-tab ${mode === "sign-up" ? "active" : ""}`}
            onClick={() => setMode("sign-up")}
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
              : "Le compte est rattache a Supabase Auth et pourra ensuite suivre les dossiers, le chat et les notifications."}
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
            <input
              id="password"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Au moins 8 caracteres"
              required
              type="password"
              value={password}
            />
          </div>

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
