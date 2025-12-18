import styles from "./ItemCard.module.css";
import { resolveMediaUrl } from "../../api/media";

export interface ItemCardProps {
  title: string;
  place: string;
  timeAgo: string;
  status?: string;
  imageUrl?: string | null;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export default function ItemCard({
  title,
  place,
  timeAgo,
  status = "OPEN",
  imageUrl,
  onClick,
  onDoubleClick,
}: ItemCardProps) {
  const img = resolveMediaUrl(imageUrl);

  const statusClass =
    status === "OPEN"
      ? styles.statusOpen
      : status === "IN_PROGRESS"
        ? styles.statusInProgress
        : status === "CLOSED"
          ? styles.statusClosed
          : styles.statusOpen;

  return (
    <div className={styles.card} onClick={onClick} onDoubleClick={onDoubleClick}>
      <div
        className={styles.image}
        style={
          img
            ? {
              backgroundImage: `url(${img})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }
            : undefined
        }
      />
      <div className={styles.body}>
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>

          <span className={`${styles.statusChip} ${statusClass}`}>{status}</span>
        </div>

        <div className={styles.meta}>
          {place} • {timeAgo}
        </div>
      </div>
    </div>
  );
}
