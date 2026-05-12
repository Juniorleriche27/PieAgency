"use client";

import { useEffect, useState } from "react";

type TypewriterProps = {
  phrases: string[];
  typeSpeed?: number;
  deleteSpeed?: number;
  pauseAfterType?: number;
  pauseAfterDelete?: number;
};

export function Typewriter({
  phrases,
  typeSpeed = 52,
  deleteSpeed = 28,
  pauseAfterType = 2200,
  pauseAfterDelete = 500,
}: TypewriterProps) {
  const [displayed, setDisplayed] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIndex % phrases.length]!;

    if (!isDeleting && displayed.length < current.length) {
      const t = setTimeout(
        () => setDisplayed(current.slice(0, displayed.length + 1)),
        typeSpeed,
      );
      return () => clearTimeout(t);
    }

    if (!isDeleting && displayed.length === current.length) {
      const t = setTimeout(() => setIsDeleting(true), pauseAfterType);
      return () => clearTimeout(t);
    }

    if (isDeleting && displayed.length > 0) {
      const t = setTimeout(
        () => setDisplayed(current.slice(0, displayed.length - 1)),
        deleteSpeed,
      );
      return () => clearTimeout(t);
    }

    if (isDeleting && displayed.length === 0) {
      const t = setTimeout(() => {
        setIsDeleting(false);
        setPhraseIndex((i) => (i + 1) % phrases.length);
      }, pauseAfterDelete);
      return () => clearTimeout(t);
    }
  }, [displayed, isDeleting, phraseIndex, phrases, typeSpeed, deleteSpeed, pauseAfterType, pauseAfterDelete]);

  return (
    <span className="typewriter-text">
      {displayed}
      <span className="typewriter-cursor" aria-hidden="true">|</span>
    </span>
  );
}
