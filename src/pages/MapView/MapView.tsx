import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Filters from "./Filters";
import ItemCard from "./ItemCard";
import styles from "./MapView.module.css";
import { MAIN_MAP_COORDS } from "../../data/roomCoords";
import type { MapItem, ItemType, SimilarMatch } from "../../api/items";
import { resolveMediaUrl } from "../../api/media";
import { deduplicateItem } from "../../api/items";
import { fetchMe } from "../../api/auth";

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export default function MapView({
  drawerOpen,
  setDrawerOpen,
  items,
  itemsTotal,
  itemsPage,
  itemsPageSize,
}: {
  drawerOpen: boolean;
  setDrawerOpen: (b: boolean) => void;
  items: MapItem[];
  itemsTotal?: number;
  itemsPage?: number;
  itemsPageSize?: number;
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = itemsPage ?? parsePositiveInt(searchParams.get("page"), 1);
  const currentPageSize = itemsPageSize ?? parsePositiveInt(searchParams.get("page_size"), 20);
  const totalItems = itemsTotal ?? items.length;

  const [selectedId, setSelectedId] = useState<number | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (!items.length) {
      setSelectedId(null);
      return;
    }

    if (selectedId == null) {
      setSelectedId(items[0].id);
      return;
    }

    if (!items.some((x) => x.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  const [similarCandidates, setSimilarCandidates] = useState<SimilarMatch[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState<string>("");
  const [pendingGo, setPendingGo] = useState<null | (() => void)>(null);

  const openConfirm = (text: string, onYes: () => void) => {
    setConfirmText(text);
    setPendingGo(() => onYes);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmText("");
    setPendingGo(null);
  };

  useEffect(() => {
    if (!confirmOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeConfirm();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmOpen]);

  const [meId, setMeId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchMe()
      .then((me) => {
        if (!cancelled) setMeId(me.id);
      })
      .catch(() => {
        if (!cancelled) setMeId(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const ensureMeId = async (): Promise<number | null> => {
    if (meId != null) return meId;

    try {
      const me = await fetchMe();
      setMeId(me.id);
      return me.id;
    } catch {
      return null;
    }
  };

  const selectedItem = useMemo(() => {
    return items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  }, [items, selectedId]);

  const markerStyle = useMemo(() => {
    if (!selectedItem) return undefined;
    const coords = MAIN_MAP_COORDS[selectedItem.roomId];
    if (!coords) return undefined;
    return { left: `${coords.x}%`, top: `${coords.y}%` } as const;
  }, [selectedItem]);

  const drawerImg = resolveMediaUrl(selectedItem?.image_url);

  const canChatSelected = useMemo(() => {
    if (!selectedItem) return false;
    if (meId == null) return false;
    if (selectedItem.owner_id === meId) return false;
    return selectedItem.status === "OPEN";
  }, [selectedItem, meId]);

  const statusChipClass = useMemo(() => {
    const s = selectedItem?.status ?? "OPEN";
    if (s === "OPEN") return styles.statusOpen;
    if (s === "IN_PROGRESS") return styles.statusInProgress;
    if (s === "CLOSED") return styles.statusClosed;
    return styles.statusOpen;
  }, [selectedItem?.status]);

  const typeChipClass = useMemo(() => {
    return selectedItem?.type === "found" ? styles.typeFound : styles.typeLost;
  }, [selectedItem?.type]);

  useEffect(() => {
    if (!drawerOpen || !selectedItem) {
      setSimilarCandidates([]);
      return;
    }

    let cancelled = false;

    setSimilarCandidates([]);
    setSimilarLoading(true);

    deduplicateItem(selectedItem.id, 20, 0.0)
      .then((matches) => {
        if (!cancelled) setSimilarCandidates(matches);
      })
      .catch(() => {
        if (!cancelled) setSimilarCandidates([]);
      })
      .finally(() => {
        if (!cancelled) setSimilarLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [drawerOpen, selectedItem?.id]);

  const SIMILARITY_THRESHOLD = 0.7;

  const top4Similar = useMemo(() => {
    if (!selectedItem) return [];

    const targetType: ItemType = selectedItem.type === "lost" ? "found" : "lost";

    const base = [...similarCandidates]
      .filter((m) => m.item?.id !== selectedItem.id)
      .filter((m) => m.item?.type === targetType)
      .filter((m) => m.item?.status !== "CLOSED")
      .sort((a, b) => b.similarity - a.similarity);

    const strong = base.filter((m) => m.similarity >= SIMILARITY_THRESHOLD);

    return (strong.length ? strong : base).slice(0, 4);
  }, [similarCandidates, selectedItem]);

  const askChatForSimilar = async (m: SimilarMatch) => {
    const id = await ensureMeId();
    if (id == null) return;
    if (m.item.owner_id === id) return;

    openConfirm("Уверены, что хотите перейти в чат?", () => {
      navigate(`/chat?itemId=${m.item.id}&ownerId=${m.item.owner_id}`, {
        state: {
          itemId: m.item.id,
          ownerId: m.item.owner_id,
          similarity: m.similarity,
        },
      });
    });
  };

  const askChatForItem = (item: MapItem) => {
    if (meId == null) return;
    if (item.owner_id === meId) return;

    openConfirm("Уверены, что хотите перейти в чат?", () => {
      navigate(`/chat?itemId=${item.id}&ownerId=${item.owner_id}`, {
        state: {
          itemId: item.id,
          ownerId: item.owner_id,
        },
      });
    });
  };

  const updatePage = (page: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);

      if (page <= 1) {
        next.delete("page");
      } else {
        next.set("page", String(page));
      }

      return next;
    });
  };

  const canGoPrev = currentPage > 1;
  const canGoNext =
    typeof itemsTotal === "number"
      ? currentPage * currentPageSize < itemsTotal
      : items.length >= currentPageSize;

  return (
    <div className={styles.root} data-testid="map-root">
      <div className={styles.mapContainer}>
        <div className={styles.mapFrameWrapper}>
          <iframe
            title="Карта МТУСИ, 1 этаж"
            src="https://mtuci-map.vercel.app/"
            className={styles.mapFrame}
            loading="lazy"
          />
        </div>

        <div className={styles.cityBadge}>📍 Кампус МТУСИ • 1 этаж</div>

        {selectedItem && markerStyle && (
          <div
            className={`${styles.marker} ${
              selectedItem.type === "lost" ? styles.markerLost : styles.markerFound
            }`}
            style={markerStyle}
          />
        )}

        {drawerOpen && selectedItem && (
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div className={styles.drawerTitle}>{selectedItem.title}</div>
              <button onClick={() => setDrawerOpen(false)} className={styles.closeBtn}>
                ×
              </button>
            </div>

            <div
              className={styles.drawerImage}
              role={canChatSelected ? "button" : undefined}
              tabIndex={canChatSelected ? 0 : -1}
              onClick={canChatSelected ? () => askChatForItem(selectedItem) : undefined}
              onKeyDown={
                canChatSelected
                  ? (e) => {
                      if (e.key === "Enter") askChatForItem(selectedItem);
                    }
                  : undefined
              }
              style={{
                ...(drawerImg
                  ? {
                      backgroundImage: `url(${drawerImg})`,
                      backgroundSize: "contain",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                    }
                  : {}),
                cursor: canChatSelected ? "pointer" : "default",
              }}
              aria-label={
                canChatSelected ? "Перейти в чат с владельцем" : "Ваше объявление"
              }
            />

            <div className={styles.chipsRow}>
              <span className={`${styles.chip} ${typeChipClass}`}>
                {selectedItem.type === "lost" ? "Потеря" : "Нашёл"}
              </span>

              <span className={`${styles.chip} ${statusChipClass}`}>
                {selectedItem.status}
              </span>

              <span className={`${styles.chip} ${styles.chipPlace}`}>
                {selectedItem.roomLabel}, {selectedItem.floorLabel}
              </span>
            </div>

            <p className={styles.desc}>{selectedItem.description}</p>

            <div className={styles.similarBlock}>
              <div className={styles.similarTitle}>Похожие (ИИ)</div>

              {similarLoading ? (
                <div className={styles.similarGrid}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={styles.similarSkeleton} />
                  ))}
                </div>
              ) : top4Similar.length === 0 ? (
                <div className={styles.similarEmpty}>Похожих объявлений пока нет</div>
              ) : (
                <div className={styles.similarGrid}>
                  {top4Similar.map((m) => {
                    const img = resolveMediaUrl(m.item.image_url);
                    const canOpen = m.item.status === "OPEN";

                    return (
                      <button
                        key={m.item.id}
                        type="button"
                        className={styles.similarCardBtn}
                        onClick={canOpen ? () => askChatForSimilar(m) : undefined}
                        disabled={!canOpen}
                        title={!canOpen ? "Чат доступен только для OPEN" : undefined}
                      >
                        <div
                          className={styles.similarImage}
                          style={
                            img
                              ? {
                                  backgroundImage: `url(${img})`,
                                  backgroundSize: "contain",
                                  backgroundRepeat: "no-repeat",
                                  backgroundPosition: "center",
                                }
                              : undefined
                          }
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <aside className={styles.aside}>
        <Filters />

        <div
          style={{
            marginTop: 10,
            marginBottom: 10,
            fontSize: 14,
            opacity: 0.8,
          }}
        >
          Показано: {items.length}
          {typeof itemsTotal === "number" ? ` из ${itemsTotal}` : ""}
        </div>

        <div className={styles.items}>
          {items.map((item) => (
            <ItemCard
              key={item.id}
              title={item.title}
              place={`${item.roomLabel}, ${item.floorLabel}`}
              timeAgo={item.timeAgo}
              status={item.status}
              imageUrl={item.image_url}
              onClick={() => setSelectedId(item.id)}
              onDoubleClick={() => {
                setSelectedId(item.id);
                setDrawerOpen(true);
              }}
            />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginTop: 12,
          }}
        >
          <button
            type="button"
            onClick={() => updatePage(currentPage - 1)}
            disabled={!canGoPrev}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "white",
              cursor: canGoPrev ? "pointer" : "default",
              opacity: canGoPrev ? 1 : 0.5,
            }}
          >
            Назад
          </button>

          <div style={{ fontSize: 14 }}>
            Страница {currentPage}
          </div>

          <button
            type="button"
            onClick={() => updatePage(currentPage + 1)}
            disabled={!canGoNext}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "white",
              cursor: canGoNext ? "pointer" : "default",
              opacity: canGoNext ? 1 : 0.5,
            }}
          >
            Далее
          </button>
        </div>
      </aside>

      {confirmOpen && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          onClick={closeConfirm}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Подтверждение</div>
            <div className={styles.modalText}>{confirmText}</div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalSecondary}
                onClick={closeConfirm}
              >
                Отмена
              </button>

              <button
                type="button"
                className={styles.modalPrimary}
                onClick={() => {
                  pendingGo?.();
                  closeConfirm();
                }}
                disabled={!pendingGo}
              >
                Да
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}