"use client";

import { useEffect } from "react";

export default function ParcoursGuideError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[parcours-guide error]", error);
  }, [error]);

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h2 style={{ color: "red" }}>Erreur parcours guidé</h2>
      <pre style={{ background: "#fee", padding: "1rem", borderRadius: "8px", whiteSpace: "pre-wrap" }}>
        {error?.message || String(error)}
        {"\n\nStack:\n"}
        {error?.stack}
      </pre>
      <button onClick={reset} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
        Réessayer
      </button>
    </div>
  );
}
