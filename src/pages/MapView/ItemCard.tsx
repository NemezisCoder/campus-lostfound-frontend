import styles from "./ItemCard.module.css";

export default function ItemCard() {
  return (
    <div className={styles.card}>
      <div className={styles.image} />
      <div className={styles.body}>
        <div className={styles.header}>
          <div className={styles.title}>Кошелёк чёрный</div>
          <span className={styles.status}>OPEN</span>
        </div>
        <div className={styles.meta}>
          Библиотека, 3 этаж • 2ч назад
        </div>
      </div>
    </div>
  );
}