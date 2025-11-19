import React from "react";
import styles from "./MenuItem.module.css";

export default function MenuItem({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`${styles.item} ${className || ""}`}
    >
      {children}
    </button>
  );
}
