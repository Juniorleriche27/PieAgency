"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionLink } from "@/components/action-link";
import { PortalAccessPanel } from "@/components/portal-access-panel";
import { useAuthSession } from "@/hooks/use-auth-session";
import { authenticatedFetch, getApiBaseUrl } from "@/lib/auth";

type MetricTone = "neutral" | "good" | "attention" | "info";
type Priority = "low" | "medium" | "high";
type TaskStatus = "todo" | "in_progress" | "done";

type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
  tone: MetricTone;
};

type AdminLeadItem = {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  country: string;
  study_level: string;
  target_project: string;
  created_at_label: string;
};

type AdminPartnershipItem = {
  id: string;
  organization_name: string;
  organization_type: string;
  contact_full_name: string;
  contact_role: string;
  email?: string | null;
  phone?: string | null;
  country: string;
  partnership_scope: string;
  status: string;
  created_at_label: string;
};

type AdminCaseItem = {
  case_reference: string;
  student_name: string;
  track: string;
  stage: string;
  counselor: string;
  progress_percent: number;
  priority: Priority;
};

type AdminTaskItem = {
  title: string;
  owner: string;
  due_label: string;
  status: TaskStatus;
};

type AdminConversationItem = {
  conversation_id: string;
  title: string;
  user_label: string;
  page_path: string;
  message_count: number;
  status: string;
  updated_at_label: string;
};

type AdminPageItem = {
  id: string;
  title: string;
  route_path: string;
  audience: "public" | "student" | "admin";
  is_published: boolean;
  updated_at_label: string;
};

type AdminCommunityPostItem = {
  id: number;
  author_name: string;
  author_handle: string;
  post_type: "text" | "resource" | "poll";
  tag: string;
  excerpt: string;
  likes_count: number;
  saves_count: number;
  comments_count: number;
  poll_votes_count: number;
  ai_reply_count: number;
  is_archived: boolean;
  created_at_label: string;
};

type AdminCommunityCommentItem = {
  id: number;
  post_id: number;
  author_name: string;
  post_excerpt: string;
  body: string;
  likes_count: number;
  is_official: boolean;
  is_ai_generated: boolean;
  created_at_label: string;
};

type ChatMessageItem = {
  id: string;
  sender_role: "user" | "assistant" | "admin";
  body: string;
  model_source?: string | null;
  created_at_label: string;
};

type AdminConversationDetailResponse = {
  conversation: AdminConversationItem;
  messages: ChatMessageItem[];
};

type AdminExportCatalogItem = {
  key: string;
  label: string;
  row_count?: number | null;
};

type AdminDashboardResponse = {
  metrics: DashboardMetric[];
  recent_leads: AdminLeadItem[];
  recent_partnerships: AdminPartnershipItem[];
  active_cases: AdminCaseItem[];
  tasks: AdminTaskItem[];
  recent_chats: AdminConversationItem[];
  managed_pages: AdminPageItem[];
  community_posts: AdminCommunityPostItem[];
  community_comments: AdminCommunityCommentItem[];
};

const exportDatasets = [
  { key: "all_data", label: "Toutes les donnees" },
  { key: "contact_requests", label: "Demandes contact" },
  { key: "partnership_requests", label: "Demandes partenariat" },
  { key: "profiles", label: "Profils plateforme" },
  { key: "student_cases", label: "Dossiers etudiants" },
  { key: "chat_conversations", label: "Conversations" },
  { key: "chat_messages", label: "Messages" },
  { key: "site_pages", label: "Pages" },
  { key: "community_posts", label: "Posts PieHUB" },
  { key: "community_comments", label: "Commentaires PieHUB" },
  { key: "community_post_reactions", label: "Likes et sauvegardes" },
  { key: "community_poll_votes", label: "Votes sondages" },
  { key: "community_ai_events", label: "Evenements IA" },
];

const emptyAdminDashboard: AdminDashboardResponse = {
  metrics: [],
  recent_leads: [],
  recent_partnerships: [],
  active_cases: [],
  tasks: [],
  recent_chats: [],
  managed_pages: [],
  community_posts: [],
  community_comments: [],
};

export function AdminDashboardView() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const { session, isReady } = useAuthSession(apiBaseUrl);
  const [dashboard, setDashboard] = useState<AdminDashboardResponse>(
    emptyAdminDashboard,
  );
  const [exportCatalog, setExportCatalog] = useState<AdminExportCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedConversation, setSelectedConversation] =
    useState<AdminConversationDetailResponse | null>(null);
  const [conversationError, setConversationError] = useState("");
  const [conversationLoadingId, setConversationLoadingId] = useState<string | null>(
    null,
  );
  const [pageActionId, setPageActionId] = useState<string | null>(null);
  const [pageActionError, setPageActionError] = useState("");
  const [communityActionId, setCommunityActionId] = useState<string | null>(null);
  const [communityActionError, setCommunityActionError] = useState("");
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!session || session.user.role !== "admin") {
      setDashboard(emptyAdminDashboard);
      setExportCatalog([]);
      setIsLoading(false);
      return;
    }

    let active = true;

    async function loadDashboard() {
      setIsLoading(true);
      setLoadError("");

      try {
        const [dashboardResponse, catalogResponse] = await Promise.all([
          authenticatedFetch(
            "/api/admin/dashboard",
            { cache: "no-store" },
            { apiBaseUrl, requireAuth: true },
          ),
          authenticatedFetch(
            "/api/admin/exports/catalog",
            { cache: "no-store" },
            { apiBaseUrl, requireAuth: true },
          ),
        ]);

        if (!dashboardResponse.ok) {
          throw new Error("Impossible de charger le tableau de bord admin.");
        }

        const dashboardPayload =
          (await dashboardResponse.json()) as AdminDashboardResponse;
        const catalogPayload = catalogResponse.ok
          ? ((await catalogResponse.json()) as AdminExportCatalogItem[])
          : [];

        if (!active) {
          return;
        }

        setDashboard(dashboardPayload);
        setExportCatalog(catalogPayload);
      } catch (error) {
        if (!active) {
          return;
        }

        setDashboard(emptyAdminDashboard);
        setExportCatalog([]);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Impossible de charger le tableau de bord admin.",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, [apiBaseUrl, isReady, session]);

  async function openConversation(conversationId: string) {
    setConversationLoadingId(conversationId);
    setConversationError("");

    try {
      const response = await authenticatedFetch(
        `/api/admin/conversations/${conversationId}`,
        { cache: "no-store" },
        { apiBaseUrl, requireAuth: true },
      );
      if (!response.ok) {
        throw new Error("Impossible de charger le transcript de la conversation.");
      }

      setSelectedConversation(
        (await response.json()) as AdminConversationDetailResponse,
      );
    } catch (error) {
      setConversationError(
        error instanceof Error
          ? error.message
          : "Impossible de charger le transcript de la conversation.",
      );
    } finally {
      setConversationLoadingId(null);
    }
  }

  async function togglePagePublication(page: AdminPageItem) {
    setPageActionId(page.id);
    setPageActionError("");

    try {
      const response = await authenticatedFetch(
        `/api/admin/pages/${page.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_published: !page.is_published,
            audience: page.audience,
          }),
        },
        { apiBaseUrl, requireAuth: true },
      );
      if (!response.ok) {
        throw new Error("Impossible de mettre a jour cette page.");
      }

      const updatedPage = (await response.json()) as AdminPageItem;
      setDashboard((current) => ({
        ...current,
        managed_pages: current.managed_pages.map((item) =>
          item.id === updatedPage.id ? updatedPage : item,
        ),
      }));
    } catch (error) {
      setPageActionError(
        error instanceof Error
          ? error.message
          : "Impossible de mettre a jour cette page.",
      );
    } finally {
      setPageActionId(null);
    }
  }

  async function downloadExport(datasetKey: string, format: "json" | "csv" | "xlsx") {
    setExportingKey(`${datasetKey}:${format}`);
    setExportError("");

    try {
      const response = await authenticatedFetch(
        `/api/admin/exports/${datasetKey}?format=${format}`,
        undefined,
        { apiBaseUrl, requireAuth: true },
      );
      if (!response.ok) {
        throw new Error("Impossible de generer cet export.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const filename =
        response.headers.get("Content-Disposition")?.match(/filename=\"?([^\";]+)\"?/)?.[1] ??
        `pieagency-${datasetKey}.${format}`;

      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "Impossible de lancer cet export.",
      );
    } finally {
      setExportingKey(null);
    }
  }

  function rowCountFor(datasetKey: string) {
    return exportCatalog.find((item) => item.key === datasetKey)?.row_count;
  }

  async function toggleCommunityPostArchive(post: AdminCommunityPostItem) {
    const actionKey = `post:${post.id}`;
    setCommunityActionId(actionKey);
    setCommunityActionError("");

    try {
      const endpoint = post.is_archived
        ? `/api/admin/community/posts/${post.id}/restore`
        : `/api/admin/community/posts/${post.id}/archive`;
      const response = await authenticatedFetch(
        endpoint,
        { method: "POST" },
        { apiBaseUrl, requireAuth: true },
      );
      if (!response.ok) {
        throw new Error("Impossible de moderer cette publication PieHUB.");
      }

      const updatedPost = (await response.json()) as AdminCommunityPostItem;
      setDashboard((current) => ({
        ...current,
        community_posts: current.community_posts.map((item) =>
          item.id === updatedPost.id ? updatedPost : item,
        ),
      }));
    } catch (error) {
      setCommunityActionError(
        error instanceof Error
          ? error.message
          : "Impossible de moderer cette publication PieHUB.",
      );
    } finally {
      setCommunityActionId(null);
    }
  }

  async function deleteCommunityComment(comment: AdminCommunityCommentItem) {
    const actionKey = `comment:${comment.id}`;
    setCommunityActionId(actionKey);
    setCommunityActionError("");

    try {
      const response = await authenticatedFetch(
        `/api/admin/community/comments/${comment.id}`,
        { method: "DELETE" },
        { apiBaseUrl, requireAuth: true },
      );
      if (!response.ok) {
        throw new Error("Impossible de supprimer ce commentaire PieHUB.");
      }

      setDashboard((current) => ({
        ...current,
        community_comments: current.community_comments.filter(
          (item) => item.id !== comment.id,
        ),
        community_posts: current.community_posts.map((item) =>
          item.id === comment.post_id
            ? { ...item, comments_count: Math.max(item.comments_count - 1, 0) }
            : item,
        ),
      }));
    } catch (error) {
      setCommunityActionError(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer ce commentaire PieHUB.",
      );
    } finally {
      setCommunityActionId(null);
    }
  }

  if (!isReady) {
    return (
      <div className="portal-shell">
        <div className="portal-access-card">
          <div className="portal-card-kicker">Authentification</div>
          <h2>Verification de la session</h2>
          <p>Chargement de l&apos;acces admin...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <PortalAccessPanel
        description="Le cockpit admin est reserve aux comptes autorises."
        kicker="Connexion requise"
        primaryHref="/connexion?next=/admin"
        primaryLabel="Se connecter"
        secondaryHref="/contact"
        secondaryLabel="Contacter PieAgency"
        title="Acces admin protege"
      />
    );
  }

  if (session.user.role !== "admin") {
    return (
      <PortalAccessPanel
        description="Votre session actuelle est etudiante. Cet espace demande un role admin valide dans Supabase."
        kicker="Role incompatible"
        primaryHref="/espace-etudiant"
        primaryLabel="Ouvrir mon espace"
        secondaryHref="/connexion?next=/admin"
        secondaryLabel="Changer de compte"
        title="Acces refuse"
      />
    );
  }

  return (
    <div className="portal-shell">
      <div className="portal-banner admin">
        <div>
          <div className="portal-kicker">Interface admin</div>
          <h2>Pilotage PieAgency + PieHUB</h2>
          <p>
            Leads, partenariats, dossiers, conversations IA, pages et exports
            complets de la plateforme.
          </p>
        </div>
        <div className="portal-banner-meta">
          <span className="portal-pill review">
            {isLoading ? "Chargement" : "Session admin active"}
          </span>
          <ActionLink href="/partenariat" variant="gold">
            Voir le formulaire partenariat
          </ActionLink>
        </div>
      </div>

      {loadError ? <div className="portal-warning">{loadError}</div> : null}

      <div className="portal-metrics">
        {dashboard.metrics.map((metric) => (
          <div className="portal-metric" key={metric.label}>
            <div className="portal-metric-label">{metric.label}</div>
            <div className="portal-metric-value">{metric.value}</div>
            <div className={`portal-tone ${metric.tone}`}>{metric.detail}</div>
          </div>
        ))}
      </div>

      <div className="portal-card">
        <div className="portal-card-head">
          <div>
            <div className="portal-card-kicker">Exports</div>
            <h3>Exporter les donnees plateforme</h3>
          </div>
          <div className="portal-progress-meta">{exportDatasets.length} datasets</div>
        </div>

        {exportError ? <div className="portal-warning mt-16">{exportError}</div> : null}

        <div className="portal-list">
          {exportDatasets.map((dataset) => (
            <div className="portal-list-item" key={dataset.key}>
              <div>
                <strong>{dataset.label}</strong>
                <p>
                  {typeof rowCountFor(dataset.key) === "number"
                    ? `${rowCountFor(dataset.key)} ligne(s)`
                    : "Comptage non disponible"}
                </p>
              </div>
              <div className="portal-list-meta">
                <button
                  className="portal-inline-action"
                  disabled={exportingKey === `${dataset.key}:json`}
                  onClick={() => void downloadExport(dataset.key, "json")}
                  type="button"
                >
                  JSON
                </button>
                <button
                  className="portal-inline-action"
                  disabled={exportingKey === `${dataset.key}:csv`}
                  onClick={() => void downloadExport(dataset.key, "csv")}
                  type="button"
                >
                  CSV
                </button>
                <button
                  className="portal-inline-action"
                  disabled={exportingKey === `${dataset.key}:xlsx`}
                  onClick={() => void downloadExport(dataset.key, "xlsx")}
                  type="button"
                >
                  Excel
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="portal-grid admin-grid">
        <div className="portal-card">
          <div className="portal-card-head">
            <div>
              <div className="portal-card-kicker">Leads recents</div>
              <h3>Demandes entrantes</h3>
            </div>
            <div className="portal-progress-meta">
              {dashboard.recent_leads.length} ligne(s)
            </div>
          </div>

          <div className="portal-table">
            <div className="portal-table-head">
              <span>Etudiant</span>
              <span>Projet</span>
              <span>Pays</span>
              <span>Canal</span>
              <span>Recu</span>
            </div>

            {dashboard.recent_leads.map((lead) => (
              <div className="portal-table-row" key={lead.id}>
                <div>
                  <strong>{lead.full_name}</strong>
                  <p>{lead.study_level}</p>
                </div>
                <div>{lead.target_project}</div>
                <div>{lead.country}</div>
                <div>{lead.phone || lead.email || "Aucun contact"}</div>
                <div>{lead.created_at_label}</div>
              </div>
            ))}

            {!dashboard.recent_leads.length ? (
              <div className="portal-empty">Aucun lead disponible pour le moment.</div>
            ) : null}
          </div>
        </div>

        <div className="portal-card">
          <div className="portal-card-head">
            <div>
              <div className="portal-card-kicker">Partenariats</div>
              <h3>Demandes recentes</h3>
            </div>
            <div className="portal-progress-meta">
              {dashboard.recent_partnerships.length} ligne(s)
            </div>
          </div>

          <div className="portal-list">
            {dashboard.recent_partnerships.length ? (
              dashboard.recent_partnerships.map((item) => (
                <div className="portal-list-item" key={item.id}>
                  <div>
                    <strong>{item.organization_name}</strong>
                    <p>
                      {item.organization_type} - {item.country}
                    </p>
                    <p>
                      {item.contact_full_name} ({item.contact_role})
                    </p>
                  </div>
                  <div className="portal-list-meta">
                    <span className="portal-pill neutral">{item.status}</span>
                    <span>{item.partnership_scope}</span>
                    <span>{item.phone || item.email || "Sans contact"}</span>
                    <span>{item.created_at_label}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="portal-empty">
                Aucune demande de partenariat n&apos;est encore stockee.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="portal-grid admin-grid">
        <div className="portal-card">
          <div className="portal-card-kicker">Pipeline</div>
          <h3>Dossiers actifs</h3>
          <div className="portal-case-list">
            {dashboard.active_cases.length ? (
              dashboard.active_cases.map((item) => (
                <div className="portal-case" key={item.case_reference}>
                  <div className="portal-case-head">
                    <strong>{item.student_name}</strong>
                    <span className={`portal-pill priority-${item.priority}`}>
                      {item.priority}
                    </span>
                  </div>
                  <p>
                    {item.case_reference} - {item.track}
                  </p>
                  <div className="portal-case-stage">{item.stage}</div>
                  <div className="portal-case-meta">
                    <span>Conseiller: {item.counselor}</span>
                    <span>{item.progress_percent}%</span>
                  </div>
                  <div className="portal-progress compact">
                    <div
                      className="portal-progress-bar"
                      style={{ width: `${item.progress_percent}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="portal-empty">
                Aucun dossier actif n&apos;est encore remonte.
              </div>
            )}
          </div>
        </div>

        <div className="portal-card">
          <div className="portal-card-kicker">Operations</div>
          <h3>File de travail</h3>
          <div className="portal-task-list">
            {dashboard.tasks.length ? (
              dashboard.tasks.map((task) => (
                <div className="portal-task" key={`${task.title}-${task.owner}`}>
                  <div>
                    <strong>{task.title}</strong>
                    <p>{task.owner}</p>
                  </div>
                  <div className="portal-task-meta">
                    <span className={`portal-pill task-${task.status}`}>
                      {task.status === "in_progress"
                        ? "En cours"
                        : task.status === "done"
                          ? "Fait"
                          : "A faire"}
                    </span>
                    <span>{task.due_label}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="portal-empty">
                Aucune tache admin n&apos;est encore enregistree.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="portal-grid admin-grid portal-grid-secondary">
        <div className="portal-card">
          <div className="portal-card-head">
            <div>
              <div className="portal-card-kicker">Chatbot</div>
              <h3>Conversations recentes</h3>
            </div>
            <div className="portal-progress-meta">
              {dashboard.recent_chats.length} session(s)
            </div>
          </div>

          <div className="portal-list">
            {dashboard.recent_chats.length ? (
              dashboard.recent_chats.map((chat) => (
                <div className="portal-list-item" key={chat.conversation_id}>
                  <div>
                    <strong>{chat.title}</strong>
                    <p>
                      {chat.user_label} - {chat.page_path}
                    </p>
                  </div>
                  <div className="portal-list-meta">
                    <span>{chat.message_count} msg</span>
                    <span>{chat.updated_at_label}</span>
                    <button
                      className="portal-inline-action"
                      disabled={conversationLoadingId === chat.conversation_id}
                      onClick={() => void openConversation(chat.conversation_id)}
                      type="button"
                    >
                      {conversationLoadingId === chat.conversation_id
                        ? "Chargement..."
                        : "Voir le transcript"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="portal-empty">
                Aucune conversation chatbot n&apos;est encore stockee.
              </div>
            )}
          </div>

          {conversationError ? (
            <div className="portal-warning mt-16">{conversationError}</div>
          ) : null}

          {selectedConversation ? (
            <div className="portal-transcript">
              <div className="portal-card-head">
                <div>
                  <div className="portal-card-kicker">Transcript</div>
                  <h3>{selectedConversation.conversation.title}</h3>
                </div>
                <div className="portal-progress-meta">
                  {selectedConversation.conversation.user_label}
                </div>
              </div>
              <div className="portal-transcript-list">
                {selectedConversation.messages.length ? (
                  selectedConversation.messages.map((message) => (
                    <div
                      className={`portal-transcript-message ${message.sender_role}`}
                      key={message.id}
                    >
                      <div className="portal-note-head">
                        <strong>{message.sender_role}</strong>
                        <span>{message.created_at_label}</span>
                      </div>
                      <p>{message.body}</p>
                    </div>
                  ))
                ) : (
                  <div className="portal-empty">
                    Aucun message n&apos;est encore stocke dans cette conversation.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="portal-card">
          <div className="portal-card-head">
            <div>
              <div className="portal-card-kicker">Contenu</div>
              <h3>Pages repertoriees</h3>
            </div>
            <div className="portal-progress-meta">
              {dashboard.managed_pages.length} page(s)
            </div>
          </div>

          <div className="portal-list">
            {dashboard.managed_pages.length ? (
              dashboard.managed_pages.map((page) => (
                <div className="portal-list-item" key={page.id}>
                  <div>
                    <strong>{page.title}</strong>
                    <p>{page.route_path}</p>
                  </div>
                  <div className="portal-list-meta">
                    <span className={`portal-pill ${page.is_published ? "good" : "missing"}`}>
                      {page.is_published ? page.audience : "protegee"}
                    </span>
                    <span>{page.updated_at_label}</span>
                    <button
                      className="portal-inline-action"
                      disabled={pageActionId === page.id}
                      onClick={() => void togglePagePublication(page)}
                      type="button"
                    >
                      {pageActionId === page.id
                        ? "Mise a jour..."
                        : page.is_published
                          ? "Masquer"
                          : "Publier"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="portal-empty">
                La table site_pages est vide. Rejouez schema.sql dans Supabase.
              </div>
            )}
          </div>

          {pageActionError ? <div className="portal-warning mt-16">{pageActionError}</div> : null}
        </div>
      </div>

      <div className="portal-grid admin-grid portal-grid-secondary">
        <div className="portal-card">
          <div className="portal-card-head">
            <div>
              <div className="portal-card-kicker">PieHUB</div>
              <h3>Posts et signaux communautaires</h3>
            </div>
            <div className="portal-progress-meta">
              {dashboard.community_posts.length} post(s)
            </div>
          </div>

          <div className="portal-list">
            {dashboard.community_posts.length ? (
              dashboard.community_posts.map((post) => (
                <div className="portal-list-item" key={post.id}>
                  <div>
                    <strong>
                      {post.author_name} · {post.post_type}
                    </strong>
                    <p>{post.author_handle}</p>
                    <p>{post.excerpt}</p>
                  </div>
                  <div className="portal-list-meta">
                    <span className={`portal-pill ${post.is_archived ? "missing" : "good"}`}>
                      {post.is_archived ? "archive" : "visible"}
                    </span>
                    <span>
                      {post.likes_count} likes · {post.saves_count} saves
                    </span>
                    <span>
                      {post.comments_count} commentaires · {post.poll_votes_count} votes
                    </span>
                    <span>{post.ai_reply_count} reponse(s) IA</span>
                    <span>{post.created_at_label}</span>
                    <button
                      className="portal-inline-action"
                      disabled={communityActionId === `post:${post.id}`}
                      onClick={() => void toggleCommunityPostArchive(post)}
                      type="button"
                    >
                      {communityActionId === `post:${post.id}`
                        ? "Traitement..."
                        : post.is_archived
                          ? "Restaurer"
                          : "Archiver"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="portal-empty">
                Aucun post PieHUB n&apos;est encore remonte dans le cockpit admin.
              </div>
            )}
          </div>
        </div>

        <div className="portal-card">
          <div className="portal-card-head">
            <div>
              <div className="portal-card-kicker">Moderation</div>
              <h3>Commentaires PieHUB</h3>
            </div>
            <div className="portal-progress-meta">
              {dashboard.community_comments.length} commentaire(s)
            </div>
          </div>

          {communityActionError ? (
            <div className="portal-warning mt-16">{communityActionError}</div>
          ) : null}

          <div className="portal-list">
            {dashboard.community_comments.length ? (
              dashboard.community_comments.map((comment) => (
                <div className="portal-list-item" key={comment.id}>
                  <div>
                    <strong>{comment.author_name}</strong>
                    <p>{comment.post_excerpt}</p>
                    <p>{comment.body}</p>
                  </div>
                  <div className="portal-list-meta">
                    <span>
                      {comment.likes_count} likes · post #{comment.post_id}
                    </span>
                    <span className={`portal-pill ${comment.is_official ? "good" : "review"}`}>
                      {comment.is_official ? "officiel" : "membre"}
                    </span>
                    {comment.is_ai_generated ? (
                      <span className="portal-pill current">IA</span>
                    ) : null}
                    <span>{comment.created_at_label}</span>
                    <button
                      className="portal-inline-action"
                      disabled={communityActionId === `comment:${comment.id}`}
                      onClick={() => void deleteCommunityComment(comment)}
                      type="button"
                    >
                      {communityActionId === `comment:${comment.id}`
                        ? "Suppression..."
                        : "Supprimer"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="portal-empty">
                Aucun commentaire PieHUB n&apos;est encore disponible pour moderation.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
