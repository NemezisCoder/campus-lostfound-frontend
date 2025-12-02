import { useState } from "react";
import Filters from "./Filters";
import ItemCard from "./ItemCard";
import styles from "./MapView.module.css";
import { MAIN_MAP_COORDS } from "../../data/roomCoords";
import type { MapItem, ItemType, CategoryType, StatusType } from "../../api/items";

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
  const [selectedId, setSelectedId] = useState<number | null>(
    items[0]?.id ?? null,
  );

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Отфильтрованные элементы для списка и карты
  const filteredItems = items.filter((item) => {
    const byType = typeFilter === "all" ? true : item.type === typeFilter;
    const byCategory =
      categoryFilter === "all" ? true : item.category === categoryFilter;
    const byStatus =
      statusFilter === "all" ? true : item.status === statusFilter;

    return byType && byCategory && byStatus;
  });

  // Выбранный элемент всегда из отфильтрованных
  const selectedItem =
    filteredItems.find((item) => item.id === selectedId) ??
    filteredItems[0] ??
    null;

  const markerStyle =
    selectedItem != null
      ? (() => {
        const coords = MAIN_MAP_COORDS[selectedItem.roomId];
        if (!coords) return undefined;
        return {
          left: `${coords.x}%`,
          top: `${coords.y}%`,
        };
      })()
      : undefined;

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

            <div className={styles.drawerImage} />

            <div className={styles.chipsRow}>
              <span className={styles.chipLoss}>
                {selectedItem.type === "lost" ? "Потеря" : "Нашёл"}
              </span>
              <span className={styles.chipOpen}>{selectedItem.status}</span>
              <span className={styles.chipPlace}>
                {selectedItem.roomLabel}, {selectedItem.floorLabel}
              </span>
            </div>

            <p className={styles.desc}>{selectedItem.description}</p>

            <div className={styles.similarBlock}>
              <div className={styles.similarTitle}>Похожие (ИИ)</div>
              <div className={styles.similarGrid}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={styles.similarCard}>
                    <div className={styles.similarImage} />
                    <div className={styles.similarCaption}>
                      {selectedItem.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.chatBtn}>Написать в чат</button>
              <button className={styles.reportBtn}>Пожаловаться</button>
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
              onDoubleClick={() => {
                setSelectedId(item.id);
                setDrawerOpen(true);
              }}
            />
          ))}
        </div>
      </aside>
    </div>
  );
}
