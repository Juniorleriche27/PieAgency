import { ActionLink } from "@/components/action-link";

type PortalAccessPanelProps = {
  kicker: string;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function PortalAccessPanel({
  kicker,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: PortalAccessPanelProps) {
  return (
    <div className="portal-shell">
      <div className="portal-access-card">
        <div className="portal-card-kicker">{kicker}</div>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="portal-actions">
          <ActionLink href={primaryHref} variant="primary">
            {primaryLabel}
          </ActionLink>
          {secondaryHref && secondaryLabel ? (
            <ActionLink href={secondaryHref} variant="outline">
              {secondaryLabel}
            </ActionLink>
          ) : null}
        </div>
      </div>
    </div>
  );
}
