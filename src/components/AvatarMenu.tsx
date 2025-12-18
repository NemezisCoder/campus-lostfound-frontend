import { useState } from "react";
import MenuItem from "./MenuItem";
import styles from "./AvatarMenu.module.css";

export default function AvatarMenu({
  userLabel,
  onProfile,
  onSettings,
  onLogout,
}: {
  userLabel: string;
  onProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.root}>
      <button onClick={() => setOpen((o) => !o)} className={styles.button}>
        <div className={styles.avatarCircle} />
        <span className={styles.name}>{userLabel}</span>
      </button>

      {open && (
        <div className={styles.menu}>
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
