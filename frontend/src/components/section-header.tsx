type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  withDivider?: boolean;
};

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  withDivider = false,
}: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div className="section-label">{eyebrow}</div>
      <h2 className="section-title">{title}</h2>
      {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
      {withDivider ? <div className="section-divider" /> : null}
    </div>
  );
}
