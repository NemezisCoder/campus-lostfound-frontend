import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Filters from "./Filters";
import ItemCard from "./ItemCard";
import styles from "./MapView.module.css";
import { MAIN_MAP_COORDS } from "../../data/roomCoords";
import type {
  MapItem,
  ItemType,
  CategoryType,
  StatusType,
  SimilarMatch,
} from "../../api/items";
import { resolveMediaUrl } from "../../api/media";
import { deduplicateItem } from "../../api/items";
import { fetchMe } from "../../api/auth";

type TypeFilter = "all" | ItemType;
type CategoryFilter = "all" | CategoryType;
type StatusFilter = "all" | StatusType;

export default function MapView({
  drawerOpen,
  setDrawerOpen,
  items,
}: {
  drawerOpen: boolean;
  setDrawerOpen: (b: boolean) => void;
  items: MapItem[];
}) {
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState<number | null>(
    items[0]?.id ?? null
  );

  // если items обновились и выбранного id больше нет — выбираем первый
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

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Similar (ИИ)
  const [similarCandidates, setSimilarCandidates] = useState<SimilarMatch[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  // Confirm modal
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

  // meId (только через /auth/me)
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

  // Filter list and map items.
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const byType = typeFilter === "all" ? true : item.type === typeFilter;
      const byCategory =
        categoryFilter === "all" ? true : item.category === categoryFilter;
      const byStatus =
        statusFilter === "all" ? true : item.status === statusFilter;
      return byType && byCategory && byStatus;
    });
  }, [items, typeFilter, categoryFilter, statusFilter]);

  // Keep selected item inside filtered set (fallback to first).
  const selectedItem = useMemo(() => {
    return (
      filteredItems.find((item) => item.id === selectedId) ??
      filteredItems[0] ??
      null
    );
  }, [filteredItems, selectedId]);

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

  // кандидаты похожих
  // кандидаты похожих
  useEffect(() => {
    if (!drawerOpen || !selectedItem) {
      setSimilarCandidates([]);
      return;
    }

    let cancelled = false;

    // ✅ 1) сразу убираем старые "похожие", чтобы не мигало/не показывало чужие
    setSimilarCandidates([]);
    setSimilarLoading(true);

    console.log("selectedItem", selectedItem.id, selectedItem.image_url);

    deduplicateItem(selectedItem.id, 20, 0.0)
      .then((matches) => {
        // ✅ 2) лог, сколько пришло и что именно
        console.log("deduplicate matches:", matches.length, matches);

        if (!cancelled) setSimilarCandidates(matches);
      })
      .catch((err) => {
        console.log("deduplicate error:", err);
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
      .filter((m) => m.item?.status !== "CLOSED") // скрываем CLOSED
      .sort((a, b) => b.similarity - a.similarity);

    const strong = base.filter((m) => m.similarity >= SIMILARITY_THRESHOLD);

    // ✅ если сильных совпадений нет — показываем просто top-4 лучших
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
    // пока не знаем себя — ничего
    if (meId == null) return;

    // если мой item — ничего
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
            className={`${styles.marker} ${selectedItem.type === "lost"
              ? styles.markerLost
              : styles.markerFound
              }`}
            style={markerStyle}
          />
        )}

        {drawerOpen && selectedItem && (
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div className={styles.drawerTitle}>{selectedItem.title}</div>
              <button
                onClick={() => setDrawerOpen(false)}
                className={styles.closeBtn}
              >
                ×
              </button>
            </div>

            <div
              className={styles.drawerImage}
              role={canChatSelected ? "button" : undefined}
              tabIndex={canChatSelected ? 0 : -1}
              onClick={
                canChatSelected ? () => askChatForItem(selectedItem) : undefined
              }
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
                <div className={styles.similarEmpty}>
                  Похожих объявлений пока нет
                </div>
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
        <Filters
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        <div className={styles.items}>
          {filteredItems.map((item) => (
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
