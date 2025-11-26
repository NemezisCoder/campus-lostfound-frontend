import { useState } from "react";
import Filters from "./Filters";
import ItemCard from "./ItemCard";
import styles from "./MapView.module.css";
import { MAIN_MAP_COORDS, RoomId } from "../../data/roomCoords";

type ItemType = "lost" | "found";
type StatusType = "OPEN" | "IN_PROGRESS" | "CLOSED";
type CategoryType = "electronics" | "clothes" | "personal" | "documents";

type MapItem = {
  id: number;
  title: string;
  type: ItemType;
  status: StatusType;
  category: CategoryType;
  roomId: RoomId;
  roomLabel: string; // Аудитория
  floorLabel: string; // Этаж
  timeAgo: string;
  description: string;
};

const ITEMS: MapItem[] = [
  {
    id: 1,
    title: "Кошелёк чёрный",
    type: "lost",
    status: "OPEN",
    category: "personal",
    roomId: "A-165",
    roomLabel: "А-165",
    floorLabel: "1 этаж",
    timeAgo: "2ч назад",
    description:
      "Потерян возле аудитории А-165. Внутри студенческий билет и банковская карта.",
  },
  {
    id: 2,
    title: "Наушники Apple AirPods Pro",
    type: "found",
    status: "IN_PROGRESS",
    category: "electronics",
    roomId: "A-120",
    roomLabel: "А-120",
    floorLabel: "1 этаж",
    timeAgo: "30 мин назад",
    description:
      "Найдены белые AirPods Pro в коридоре рядом с аудиторией А-120. Кейc с небольшой царапиной.",
  },
  {
    id: 3,
    title: "Зонт серый",
    type: "lost",
    status: "CLOSED",
    category: "personal",
    roomId: "A-101",
    roomLabel: "А-101",
    floorLabel: "1 этаж",
    timeAgo: "Сегодня утром",
    description:
      "Серый складной зонт, оставлен у входа в аудитории А-101. На ручке небольшая потертость.",
  },
  {
    id: 4,
    title: "Флешка SanDisk 32GB",
    type: "lost",
    status: "OPEN",
    category: "electronics",
    roomId: "A-170",
    roomLabel: "А-170",
    floorLabel: "1 этаж",
    timeAgo: "1ч назад",
    description:
      "Потеряна флешка SanDisk 32GB возле аудитории А-170. Металлический корпус, на брелке небольшая царапина.",
  },
  {
    id: 5,
    title: "Толстовка синяя",
    type: "found",
    status: "IN_PROGRESS",
    category: "clothes",
    roomId: "A-101",
    roomLabel: "А-101",
    floorLabel: "1 этаж",
    timeAgo: "10 мин назад",
    description:
      "Найдена синяя толстовка без надписей возле аудитории А-101. Оставлена на вешалке у входа.",
  },
  {
    id: 6,
    title: "Перчатки чёрные",
    type: "lost",
    status: "CLOSED",
    category: "clothes",
    roomId: "A-170",
    roomLabel: "А-170",
    floorLabel: "1 этаж",
    timeAgo: "Вчера",
    description:
      "Потеряны чёрные тканевые перчатки рядом с аудиторией А-170. Владелец уже найден.",
  },
  {
    id: 7,
    title: "Смартфон Xiaomi",
    type: "found",
    status: "OPEN",
    category: "electronics",
    roomId: "A-165",
    roomLabel: "А-165",
    floorLabel: "1 этаж",
    timeAgo: "5 мин назад",
    description:
      "Найден смартфон Xiaomi возле аудитории А-165. На чехле наклейка с котом.",
  },
];


type TypeFilter = "all" | ItemType;
type CategoryFilter = "all" | CategoryType;
type StatusFilter = "all" | StatusType;

export default function MapView({
  drawerOpen,
  setDrawerOpen,
}: {
  drawerOpen: boolean;
  setDrawerOpen: (b: boolean) => void;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(
    ITEMS[0]?.id ?? null,
  );

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Отфильтрованные элементы для списка и карты
  const filteredItems = ITEMS.filter((item) => {
    const byType =
      typeFilter === "all" ? true : item.type === typeFilter;
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
