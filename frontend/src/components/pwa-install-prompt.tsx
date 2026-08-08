"use client";

import { Download, Share, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pieagency-install-prompt-dismissed-at";
const REMIND_AFTER_MS = 14 * 24 * 60 * 60 * 1000;
const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;
    const hadController = Boolean(navigator.serviceWorker.controller);
    let registration: ServiceWorkerRegistration | null = null;
    const activateWaitingWorker = () => {
      registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
    };
    const checkForUpdate = () => {
      if (!navigator.onLine || document.visibilityState === "hidden") return;
      registration?.update().then(activateWaitingWorker).catch(() => undefined);
    };

    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then((nextRegistration) => {
      registration = nextRegistration;
      activateWaitingWorker();
      nextRegistration.update().catch(() => undefined);
      nextRegistration.addEventListener("updatefound", () => {
        const worker = nextRegistration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed") activateWaitingWorker();
        });
      });
    }).catch(() => undefined);

    const updateTimer = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", checkForUpdate);

    const onControllerChange = () => {
      // Pas de rechargement lors de la toute première installation du worker.
      if (refreshing || !hadController) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      window.clearInterval(updateTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", checkForUpdate);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() - dismissedAt < REMIND_AFTER_MS) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);

    const revealTimer = window.setTimeout(() => {
      if (ios) {
        setIsIos(true);
        setVisible(true);
      }
    }, 1800);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.clearTimeout(revealTimer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (isIos) {
      setShowIosHelp(true);
      return;
    }
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    else dismiss();
    setInstallEvent(null);
  };

  if (!visible) return null;

  return (
    <aside className="pwa-prompt" role="dialog" aria-labelledby="pwa-prompt-title">
      <button className="pwa-prompt-close" onClick={dismiss} aria-label="Fermer et me le rappeler plus tard">
        <X size={18} aria-hidden="true" />
      </button>
      <div className="pwa-prompt-icon" aria-hidden="true">
        <Sparkles size={21} />
      </div>
      <div className="pwa-prompt-copy">
        <span className="pwa-prompt-eyebrow">Votre espace, toujours avec vous</span>
        <strong id="pwa-prompt-title">Installez PieAgency</strong>
        <p>Accédez à votre parcours en un geste. Vos mises à jour arriveront automatiquement.</p>
        {showIosHelp ? (
          <p className="pwa-ios-help"><Share size={16} aria-hidden="true" /> Dans Safari, touchez <b>Partager</b>, puis <b>Sur l’écran d’accueil</b>.</p>
        ) : null}
      </div>
      <div className="pwa-prompt-actions">
        <button className="pwa-install-button" onClick={install}>
          <Download size={17} aria-hidden="true" /> Ajouter à l’écran
        </button>
        <button className="pwa-later-button" onClick={dismiss}>Plus tard</button>
      </div>
    </aside>
  );
}
