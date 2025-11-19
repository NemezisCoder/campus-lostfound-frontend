import styles from "./ModerationView.module.css";

export default function ModerationView() {
  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.sectionTitle}>Кандидаты на дубли</div>

        <div className={styles.candidatesGrid}>
          {[1, 2].map((k) => (
            <div key={k} className={styles.candidateCard}>
              <div className={styles.candidateImage} />
              <div className={styles.candidateBody}>
                <div className={styles.candidateTitle}>AirPods в кейсе</div>
                <div className={styles.candidateMeta}>
                  Сходство: 0.87
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.mergeBtn}>Объединить</button>
          <button className={styles.rejectBtn}>Отклонить</button>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.sectionTitle}>Правила модерации</div>
        <ul className={styles.rulesList}>
          <li>
            Сливай только если совпадают категория, место и визуальные признаки
          </li>
          <li>Сомневаешься — оставь раздельно</li>
          <li>Не трогай закрытые кейсы</li>
        </ul>
      </div>
    </div>
  );
}