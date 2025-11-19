import styles from "./OrDivider.module.css";

export default function OrDivider() {
  return (
    <div className={styles.root}>
      <div className={styles.line} />
      <div className={styles.text}>OR</div>
      <div className={styles.line} />
    </div>
  );
}
