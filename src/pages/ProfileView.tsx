import styles from "./ProfileView.module.css";

export default function ProfileView({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) {
  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.card}>
          <div className={styles.headerRow}>
            <div className={styles.avatar} />
            <div className={styles.userBlock}>
              <div className={styles.name}>Anna Smith</div>
              <div className={styles.email}>anna.smith@campus.edu</div>
            </div>
            <button
              onClick={onOpenSettings}
              className={styles.settingsBtn}
            >
              Settings
            </button>
          </div>

          <div className={styles.statsGrid}>
            {[
              { label: "Lost Items", value: 1 },
              { label: "Found Items", value: 0 },
              { label: "Total Posts", value: 1 },
            ].map((c, i) => (
              <div key={i} className={styles.statCard}>
                <div className={styles.statValue}>{c.value}</div>
                <div className={styles.statLabel}>{c.label}</div>
              </div>
            ))}
          </div>

          <div className={styles.itemsBlock}>
            <div className={styles.itemsTabs}>
              <button className={styles.tabActive}>My Lost Items</button>
              <button className={styles.tabInactive}>My Found Items</button>
            </div>

            <div className={styles.itemCard}>
              <div className={styles.itemRow}>
                <div className={styles.itemImage} />
                <div className={styles.itemInfo}>
                  <div className={styles.itemTitle}>iPhone 13 Pro</div>
                  <div className={styles.itemMeta}>
                    @ Main Library — 2025-10-07
                  </div>
                </div>
                <button className={styles.itemBtn}>Открыть</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}