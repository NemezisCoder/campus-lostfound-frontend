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
import Seo from "../../components/Seo";
import WeatherWidget from "../../components/WeatherWidget";

type MapViewProps = {
  drawerOpen: boolean;
  setDrawerOpen: (value: boolean) => void;
  items: MapItem[];
  itemsTotal?: number;
  itemsPage?: number;
  itemsPageSize?: number;
};

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function getReadableStatus(status: MapItem["status"]): string {
  switch (status) {
    case "OPEN":
      return "Открыто";
    case "IN_PROGRESS":
      return "В обработке";
    case "CLOSED":
      return "Закрыто";
    default:
      return status;
  }
}

export default function MapView({
  drawerOpen,
  setDrawerOpen,
  items,
  itemsTotal,
  itemsPage,
  itemsPageSize,
}: MapViewProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = itemsPage ?? parsePositiveInt(searchParams.get("page"), 1);
  const currentPageSize =
    itemsPageSize ?? parsePositiveInt(searchParams.get("page_size"), 20);
  const totalItems = itemsTotal ?? items.length;

  const [selectedId, setSelectedId] = useState<number | null>(items[0]?.id ?? null);
  const [similarCandidates, setSimilarCandidates] = useState<SimilarMatch[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pendingGo, setPendingGo] = useState<null | (() => void)>(null);

  const [meId, setMeId] = useState<number | null>(null);

  useEffect(() => {
    if (!items.length) {
      setSelectedId(null);
      return;
    }

    if (selectedId == null) {
      setSelectedId(items[0].id);
      return;
    }

    if (!items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

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

  useEffect(() => {
    if (!confirmOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeConfirm();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmOpen]);

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

    return {
      left: `${coords.x}%`,
      top: `${coords.y}%`,
    } as const;
  }, [selectedItem]);

  const drawerImg = resolveMediaUrl(selectedItem?.image_url);

  const canChatSelected = useMemo(() => {
    if (!selectedItem) return false;
    if (meId == null) return false;
    if (selectedItem.owner_id === meId) return false;
    return selectedItem.status === "OPEN";
  }, [selectedItem, meId]);

  const statusChipClass = useMemo(() => {
    const status = selectedItem?.status ?? "OPEN";
    if (status === "OPEN") return styles.statusOpen;
    if (status === "IN_PROGRESS") return styles.statusInProgress;
    if (status === "CLOSED") return styles.statusClosed;
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
      .filter((match) => match.item?.id !== selectedItem.id)
      .filter((match) => match.item?.type === targetType)
      .filter((match) => match.item?.status !== "CLOSED")
      .sort((a, b) => b.similarity - a.similarity);

    const strong = base.filter((match) => match.similarity >= SIMILARITY_THRESHOLD);

    return (strong.length ? strong : base).slice(0, 4);
  }, [similarCandidates, selectedItem]);

  const askChatForSimilar = async (match: SimilarMatch) => {
    const id = await ensureMeId();
    if (id == null) return;
    if (match.item.owner_id === id) return;

    openConfirm("Уверены, что хотите перейти в чат?", () => {
      navigate(`/chat?itemId=${match.item.id}&ownerId=${match.item.owner_id}`, {
        state: {
          itemId: match.item.id,
          ownerId: match.item.owner_id,
          similarity: match.similarity,
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

  const canonicalUrl = `${window.location.origin}/`;

  const visibleItemsForJsonLd = useMemo(
    () => items.filter((item) => item.status !== "CLOSED"),
    [items]
  );

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: visibleItemsForJsonLd.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${window.location.origin}/items/${item.id}`,
        name: item.title,
      })),
    }),
    [visibleItemsForJsonLd]
  );

  return (
    <>
      <Seo
        title="Campus Lost&Found — карта и список находок"
        description="Сервис поиска потерянных и найденных вещей на кампусе МТУСИ."
        canonicalUrl={canonicalUrl}
        robots="index,follow"
        jsonLd={jsonLd}
      />

      <main className={styles.page} data-testid="map-root">
        <section className={styles.hero} aria-labelledby="map-page-title">
          <h1 id="map-page-title" className={styles.pageTitle}>
            Campus Lost&amp;Found — сервис поиска потерянных и найденных вещей
          </h1>
          <p className={styles.pageLead}>
            Находите объявления о потерянных и найденных вещах на кампусе,
            фильтруйте по категории и локации, связывайтесь с владельцами.
          </p>
        </section>

        <section className={styles.weatherSection} aria-label="Погода на кампусе">
          <WeatherWidget />
        </section>

        <section aria-label="Карта и список объявлений">
          <div className={styles.root}>
            <section className={styles.mapContainer} aria-label="Карта объявлений">
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
                  aria-hidden="true"
                />
              )}

              {drawerOpen && selectedItem && (
                <aside
                  className={styles.drawer}
                  aria-label={`Карточка объявления: ${selectedItem.title}`}
                >
                  <div className={styles.drawerHeader}>
                    <h2 className={styles.drawerTitle}>{selectedItem.title}</h2>
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      className={styles.closeBtn}
                      aria-label="Закрыть карточку"
                    >
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
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              askChatForItem(selectedItem);
                            }
                          }
                        : undefined
                    }
                    style={
                      drawerImg
                        ? {
                            backgroundImage: `url(${drawerImg})`,
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                            cursor: canChatSelected ? "pointer" : "default",
                          }
                        : {
                            cursor: canChatSelected ? "pointer" : "default",
                          }
                    }
                    aria-label={
                      canChatSelected
                        ? "Перейти в чат с владельцем объявления"
                        : "Изображение объявления"
                    }
                  >
                    {!drawerImg && (
                      <div className={styles.drawerImagePlaceholder}>Изображение отсутствует</div>
                    )}
                  </div>

                  <div className={styles.chipsRow}>
                    <span className={`${styles.chip} ${typeChipClass}`}>
                      {selectedItem.type === "lost" ? "Потеря" : "Находка"}
                    </span>

                    <span className={`${styles.chip} ${statusChipClass}`}>
                      {getReadableStatus(selectedItem.status)}
                    </span>

                    <span className={`${styles.chip} ${styles.chipPlace}`}>
                      {selectedItem.roomLabel}, {selectedItem.floorLabel}
                    </span>
                  </div>

                  <p className={styles.desc}>{selectedItem.description}</p>

                  <section className={styles.similarBlock} aria-labelledby="similar-items-title">
                    <h3 id="similar-items-title" className={styles.similarTitle}>
                      Похожие объявления (ИИ)
                    </h3>

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
                        {top4Similar.map((match) => {
                          const img = resolveMediaUrl(match.item.image_url);
                          const canOpen = match.item.status === "OPEN";

                          return (
                            <button
                              key={match.item.id}
                              type="button"
                              className={styles.similarCardBtn}
                              onClick={canOpen ? () => askChatForSimilar(match) : undefined}
                              disabled={!canOpen}
                              title={!canOpen ? "Чат доступен только для открытых объявлений" : ""}
                              aria-label={`Открыть похожее объявление: ${match.item.title}`}
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
                              >
                                {!img && (
                                  <div className={styles.similarImagePlaceholder}>
                                    Нет фото
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </aside>
              )}
            </section>

            <section className={styles.aside} aria-label="Фильтры и список объявлений">
              <Filters />

              <div className={styles.resultsInfo}>
                Показано: {items.length}
                {typeof itemsTotal === "number" ? ` из ${totalItems}` : ""}
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

              <nav className={styles.pagination} aria-label="Навигация по страницам">
                <button
                  type="button"
                  onClick={() => updatePage(currentPage - 1)}
                  disabled={!canGoPrev}
                  className={styles.pageBtn}
                >
                  Назад
                </button>

                <div className={styles.pageIndicator}>Страница {currentPage}</div>

                <button
                  type="button"
                  onClick={() => updatePage(currentPage + 1)}
                  disabled={!canGoNext}
                  className={styles.pageBtn}
                >
                  Далее
                </button>
              </nav>
            </section>
          </div>
        </section>

        {confirmOpen && (
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            onClick={closeConfirm}
          >
            <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
              <h2 id="confirm-dialog-title" className={styles.modalTitle}>
                Подтверждение
              </h2>

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
      </main>
    </>
  );
}