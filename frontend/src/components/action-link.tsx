import Link from "next/link";
import type { ReactNode } from "react";
import type { ActionVariant } from "@/content/site";

type ActionLinkProps = {
  href: string;
  children: ReactNode;
  variant: ActionVariant;
  size?: "sm" | "lg";
  external?: boolean;
  className?: string;
  onClick?: () => void;
};

const variantClassName: Record<ActionVariant, string> = {
  primary: "btn btn-primary",
  gold: "btn btn-gold",
  outline: "btn btn-outline",
  outlineWhite: "btn btn-outline-white",
  green: "btn btn-green",
};

export function ActionLink({
  href,
  children,
  variant,
  size,
  external = false,
  className = "",
  onClick,
}: ActionLinkProps) {
  const classes = [variantClassName[variant], size ? `btn-${size}` : "", className]
    .filter(Boolean)
    .join(" ");

  if (external) {
    return (
      <a
        className={classes}
        href={href}
        onClick={onClick}
        rel="noreferrer"
        target="_blank"
      >
        {children}
      </a>
    );
  }

  return (
    <Link className={classes} href={href} onClick={onClick}>
      {children}
    </Link>
  );
}
