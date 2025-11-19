import styles from "./Filters.module.css";

export default function Filters() {
  return (
    <div className={styles.root}>
      <select className={styles.select}>
        <option>Тип: все</option>
        <option>Потеря</option>
        <option>Находка</option>
      </select>

      <select className={styles.select}>
        <option>Категория</option>
        <option>Электроника</option>
        <option>Одежда</option>
      </select>

      <select className={styles.select}>
        <option>Статус</option>
        <option>OPEN</option>
        <option>IN_PROGRESS</option>
        <option>CLOSED</option>
      </select>
    </div>
  );
}
