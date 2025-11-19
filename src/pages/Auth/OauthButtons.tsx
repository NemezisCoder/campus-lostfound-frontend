import styles from "./OauthButtons.module.css";

export default function OauthButtons() {
  return (
    <div className={styles.root}>
      <button className={styles.btn}>Continue with Google</button>
      <button className={styles.btn}>Continue with Apple</button>
    </div>
  );
}
