import { ReactNode } from "react";
import styles from "./SettingRow.module.css";

export default function SettingRow({
  icon,
  label,
  children,
  onClick,
}: {
  icon?: string;
  label: string;
  children?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className={styles.row}>
      <div className={styles.left}>
        <div className={styles.icon}>{icon || "•"}</div>
        <div className={styles.label}>{label}</div>
      </div>
      <div className={styles.right}>{children || ">"}</div>
    </button>
  );
}
