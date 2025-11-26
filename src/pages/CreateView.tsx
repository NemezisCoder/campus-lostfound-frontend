import { useState, ChangeEvent } from "react";
import styles from "./CreateView.module.css";
import { PREVIEW_MAP_COORDS, RoomId } from "../data/roomCoords";
type ItemType = "lost" | "found";
type RoomValue = "" | RoomId;



export default function CreateView() {
  const [type, setType] = useState<ItemType>("lost");
  const [room, setRoom] = useState<RoomValue>("");
  const [imageName, setImageName] = useState<string | null>(null);

  const coords = room ? PREVIEW_MAP_COORDS[room] : undefined;



  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImageName(file ? file.name : null);
  };

  return (
    <div className={styles.root}>
      {/* Левая колонка — форма */}
      <div className={styles.formCard}>
        <div className={styles.title}>Создать пост</div>

        <div className={styles.formBody}>
          {/* Потерял / Нашёл */}
          <div className={styles.typeRow}>
            <button
              type="button"
              className={
                type === "lost" ? styles.typePrimary : styles.typeSecondary
              }
              onClick={() => setType("lost")}
            >
              Потерял
            </button>
            <button
              type="button"
              className={
                type === "found" ? styles.typePrimary : styles.typeSecondary
              }
              onClick={() => setType("found")}
            >
              Нашёл
            </button>
          </div>

          {/* Загрузка фото */}
          <label className={styles.dropzone}>
            <span>
              {imageName ??
                "Перетащи фото сюда или нажми, чтобы выбрать файл"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={styles.fileInputHidden}
              style={{ display: "none" }} // на всякий случай прячем инлайном
            />
          </label>

          {/* Название / описание */}
          <input className={styles.input} placeholder="Название" />
          <textarea
            className={styles.textarea}
            rows={4}
            placeholder="Описание"
          />

          {/* Категория, дата/время, место */}
          <div className={styles.metaGrid}>
            {/* Категория */}
            <select className={styles.metaControl} defaultValue="">
              <option value="" disabled>
                Категория
              </option>
              <option value="electronics">Электроника</option>
              <option value="clothes">Одежда</option>
              <option value="personal">Личные вещи</option>
            </select>

            {/* Дата / время */}
            <input className={styles.metaControl} placeholder="Дата/время" />

            {/* Место (аудитория) */}
            <select
              className={styles.metaControl}
              value={room}
              onChange={(e) => setRoom(e.target.value as RoomValue)}
            >
              <option value="">Место (аудитория)</option>
              <option value="A-101">А-101 • 1 этаж</option>
              <option value="A-120">А-120 • 1 этаж</option>
              <option value="A-165">А-165 • 1 этаж</option>
              <option value="A-170">А-170 • 1 этаж</option>
            </select>
          </div>


          <button className={styles.submitBtn}>Опубликовать</button>
        </div>
      </div>

      {/* Правая колонка — карта + похожие */}
      <div className={styles.previewCard}>
        <div className={styles.title}>
          {type === "lost" ? "Я потерял" : "Я нашёл"} • Предпросмотр + Похожие
          (ИИ)
        </div>

        {/* Большое окно с картой кампуса МТУСИ */}
        <div className={styles.previewImage}>
          <div className={styles.previewMapWrapper}>
            <iframe
              title="Карта МТУСИ, 1 этаж"
              src="https://mtuci-map.vercel.app/"
              className={styles.previewMapFrame}
              loading="lazy"
              style={{ pointerEvents: "none" }} // карта статичная, двигать нельзя
            />
            <div className={styles.previewCityBadge}>
              📍 Кампус МТУСИ • 1 этаж
            </div>

            {/* Маркер на карте */}
            {coords && (
              <div
                className={`${styles.previewMarker} ${type === "lost"
                  ? styles.previewMarkerLost
                  : styles.previewMarkerFound
                  }`}
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              />
            )}
          </div>
        </div>

        {/* Похожие (заглушки) */}
        <div className={styles.previewGrid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.previewItem}>
              <div className={styles.previewThumb} />
              <div className={styles.previewCaption}>Похожий {i + 1}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
