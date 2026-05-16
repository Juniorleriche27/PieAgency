"use client";

import { Activity, BarChart3, CheckCircle2, MessageSquare, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminStatistics,
  type AdminStatisticsDashboard,
} from "@/lib/admin-statistics";

const emptyStatistics: AdminStatisticsDashboard = {
  metrics: [],
  active_cases: [],
  tasks: [],
  recent_chats: [],
  managed_pages: [],
  community_posts: [],
};

function averageProgress(cases: AdminStatisticsDashboard["active_cases"]) {
  if (!cases.length) {
    return 0;
  }
  return Math.round(
    cases.reduce((total, item) => total + item.progress_percent, 0) / cases.length,
  );
}

function countBy<T extends string>(items: T[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
}

export function AdminStatisticsView() {
  const [dashboard, setDashboard] = useState<AdminStatisticsDashboard>(emptyStatistics);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadStatistics() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const payload = await fetchAdminStatistics();
        if (active) {
          setDashboard(payload);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger les statistiques admin.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadStatistics();
    return () => {
      active = false;
    };
  }, []);

  const computed = useMemo(() => {
    const openTasks = dashboard.tasks.filter((task) => task.status !== "done").length;
    const doneTasks = dashboard.tasks.filter((task) => task.status === "done").length;
    const publishedPages = dashboard.managed_pages.filter((page) => page.is_published).length;
    const archivedPosts = dashboard.community_posts.filter((post) => post.is_archived).length;
    const totalInteractions = dashboard.community_posts.reduce(
      (total, post) =>
        total +
        post.likes_count +
        post.saves_count +
        post.comments_count +
        post.poll_votes_count,
      0,
    );
    const byPriority = countBy(dashboard.active_cases.map((item) => item.priority));
    const byPostType = countBy(dashboard.community_posts.map((item) => item.post_type));

    return {
      archivedPosts,
      averageProgress: averageProgress(dashboard.active_cases),
      byPostType,
      byPriority,
      doneTasks,
      openTasks,
      publishedPages,
      totalInteractions,
    };
  }, [dashboard]);

  return (
    <div className="admin-statistics-page">
      <section className="admin-statistics-hero">
        <div>
          <span>Analyse plateforme</span>
          <h1>Statistiques</h1>
          <p>
            Lecture consolidee des indicateurs disponibles dans le dashboard admin:
            dossiers, taches, conversations, pages et activite PieHUB.
          </p>
        </div>
        <div className="admin-statistics-score">
          <TrendingUp size={20} />
          <strong>{computed.averageProgress}%</strong>
          <span>progression moyenne</span>
        </div>
      </section>

      {errorMessage ? <div className="portal-warning">{errorMessage}</div> : null}

      {isLoading ? (
        <div className="admin-statistics-loading">
          {Array.from({ length: 8 }).map((_, index) => (
            <span key={index} />
          ))}
        </div>
      ) : null}

      {!isLoading ? (
        <>
          <section className="admin-statistics-metrics">
            {dashboard.metrics.map((metric) => (
              <div className={`admin-statistics-metric ${metric.tone}`} key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <p>{metric.detail}</p>
              </div>
            ))}
          </section>

          <section className="admin-statistics-grid">
            <article className="admin-statistics-card">
              <div className="admin-statistics-card-head">
                <Activity size={20} />
                <div>
                  <span>Dossiers</span>
                  <h2>Pipeline actif</h2>
                </div>
              </div>

              <div className="admin-statistics-bars">
                {dashboard.active_cases.slice(0, 6).map((item) => (
                  <div className="admin-statistics-bar-row" key={item.case_reference}>
                    <div>
                      <strong>{item.student_name}</strong>
                      <span>{item.track}</span>
                    </div>
                    <div className="admin-statistics-bar">
                      <span style={{ width: `${item.progress_percent}%` }} />
                    </div>
                    <small>{item.progress_percent}%</small>
                  </div>
                ))}
                {!dashboard.active_cases.length ? (
                  <div className="portal-empty">Aucun dossier actif disponible.</div>
                ) : null}
              </div>
            </article>

            <article className="admin-statistics-card">
              <div className="admin-statistics-card-head">
                <CheckCircle2 size={20} />
                <div>
                  <span>Taches</span>
                  <h2>Operations equipe</h2>
                </div>
              </div>

              <div className="admin-statistics-split">
                <div>
                  <strong>{computed.openTasks}</strong>
                  <span>ouvertes</span>
                </div>
                <div>
                  <strong>{computed.doneTasks}</strong>
                  <span>terminees</span>
                </div>
              </div>
              <div className="admin-statistics-list">
                {dashboard.tasks.slice(0, 5).map((task) => (
                  <div key={`${task.title}-${task.owner}`}>
                    <strong>{task.title}</strong>
                    <span>{task.owner} - {task.due_label}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="admin-statistics-grid">
            <article className="admin-statistics-card">
              <div className="admin-statistics-card-head">
                <MessageSquare size={20} />
                <div>
                  <span>Conversations</span>
                  <h2>Activite chatbot</h2>
                </div>
              </div>

              <div className="admin-statistics-list">
                {dashboard.recent_chats.slice(0, 6).map((chat) => (
                  <div key={chat.conversation_id}>
                    <strong>{chat.title}</strong>
                    <span>
                      {chat.user_label} - {chat.message_count} message(s) - {chat.updated_at_label}
                    </span>
                  </div>
                ))}
                {!dashboard.recent_chats.length ? (
                  <div className="portal-empty">Aucune conversation recente.</div>
                ) : null}
              </div>
            </article>

            <article className="admin-statistics-card">
              <div className="admin-statistics-card-head">
                <BarChart3 size={20} />
                <div>
                  <span>PieHUB</span>
                  <h2>Interactions communaute</h2>
                </div>
              </div>

              <div className="admin-statistics-split three">
                <div>
                  <strong>{computed.totalInteractions}</strong>
                  <span>interactions</span>
                </div>
                <div>
                  <strong>{computed.archivedPosts}</strong>
                  <span>archives</span>
                </div>
                <div>
                  <strong>{dashboard.community_posts.length}</strong>
                  <span>posts</span>
                </div>
              </div>
              <div className="admin-statistics-tags">
                {Object.entries(computed.byPostType).map(([key, value]) => (
                  <span key={key}>{key}: {value}</span>
                ))}
              </div>
            </article>
          </section>

          <section className="admin-statistics-summary">
            <div>
              <span>Pages publiees</span>
              <strong>{computed.publishedPages}/{dashboard.managed_pages.length}</strong>
            </div>
            <div>
              <span>Priorite haute</span>
              <strong>{computed.byPriority.high ?? 0}</strong>
            </div>
            <div>
              <span>Priorite moyenne</span>
              <strong>{computed.byPriority.medium ?? 0}</strong>
            </div>
            <div>
              <span>Priorite basse</span>
              <strong>{computed.byPriority.low ?? 0}</strong>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
