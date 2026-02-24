import { useEffect, useState } from "react";
import { api } from "../api/client";
import styles from "./AdminView.module.css";

type UserMini = { id: number; email: string; name: string; surname: string };

type ReportOut = {
  id: number;
  status: string;
  reason: string;
  details?: string | null;
  created_at: string;

  thread_id: number;
  item_id: number;
  item_title?: string | null;
  item_status?: string | null;
  item_image_url?: string | null;

  reporter: UserMini;
  reported: UserMini;
};

type ChatMsgOut = {
  id: number;
  thread_id: number;
  sender_id: number;
  text: string;
  created_at: string;
};

type ReportDetailOut = ReportOut & { messages: ChatMsgOut[] };

export default function AdminView() {
  const [reports, setReports] = useState<ReportOut[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ReportDetailOut | null>(null);
  const [loading, setLoading] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function loadReports() {
    setLoading(true);
    setErr(null);
    try {
      const r = await api.get<ReportOut[]>("/admin/reports");
      setReports(r.data ?? []);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Не удалось загрузить жалобы");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id: number) {
    setErr(null);
    try {
      const r = await api.get<ReportDetailOut>(`/admin/reports/${id}`);
      setDetail(r.data);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Не удалось открыть жалобу");
      setDetail(null);
    }
  }

  async function decide(action: "ban" | "reject") {
    if (!activeId) return;
    setDecisionLoading(true);
    setErr(null);
    try {
      await api.post(`/admin/reports/${activeId}/decision`, { action });
      await loadReports();
      await loadDetail(activeId);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Не удалось применить решение");
    } finally {
      setDecisionLoading(false);
    }
  }

  useEffect(() => {
    void loadReports();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    void loadDetail(activeId);
  }, [activeId]);

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.title}>Администрирование</div>

        {loading ? (
          <div className={styles.muted}>Загрузка…</div>
        ) : reports.length === 0 ? (
          <div className={styles.muted}>Жалоб пока нет.</div>
        ) : (
          reports.map((r) => (
            <button
              key={r.id}
              className={activeId === r.id ? styles.reportItemActive : styles.reportItem}
              onClick={() => setActiveId(r.id)}
            >
              <div className={styles.reportTop}>
                <span>#{r.id}</span>
                <span className={styles.status}>{r.status}</span>
              </div>
              <div className={styles.reportMeta}>
                {r.reason} • {r.item_title ?? `Item #${r.item_id}`}
              </div>
              <div className={styles.reportMeta}>
                reported: {r.reported.name} {r.reported.surname} (id {r.reported.id})
              </div>
            </button>
          ))
        )}
      </aside>

      <main className={styles.main}>
        {!detail ? (
          <div className={styles.muted}>Выберите жалобу слева.</div>
        ) : (
          <>
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                Жалоба #{detail.id} • {detail.status}
              </div>
              <div className={styles.row}>
                <b>Причина:</b> {detail.reason}
              </div>
              {detail.details ? (
                <div className={styles.row}>
                  <b>Комментарий:</b> {detail.details}
                </div>
              ) : null}
              <div className={styles.row}>
                <b>Объявление:</b> {detail.item_title ?? `Item #${detail.item_id}`} • {detail.item_status}
              </div>
              <div className={styles.row}>
                <b>Пожаловался:</b> {detail.reporter.name} {detail.reporter.surname} (id {detail.reporter.id})
              </div>
              <div className={styles.row}>
                <b>На кого:</b> {detail.reported.name} {detail.reported.surname} (id {detail.reported.id})
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.banBtn}
                  onClick={() => void decide("ban")}
                  disabled={decisionLoading || detail.status !== "pending"}
                >
                  Забанить
                </button>
                <button
                  className={styles.rejectBtn}
                  onClick={() => void decide("reject")}
                  disabled={decisionLoading || detail.status !== "pending"}
                >
                  Отклонить
                </button>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Сообщения чата</div>
              <div className={styles.chatBox}>
                {detail.messages.length === 0 ? (
                  <div className={styles.muted}>Нет сообщений.</div>
                ) : (
                  detail.messages.map((m) => (
                    <div key={m.id} className={styles.msg}>
                      <div className={styles.msgMeta}>
                        sender {m.sender_id} • {m.created_at}
                      </div>
                      <div>{m.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {err ? <div className={styles.error}>{err}</div> : null}
      </main>
    </div>
  );
}
