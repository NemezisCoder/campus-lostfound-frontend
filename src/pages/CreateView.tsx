import styles from "./CreateView.module.css";

export default function CreateView() {
  return (
    <div className={styles.root}>
      <div className={styles.formCard}>
        <div className={styles.title}>Создать пост</div>

        <div className={styles.formBody}>
          <div className={styles.typeRow}>
            <button className={styles.typePrimary}>Потерял</button>
            <button className={styles.typeSecondary}>Нашёл</button>
          </div>

          <div className={styles.dropzone}>Перетащи фото сюда</div>

          <input
            className={styles.input}
            placeholder="Название"
          />
          <textarea
            className={styles.textarea}
            rows={4}
            placeholder="Описание"
          />

          <div className={styles.metaGrid}>
            <select className={styles.metaControl}>
              <option>Категория</option>
            </select>
            <input
              className={styles.metaControl}
              placeholder="Дата/время"
            />
            <input
              className={styles.metaControl}
              placeholder="Место (кампус, корпус)"
            />
          </div>

          <button className={styles.submitBtn}>Опубликовать</button>
        </div>
      </div>

      <div className={styles.previewCard}>
        <div className={styles.title}>Предпросмотр + Похожие (ИИ)</div>

        <div className={styles.previewImage} />

        <div className={styles.previewGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.previewItem}>
              <div className={styles.previewThumb} />
              <div className={styles.previewCaption}>
                Похожий {i + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}