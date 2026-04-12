import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import Seo from "../components/Seo";
import styles from "./ChatView.module.css";
import { api } from "../api/client";

type ThreadOut = {
  id: number;
  item_id: number;
  peer_id: number;

  item_title?: string | null;
  item_status?: string | null;
  item_image_url?: string | null;

  // ✅ флаги “подтверждения закрытия”
  close_me?: boolean | null;
  close_peer?: boolean | null;

  last_message_at?: string | null;
  last_message_text?: string | null;
};

type UiMessage = {
  threadId: number;
  senderId: number;
  text: string;
  clientId?: string | null;
  createdAt?: string | null;
};

export default function ChatView() {
  const navigate = useNavigate();
  const location = useLocation() as any;

  // Параметры могут прийти:
  // - через state (navigate("/chat", { state: { itemId, ownerId } }))
  // - через query (/chat?itemId=..&ownerId=..)
  const params = new URLSearchParams(location.search);
  const itemIdFromNav = Number(location.state?.itemId ?? params.get("itemId") ?? 0);
  const ownerIdFromNav = Number(location.state?.ownerId ?? params.get("ownerId") ?? 0);

  const [meId, setMeId] = useState<number | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [meError, setMeError] = useState<string | null>(null);

  const [threads, setThreads] = useState<ThreadOut[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);

  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [activePeerId, setActivePeerId] = useState<number | null>(null);

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [text, setText] = useState("");

  // ✅ модалка подтверждения закрытия
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [closeLoading, setCloseLoading] = useState(false);

  // ✅ модалка жалобы
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<"scam" | "false_connection" | "other">(
    "scam"
  );
  const [reportDetails, setReportDetails] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMsg, setReportMsg] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // helper: загрузить threads
  async function loadThreads() {
    setThreadsLoading(true);
    try {
      const r = await api.get<ThreadOut[]>("/chat/threads");
      setThreads(r.data ?? []);
    } catch {
      setThreads([]);
    } finally {
      setThreadsLoading(false);
    }
  }

  // helper: create-or-get thread
  async function createOrGetThread(itemId: number, peerId: number) {
    const r = await api.post<ThreadOut>("/chat/thread", {
      item_id: itemId,
      peer_id: peerId,
    });
    return r.data;
  }

  // 1) meId
  useEffect(() => {
    (async () => {
      setMeLoading(true);
      setMeError(null);

      try {
        const r = await api.get("/auth/me");
        setMeId(Number(r.data.id));
      } catch {
        setMeId(null);
        setMeError("Нужно войти в аккаунт, чтобы открыть чат.");
      } finally {
        setMeLoading(false);
      }
    })();
  }, []);

  // 2) когда meId появился — грузим threads
  useEffect(() => {
    if (!meId) return;
    void loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meId]);

  // 3) если пришли itemId/ownerId — создаём/получаем thread и открываем его
  useEffect(() => {
    if (!meId) return;
    if (!itemIdFromNav || !ownerIdFromNav) return;
    if (ownerIdFromNav === meId) return;

    (async () => {
      try {
        const thread = await createOrGetThread(itemIdFromNav, ownerIdFromNav);

        setActiveThreadId(thread.id);
        setActiveItemId(thread.item_id);
        setActivePeerId(thread.peer_id);

        await loadThreads();
        navigate(`/chat?threadId=${thread.id}`, { replace: true });
      } catch (e: any) {
        const msg =
          e?.response?.data?.detail ||
          e?.message ||
          "Не удалось создать/открыть диалог.";
        setMeError(String(msg));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meId, itemIdFromNav, ownerIdFromNav]);

  // 4) если открыли /chat?threadId=...
  useEffect(() => {
    if (!meId) return;

    const p = new URLSearchParams(location.search);
    const tid = Number(p.get("threadId") ?? 0);
    if (!tid) return;

    if (activeThreadId === tid) return;

    const t = threads.find((x) => x.id === tid);

    setActiveThreadId(tid);
    setActiveItemId(t?.item_id ?? null);
    setActivePeerId(t?.peer_id ?? null);

    setMessages([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, meId, threads]);

  // ✅ активный тред (для title/status/close flags)
  const activeThread = useMemo(() => {
    if (!activeThreadId) return null;
    return threads.find((t) => t.id === activeThreadId) ?? null;
  }, [threads, activeThreadId]);

  const isClosed = (activeThread?.item_status ?? "") === "CLOSED";
  const iRequestedClose = !!activeThread?.close_me;
  const peerRequestedClose = !!activeThread?.close_peer;

  const canSend = !!activeThreadId && !isClosed && !iRequestedClose;

  // 5) Socket.IO connect + join thread room
  useEffect(() => {
    if (!activeThreadId) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      setMeError("Нет access_token. Перезайди в аккаунт.");
      return;
    }

    // закрываем старый сокет
    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch {}
      socketRef.current = null;
    }

    const s = io("http://127.0.0.1:8000", {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
      auth: { token },
    });

    socketRef.current = s;

    s.on("connect", () => {
      s.emit("chat:join", { threadId: activeThreadId });
    });

    s.on("chat:history", (payload: any) => {
      if (!payload || Number(payload.threadId) !== activeThreadId) return;

      const raw = Array.isArray(payload.messages) ? payload.messages : [];
      const mapped: UiMessage[] = raw.map((m: any) => ({
        threadId: Number(m.threadId),
        senderId: Number(m.senderId),
        text: String(m.text ?? ""),
        clientId: m.clientId ?? null,
        createdAt: m.createdAt ?? null,
      }));
      setMessages(mapped);
    });

    s.on("chat:message", (m: any) => {
      if (!m || Number(m.threadId) !== activeThreadId) return;

      setMessages((prev) => {
        if (m.clientId && prev.some((x) => x.clientId === m.clientId)) return prev;

        return [
          ...prev,
          {
            threadId: Number(m.threadId),
            senderId: Number(m.senderId),
            text: String(m.text ?? ""),
            clientId: m.clientId ?? null,
            createdAt: m.createdAt ?? null,
          },
        ];
      });

      void loadThreads();
    });

    s.on("connect_error", (err: any) => {
      console.error("socket connect_error:", err?.message || err);
      setMeError("Socket.IO: не удалось подключиться (unauthorized или сервер недоступен).");
    });

    return () => {
      try {
        s.disconnect();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId]);

  // ✅ Заголовок/мета с названием + статусом
  const activeTitle = useMemo(() => {
    if (!activeThreadId) return "Выберите диалог";
    const name =
      activeThread?.item_title ??
      (activeItemId ? `Item #${activeItemId}` : `Thread #${activeThreadId}`);
    return `Чат: ${name}`;
  }, [activeThreadId, activeItemId, activeThread?.item_title]);

  const activeMeta = useMemo(() => {
    if (!activeThreadId) return "";
    const peer = activePeerId ? `peer: ${activePeerId}` : "peer: ?";
    const st = activeThread?.item_status ? `${activeThread.item_status} • ` : "";
    return `${st}me: ${meId} • ${peer}`;
  }, [activeThreadId, activePeerId, meId, activeThread?.item_status]);

  // ✅ Закрытие (фронт просто “я подтвердил”; CLOSED должен ставить бэк, когда оба подтвердили)
  async function closeActiveThread() {
    if (!activeThreadId) return;
    setCloseLoading(true);
    try {
      await api.post(`/chat/threads/${activeThreadId}/close`);
      await loadThreads();
    } finally {
      setCloseLoading(false);
      setCloseConfirmOpen(false);
    }
  }

  async function submitReport() {
    if (!activeThreadId) return;
    setReportLoading(true);
    setReportMsg(null);

    try {
      await api.post(`/chat/threads/${activeThreadId}/report`, {
        reason: reportReason,
        details: reportReason === "other" ? reportDetails : null,
      });
      setReportMsg("Жалоба отправлена.");
      setReportOpen(false);
      setReportDetails("");
      setReportReason("scam");
    } catch (e: any) {
      const status = e?.response?.status;
      const detail = e?.response?.data?.detail;

      if (status === 409) setReportMsg("Жалоба уже отправлена по этому чату.");
      else if (status === 403) setReportMsg("Ваш аккаунт ограничен.");
      else setReportMsg(detail ?? "Не удалось отправить жалобу.");
    } finally {
      setReportLoading(false);
    }
  }

  const send = () => {
    const s = socketRef.current;
    if (!s || !activeThreadId) return;
    if (!canSend) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    const clientId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? (crypto as any).randomUUID()
        : String(Date.now());

    s.emit("chat:message", {
      threadId: activeThreadId,
      text: trimmed,
      clientId,
    });

    setText("");
  };

  // UI состояния
  if (meLoading) {
    return (
      <>
        <Seo
          title="Chat - Campus Lost&Found"
          description="Private chat in Campus Lost&Found"
          canonicalUrl={`${window.location.origin}/chat`}
          robots="noindex,nofollow"
        />
        <div className={styles.root}>
          <div style={{ padding: 16 }}>Загрузка профиля...</div>
        </div>
      </>
    );
  }

  if (meError) {
    return (
      <>
        <Seo
          title="Chat - Campus Lost&Found"
          description="Private chat in Campus Lost&Found"
          canonicalUrl={`${window.location.origin}/chat`}
          robots="noindex,nofollow"
        />
        <div className={styles.root}>
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 12 }}>{meError}</div>
            <button onClick={() => navigate("/login")}>Перейти к входу</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo
        title="Chat - Campus Lost&Found"
        description="Private chat in Campus Lost&Found"
        canonicalUrl={`${window.location.origin}/chat`}
        robots="noindex,nofollow"
      />

      <div className={styles.root}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>Диалоги</div>

          {threadsLoading ? (
            <div style={{ padding: 12, opacity: 0.7 }}>Загрузка...</div>
          ) : threads.length === 0 ? (
            <div style={{ padding: 12, opacity: 0.7 }}>
              Пока нет диалогов. Открой чат из карточки объявления.
            </div>
          ) : (
            threads.map((t) => {
              const isActive = t.id === activeThreadId;
              return (
                <div
                  key={t.id}
                  className={styles.dialogItem}
                  style={{ cursor: "pointer", opacity: isActive ? 1 : 0.9 }}
                  onClick={() => {
                    setActiveThreadId(t.id);
                    setActiveItemId(t.item_id);
                    setActivePeerId(t.peer_id);
                    setMessages([]);
                    navigate(`/chat?threadId=${t.id}`, { replace: true });
                  }}
                >
                  <div className={styles.dialogTitle}>
                    {t.item_title ?? `Item #${t.item_id}`}
                  </div>
                  <div className={styles.dialogMeta}>
                    {t.item_status ? `${t.item_status} • ` : ""}
                    peer: {t.peer_id}
                    {t.last_message_text ? ` • ${t.last_message_text}` : ""}
                  </div>
                </div>
              );
            })
          )}
        </aside>

        <div className={styles.chatColumn}>
          <div className={styles.chatHeader}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                gap: 12,
              }}
            >
              <div>
                <div className={styles.chatTitle}>{activeTitle}</div>

                {activeThreadId ? (
                  <div className={styles.chatMeta}>
                    {activeMeta}

                    {!isClosed && (iRequestedClose || peerRequestedClose) ? (
                      <span style={{ marginLeft: 10, opacity: 0.8 }}>
                        {iRequestedClose && !peerRequestedClose
                          ? "Вы подтвердили завершение • ждём второго участника"
                          : !iRequestedClose && peerRequestedClose
                            ? "Второй участник хочет завершить чат"
                            : iRequestedClose && peerRequestedClose
                              ? "Оба подтвердили завершение"
                              : null}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div className={styles.chatMeta} style={{ opacity: 0.7 }}>
                    Выбери диалог слева
                  </div>
                )}
              </div>

              {activeThreadId && !isClosed ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    type="button"
                    className={styles.reportBtn}
                    onClick={() => {
                      setReportMsg(null);
                      setReportOpen(true);
                    }}
                    disabled={reportLoading}
                  >
                    Пожаловаться
                  </button>

                  {!iRequestedClose ? (
                    <button
                      type="button"
                      className={styles.closeChatBtn}
                      onClick={() => setCloseConfirmOpen(true)}
                      disabled={closeLoading}
                    >
                      Завершить чат
                    </button>
                  ) : (
                    <button type="button" disabled style={{ opacity: 0.7 }}>
                      Ожидаем второго участника…
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.messages}>
            {!activeThreadId ? (
              <div style={{ opacity: 0.7 }}>Нет активного диалога.</div>
            ) : messages.length === 0 ? (
              <div style={{ opacity: 0.7 }}>Сообщений пока нет. Напиши первым 🙂</div>
            ) : (
              messages.map((m, idx) => {
                const outgoing = m.senderId === meId;
                return (
                  <div
                    key={m.clientId ?? idx}
                    className={outgoing ? styles.messageOutgoing : styles.messageIncoming}
                  >
                    {m.text}
                  </div>
                );
              })
            )}
          </div>

          {/* ✅ низ: если CLOSED — блок отправки НЕ рисуем */}
          {isClosed ? (
            <div
              className={styles.inputRow}
              style={{ opacity: 0.7, justifyContent: "center" }}
            >
              Чат закрыт
            </div>
          ) : (
            <div className={styles.inputRow}>
              <input
                className={styles.input}
                placeholder={
                  !activeThreadId
                    ? "Выберите диалог слева"
                    : iRequestedClose
                      ? "Вы подтвердили завершение — ждём второго участника"
                      : "Написать сообщение"
                }
                value={text}
                disabled={!activeThreadId || iRequestedClose}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
              />
              <button
                className={styles.sendBtn}
                onClick={send}
                disabled={!activeThreadId || iRequestedClose}
              >
                Отправить
              </button>
            </div>
          )}

          {/* ✅ модалка подтверждения */}
          {closeConfirmOpen && (
            <div
              className={styles.modalOverlay}
              role="dialog"
              aria-modal="true"
              onClick={() => setCloseConfirmOpen(false)}
            >
              <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalTitle}>Подтверждение</div>
                <div className={styles.modalText}>
                  Уверены, что хотите завершить чат?
                  <br />
                  Чат станет CLOSED только когда оба участника подтвердят завершение.
                  <br />
                  После вашего подтверждения вы не сможете писать, пока второй не подтвердит.
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.modalSecondary}
                    onClick={() => setCloseConfirmOpen(false)}
                    disabled={closeLoading}
                  >
                    Отмена
                  </button>

                  <button
                    type="button"
                    className={styles.modalPrimary}
                    onClick={() => void closeActiveThread()}
                    disabled={closeLoading}
                  >
                    Да, завершить
                  </button>
                </div>
              </div>
            </div>
          )}

          {reportOpen && (
            <div
              className={styles.modalOverlay}
              role="dialog"
              aria-modal="true"
              onClick={() => setReportOpen(false)}
            >
              <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalTitle}>Пожаловаться</div>
                <div className={styles.modalText}>Выберите причину жалобы:</div>

                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  <label>
                    <input
                      type="radio"
                      name="reason"
                      checked={reportReason === "scam"}
                      onChange={() => setReportReason("scam")}
                    />{" "}
                    Мошенничество
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="reason"
                      checked={reportReason === "false_connection"}
                      onChange={() => setReportReason("false_connection")}
                    />{" "}
                    Ложное соединение
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="reason"
                      checked={reportReason === "other"}
                      onChange={() => setReportReason("other")}
                    />{" "}
                    Другое
                  </label>

                  {reportReason === "other" && (
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Опишите причину..."
                      style={{ width: "100%", minHeight: 80, padding: 8 }}
                    />
                  )}

                  {reportMsg && <div style={{ color: "crimson" }}>{reportMsg}</div>}
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.modalSecondary}
                    onClick={() => setReportOpen(false)}
                    disabled={reportLoading}
                  >
                    Отмена
                  </button>

                  <button
                    type="button"
                    className={styles.modalPrimary}
                    onClick={() => void submitReport()}
                    disabled={
                      reportLoading ||
                      (reportReason === "other" && !reportDetails.trim())
                    }
                  >
                    Отправить
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}