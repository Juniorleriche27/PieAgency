type PageHeroProps = {
  breadcrumb: string;
  title: string;
  description: string;
  theme?: "navy" | "gold";
};

export function PageHero({
  breadcrumb,
  title,
  description,
  theme = "navy",
}: PageHeroProps) {
  return (
    <div className={`page-hero ${theme === "gold" ? "page-hero-gold" : ""}`}>
      <div className="container">
        <div className="page-hero-inner">
          <div className="breadcrumb">
            Accueil / <span>{breadcrumb}</span>
          </div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}
