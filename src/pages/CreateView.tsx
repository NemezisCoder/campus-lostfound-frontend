import { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CreateView.module.css";
import { PREVIEW_MAP_COORDS, RoomId } from "../data/roomCoords";
import type { MapItem } from "../api/items";
type ItemType = "lost" | "found";
type RoomValue = "" | RoomId;
type CategoryType = "electronics" | "clothes" | "personal" | "documents";

const ROOM_META: Record<
  RoomId,
  {
    roomLabel: string;
    floorLabel: string;
  }
> = {
  "A-101": { roomLabel: "А-101", floorLabel: "1 этаж" },
  "A-120": { roomLabel: "А-120", floorLabel: "1 этаж" },
  "A-165": { roomLabel: "А-165", floorLabel: "1 этаж" },
  "A-170": { roomLabel: "А-170", floorLabel: "1 этаж" },
};

const API_BASE = "http://localhost:8000/api/v1";

type Props = {
  onItemCreated: (item: MapItem) => void;
};

export default function CreateView({ onItemCreated }: Props) {
  const [type, setType] = useState<ItemType>("lost");
  const [room, setRoom] = useState<RoomValue>("");
  const [imageName, setImageName] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryType | "">("");
  const [datetime, setDatetime] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const coords = room ? PREVIEW_MAP_COORDS[room] : undefined;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImageName(file ? file.name : null);
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Введите название");
      return;
    }
    if (!category) {
      setError("Выберите категорию");
      return;
    }
    if (!room) {
      setError("Выберите аудиторию");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const meta = ROOM_META[room];

      // Формируем payload, как ждёт backend
      const payload = {
        title,
        type,
        status: "OPEN" as const,
        category: category as CategoryType,
        roomId: room,
        roomLabel: meta.roomLabel,
        floorLabel: meta.floorLabel,
        timeAgo: "только что", // можно потом заменить на реальное время
        description,
      };

      const res = await fetch(`${API_BASE}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to create item");
      }

      const created: MapItem = await res.json();

      // Добавляем новый item в список в App.tsx
      onItemCreated(created);

      // Сброс формы
      setTitle("");
      setDescription("");
      setCategory("");
      setRoom("");
      setDatetime("");
      setImageName(null);
      setType("lost");

      // Переходим на карту
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Не удалось опубликовать пост");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.root}>
      {/* Левая колонка — форма */}
      <div className={styles.formCard}>
        <div className={styles.title}>Создать пост</div>

        <form className={styles.formBody} onSubmit={handleSubmit}>
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
              style={{ display: "none" }}
            />
          </label>

          {/* Название / описание */}
          <input
            className={styles.input}
            placeholder="Название"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className={styles.textarea}
            rows={4}
            placeholder="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Категория, дата/время, место */}
          <div className={styles.metaGrid}>
            {/* Категория */}
            <select
              className={styles.metaControl}
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as CategoryType | "")
              }
            >
              <option value="" disabled>
                Категория
              </option>
              <option value="electronics">Электроника</option>
              <option value="clothes">Одежда</option>
              <option value="personal">Личные вещи</option>
              <option value="documents">Документы</option>
            </select>

            {/* Дата / время (пока просто текст, для бэка не используем) */}
            <input
              className={styles.metaControl}
              placeholder="Дата/время"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
            />

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

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Публикуем..." : "Опубликовать"}
          </button>
        </form>
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
              style={{ pointerEvents: "none" }}
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
