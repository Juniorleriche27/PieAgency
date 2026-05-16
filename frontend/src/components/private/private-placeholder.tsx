type PrivatePlaceholderProps = {
  title: string;
  eyebrow: string;
  description: string;
  source?: string;
};

export function PrivatePlaceholder({
  title,
  eyebrow,
  description,
  source,
}: PrivatePlaceholderProps) {
  return (
    <div className="private-placeholder">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {source ? <code>{source}</code> : null}
    </div>
  );
}
