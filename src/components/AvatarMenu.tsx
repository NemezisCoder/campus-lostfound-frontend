import { useState } from "react";
import MenuItem from "./MenuItem";
import styles from "./AvatarMenu.module.css";

export default function AvatarMenu({
  onProfile,
  onSettings,
  onLogout,
}: {
  onProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.root}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={styles.button}
      >
        <div className={styles.avatarCircle} />
        <span className={styles.name}>Анна</span>
      </button>

      {open && (
        <div className={styles.menu}>
          <MenuItem
            onClick={() => {
              setOpen(false);
              onProfile();
            }}
          >
            Профиль
          </MenuItem>
          <MenuItem
            onClick={() => {
              setOpen(false);
              onSettings();
            }}
          >
            Настройки
          </MenuItem>
          <div className={styles.divider} />
          <MenuItem
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="text-red-600"
          >
            Выйти
          </MenuItem>
        </div>
      )}
    </div>
  );
}
