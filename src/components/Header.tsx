import NavBtn from "./NavBtn";
import AvatarMenu from "./AvatarMenu";
import { View } from "../types/view";
import styles from "./Header.module.css";

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
        <NavBtn
          active={view === "moderation"}
          onClick={() => setView("moderation")}
        >
          Модерация
        </NavBtn>

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
            onProfile={() => setView("profile")}
            onSettings={() => setView("account")}
            onLogout={() => {
              setIsAuthed(false);
              setView("login");
            }}
          />
        )}
      </div>
    </header>
  );
}
