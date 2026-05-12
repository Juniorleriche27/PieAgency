"use client";

import { useEffect, useRef, useState } from "react";

type CountUpProps = {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
};

export function CountUp({ target, prefix = "", suffix = "", duration = 1800 }: CountUpProps) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          observer.disconnect();

          const startTime = performance.now();
          const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            setValue(Math.round(easeOut(progress) * target));
            if (progress < 1) requestAnimationFrame(tick);
          };

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {prefix}{value}{suffix}
    </span>
  );
}

export function AnimatedProgressBar({ width }: { width: number }) {
  const [fill, setFill] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          observer.disconnect();
          const timeout = setTimeout(() => setFill(width), 120);
          return () => clearTimeout(timeout);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div className="hero-bar" ref={ref}>
      <div
        className="hero-bar-fill"
        style={{
          width: `${fill}%`,
          transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}
