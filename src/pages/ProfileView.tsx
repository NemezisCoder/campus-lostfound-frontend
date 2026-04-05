import { useEffect, useMemo, useState } from "react";
import { fetchMe } from "../api/auth";
import { deleteItem, fetchMyItems, type MapItem } from "../api/items";
import styles from "./ProfileView.module.css";

type ProfileTab = "lost" | "found";

export default function ProfileView({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) {
  const [meName, setMeName] = useState("Loading...");
  const [meEmail, setMeEmail] = useState("Loading...");
  const [items, setItems] = useState<MapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ProfileTab>("lost");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const [me, myItems] = await Promise.all([fetchMe(), fetchMyItems()]);

        if (cancelled) return;

        const fullName = me.email ?? "User";

        setMeName(fullName);
        setMeEmail(me.email ?? "No email");
        setItems(myItems);
      } catch {
        if (!cancelled) {
          setError("Failed to load profile data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const lostCount = useMemo(
    () => items.filter((item) => item.type === "lost").length,
    [items]
  );

  const foundCount = useMemo(
    () => items.filter((item) => item.type === "found").length,
    [items]
  );

  const visibleItems = useMemo(
    () => items.filter((item) => item.type === tab),
    [items, tab]
  );

  async function handleDelete(itemId: number) {
    const ok = window.confirm("Удалить это объявление?");
    if (!ok) return;

    try {
      setDeletingId(itemId);
      await deleteItem(itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch {
      alert("Не удалось удалить объявление");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.card}>
          <div className={styles.headerRow}>
            <div className={styles.avatar} />
            <div className={styles.userBlock}>
              <div className={styles.name}>{meName}</div>
              <div className={styles.email}>{meEmail}</div>
            </div>
            <button onClick={onOpenSettings} className={styles.settingsBtn}>
              Settings
            </button>
          </div>

          <div className={styles.statsGrid}>
            {[
              { label: "Lost Items", value: lostCount },
              { label: "Found Items", value: foundCount },
              { label: "Total Posts", value: items.length },
            ].map((c, i) => (
              <div key={i} className={styles.statCard}>
                <div className={styles.statValue}>{c.value}</div>
                <div className={styles.statLabel}>{c.label}</div>
              </div>
            ))}
          </div>

          <div className={styles.itemsBlock}>
            <div className={styles.itemsTabs}>
              <button
                className={tab === "lost" ? styles.tabActive : styles.tabInactive}
                onClick={() => setTab("lost")}
                type="button"
              >
                My Lost Items
              </button>
              <button
                className={tab === "found" ? styles.tabActive : styles.tabInactive}
                onClick={() => setTab("found")}
                type="button"
              >
                My Found Items
              </button>
            </div>

            {loading ? (
              <div className={styles.itemCard}>
                <div className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemTitle}>Loading...</div>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className={styles.itemCard}>
                <div className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemTitle}>{error}</div>
                  </div>
                </div>
              </div>
            ) : visibleItems.length === 0 ? (
              <div className={styles.itemCard}>
                <div className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemTitle}>No items yet</div>
                    <div className={styles.itemMeta}>
                      You do not have any {tab} items
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              visibleItems.map((item) => (
                <div key={item.id} className={styles.itemCard}>
                  <div className={styles.itemRow}>
                    <div className={styles.itemImage} />
                    <div className={styles.itemInfo}>
                      <div className={styles.itemTitle}>{item.title}</div>
                      <div className={styles.itemMeta}>
                        @ {item.roomLabel} - {item.timeAgo}
                      </div>
                    </div>

                    <button
                      className={styles.itemBtn}
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}