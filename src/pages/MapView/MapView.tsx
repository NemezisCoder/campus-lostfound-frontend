// src/pages/MapView/MapView.tsx
import Filters from "./Filters";
import ItemCard from "./ItemCard";
import styles from "./MapView.module.css";

export default function MapView({
  drawerOpen,
  setDrawerOpen,
}: {
  drawerOpen: boolean;
  setDrawerOpen: (b: boolean) => void;
}) {
  return (
    <div className={styles.root} data-testid="map-root">
      <div className={styles.mapContainer}>
        <div className={styles.mapFrameWrapper}>
          <iframe
            title="Moscow map"
            src="https://www.openstreetmap.org/export/embed.html?bbox=37.35,55.55,37.85,55.90&layer=mapnik&marker=55.7558,37.6173"
            className={styles.mapFrame}
            loading="lazy"
          />
        </div>

        <div className={styles.cityBadge}>📍 Москва</div>

        <div className={styles.markerOrange} />
        <div className={styles.markerBlue} />

        <button
          onClick={() => setDrawerOpen(true)}
          className={styles.openDrawerBtn}
        >
          Открыть карточку
        </button>

        {drawerOpen && (
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div className={styles.drawerTitle}>
                Наушники Apple AirPods Pro
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className={styles.closeBtn}
              >
                ×
              </button>
            </div>

            <div className={styles.drawerImage} />

            <div className={styles.chipsRow}>
              <span className={styles.chipLoss}>Потеря</span>
              <span className={styles.chipOpen}>OPEN</span>
              <span className={styles.chipPlace}>Корпус A, этаж 2</span>
            </div>

            <p className={styles.desc}>
              Потеряны возле аудитории 204. Белый кейс с царапиной. Нашедшего
              просьба написать.
            </p>

            <div className={styles.similarBlock}>
              <div className={styles.similarTitle}>Похожие (ИИ)</div>
              <div className={styles.similarGrid}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={styles.similarCard}>
                    <div className={styles.similarImage} />
                    <div className={styles.similarCaption}>
                      AirPods, корпус B
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
        <Filters />
        <div className={styles.items}>
          {Array.from({ length: 8 }).map((_, i) => (
            <ItemCard key={i} />
          ))}
        </div>
      </aside>
    </div>
  );
}
