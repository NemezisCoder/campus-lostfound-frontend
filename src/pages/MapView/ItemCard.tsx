import styles from "./ItemCard.module.css";

export interface ItemCardProps {
  title: string;
  place: string;
  timeAgo: string;
  status?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export default function ItemCard({
  title,
  place,
  timeAgo,
  status = "OPEN",
  onClick,
  onDoubleClick,
}: ItemCardProps) {
  return (
    <div className={styles.card} onClick={onClick} onDoubleClick={onDoubleClick}>
      <div className={styles.image} />
      <div className={styles.body}>
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          <span className={styles.status}>{status}</span>
        </div>
        <div className={styles.meta}>
          {place} • {timeAgo}
        </div>
      </div>
    </div>
  );
}
