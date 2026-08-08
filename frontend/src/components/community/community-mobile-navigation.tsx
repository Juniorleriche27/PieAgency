"use client";

export type CommunityMainTab =
  | "feed"
  | "explorer"
  | "groupes"
  | "evenements"
  | "ressources"
  | "messages"
  | "publicite";

const MOBILE_TABS: Array<{ key: CommunityMainTab; label: string }> = [
  { key: "feed", label: "Fil" },
  { key: "groupes", label: "👥 Groupes" },
  { key: "evenements", label: "🗓 Événements" },
  { key: "ressources", label: "📚 Ressources" },
  { key: "publicite", label: "📢 Publicités" },
  { key: "explorer", label: "⌕ Explorer" },
  { key: "messages", label: "💬 Messages" },
];

type CommunityMobileNavigationProps = {
  activeTab: CommunityMainTab;
  onSelect: (tab: CommunityMainTab) => void;
};

export function CommunityMobileNavigation({ activeTab, onSelect }: CommunityMobileNavigationProps) {
  return (
    <nav className="social-mobile-tabs-wrapper" aria-label="Navigation mobile PieHUB">
      <div className="social-mobile-tabs">
        {MOBILE_TABS.map((tab) => (
          <button
            aria-current={activeTab === tab.key ? "page" : undefined}
            className={`social-mobile-tab ${activeTab === tab.key ? "is-active" : ""}`}
            key={tab.key}
            onClick={() => onSelect(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
