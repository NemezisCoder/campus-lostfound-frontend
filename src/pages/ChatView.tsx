import styles from "./ChatView.module.css";

export default function ChatView() {
  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTitle}>Диалоги</div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={styles.dialogItem}>
            <div className={styles.dialogTitle}>AirPods Pro</div>
            <div className={styles.dialogMeta}>Корпус A • OPEN</div>
          </div>
        ))}
      </aside>

      <div className={styles.chatColumn}>
        <div className={styles.chatHeader}>
          <div>
            <div className={styles.chatTitle}>Чат: AirPods Pro</div>
            <div className={styles.chatMeta}>OPEN • корпус A, 2 этаж</div>
          </div>
        </div>

        <div className={styles.messages}>
          <div className={styles.messageIncoming}>
            Привет! Это твои наушники?
          </div>
          <div className={styles.messageOutgoing}>
            Да, похоже мои! Спасибо 🙌
          </div>
        </div>

        <div className={styles.inputRow}>
          <input
            className={styles.input}
            placeholder="Написать сообщение"
          />
          <button className={styles.sendBtn}>Отправить</button>
        </div>
      </div>
    </div>
  );
}