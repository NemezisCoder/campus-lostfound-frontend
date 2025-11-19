import React from "react";
import styles from "./NavBtn.module.css";

export default function NavBtn({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`${styles.button} ${active ? styles.active : ""}`}
    >
      {children}
    </button>
  );
}
