import NavBtn from "./NavBtn";
import AvatarMenu from "./AvatarMenu";
import { View } from "../types/view";
import styles from "./Header.module.css";
import type { MeResponse } from "../api/auth";

export default function Header({
  view,
  setView,
  me,
  meLoaded,
  onLogout,
}: {
  view: View;
  setView: (v: View) => void;
  me: MeResponse | null;
  meLoaded: boolean;
  onLogout: () => void;
}) {
  const isAuthed = !!me;
  const isBanned = !!me?.is_banned;
  const isAdmin = me?.role === "admin";

  const userLabel =
    isAuthed && meLoaded
      ? `${String(me?.name ?? "").trim()}${String(me?.surname ?? "").trim() ? " " + String(me?.surname ?? "").trim() : ""}`.trim() ||
        "Профиль"
      : "Профиль";

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

        {isAuthed && !isBanned && (
          <NavBtn active={view === "create"} onClick={() => setView("create")}>
            Создать пост
          </NavBtn>
        )}

        {isAuthed && !isBanned && (
          <NavBtn active={view === "chat"} onClick={() => setView("chat")}>
            Чат
          </NavBtn>
        )}

        {isAuthed && !isBanned && isAdmin && (
          <NavBtn active={view === "admin"} onClick={() => setView("admin")}>
            Администрирование
          </NavBtn>
        )}

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
            <button onClick={() => setView("login")} className={styles.authButton}>
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
            onLogout={onLogout}
          />
        )}
      </div>
    </header>
  );
}
