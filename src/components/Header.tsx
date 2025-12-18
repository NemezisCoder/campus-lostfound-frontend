import { useEffect, useState } from "react";
import NavBtn from "./NavBtn";
import AvatarMenu from "./AvatarMenu";
import { View } from "../types/view";
import styles from "./Header.module.css";
import { fetchMe } from "../api/auth";

export default function Header({
  view,
  setView,
  isAuthed,
  setIsAuthed,
}: {
  view: View;
  setView: (v: View) => void;
  isAuthed: boolean;
  setIsAuthed: (b: boolean) => void;
}) {
  const [userLabel, setUserLabel] = useState("Профиль");

  useEffect(() => {
    let cancelled = false;

    if (!isAuthed) {
      setUserLabel("Профиль");
      return;
    }

    fetchMe()
      .then((me: any) => {
        if (cancelled) return;

        const name = String(me?.name ?? "").trim();
        const surname = String(me?.surname ?? "").trim();
        const label = `${name}${surname ? " " + surname : ""}`.trim();

        setUserLabel(label || "Профиль");
      })
      .catch(() => {
        if (!cancelled) setUserLabel("Профиль");
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthed]);

  return (
    <header className={styles.header}>
      <div className={styles.logo}>Campus Lost&Found</div>

      <div className={styles.searchContainer}>
        <div className={styles.search}>
          <span className={`i-lucide-search ${styles.searchIcon}`} />
          <input
            className={styles.searchInput}
            placeholder="Поиск по названию, категории или месту"
          />
        </div>
      </div>

      <div className={styles.nav}>
        <NavBtn active={view === "map"} onClick={() => setView("map")}>
          Карта
        </NavBtn>
        <NavBtn active={view === "create"} onClick={() => setView("create")}>
          Создать пост
        </NavBtn>
        <NavBtn active={view === "chat"} onClick={() => setView("chat")}>
          Чат
        </NavBtn>

        {/* Модерация отключена, файл не удаляем */}
        {false && (
          <NavBtn
            active={view === "moderation"}
            onClick={() => setView("moderation")}
          >
            Модерация
          </NavBtn>
        )}

        {!isAuthed ? (
          <div className={styles.authButtons}>
            <button
              onClick={() => setView("login")}
              className={styles.authButton}
            >
              Войти
            </button>
            <button
              onClick={() => setView("register")}
              className={styles.authButtonPrimary}
            >
              Регистрация
            </button>
          </div>
        ) : (
          <AvatarMenu
            userLabel={userLabel}
            onProfile={() => setView("profile")}
            onSettings={() => setView("account")}
            onLogout={() => {
              setIsAuthed(false);
              setUserLabel("Профиль");
              setView("login");
            }}
          />
        )}
      </div>
    </header>
  );
}
