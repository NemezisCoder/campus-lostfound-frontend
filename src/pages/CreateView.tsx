import { useEffect, useMemo, useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Seo from "../components/Seo";
import styles from "./CreateView.module.css";
import { PREVIEW_MAP_COORDS, RoomId } from "../data/roomCoords";
import type { MapItem, ItemCreatePayload, SimilarMatch } from "../api/items";
import { createItem, uploadItemImage, searchSimilarByImage } from "../api/items";
import { resolveMediaUrl } from "../api/media";

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

type Props = {
  onItemCreated: (item: MapItem) => void;
};

export default function CreateView({ onItemCreated }: Props) {
  const navigate = useNavigate();

  // No default selection: user must choose lost/found explicitly.
  const [type, setType] = useState<ItemType | null>(null);

  const [room, setRoom] = useState<RoomValue>("");
  const [imageName, setImageName] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [similar, setSimilar] = useState<SimilarMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryType | "">("");
  const [datetime, setDatetime] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Confirmation modal state (no window.confirm).
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState<string | null>(null);
  const [pendingPublish, setPendingPublish] = useState<(() => Promise<void>) | null>(
    null,
  );

  const coords = useMemo(() => {
    return room ? PREVIEW_MAP_COORDS[room] : undefined;
  }, [room]);

  // ✅ take top-3 by similarity (desc)
  const topSimilar = useMemo(() => {
    return [...similar].sort((a, b) => b.similarity - a.similarity).slice(0, 3);
  }, [similar]);

  // Helper: returns opposite type for matching.
  const getTargetType = (t: ItemType) => (t === "lost" ? "found" : "lost");

  // Helper: open modal and store continuation.
  function openConfirm(message: string, onConfirm: () => Promise<void>) {
    setConfirmText(message);
    setPendingPublish(() => onConfirm);
    setConfirmOpen(true);
  }

  // Helper: close modal and drop continuation.
  function closeConfirm() {
    setConfirmOpen(false);
    setConfirmText(null);
    setPendingPublish(null);
  }

  // UX: allow closing modal with Escape.
  useEffect(() => {
    if (!confirmOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeConfirm();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmOpen]);

  // Helper: run similarity search only when we have BOTH file + type.
  async function runSimilarSearch(selectedType: ItemType, file: File) {
    setIsSearching(true);
    setHasSearched(true);
    setError(null);

    try {
      const raw = await searchSimilarByImage(file, 8);

      // Show only opposite type matches (lost -> found, found -> lost).

      const filtered = raw; // временно для проверки
      console.log("raw", raw);
      setSimilar(filtered);
      return filtered;
    } catch (err: any) {
      // If backend requires auth, we surface a friendly message.
      const status = err?.response?.status;
      if (status === 401) {
        setError("Войдите в аккаунт, чтобы видеть похожие объявления.");
      }
      setSimilar([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setImageName(file ? file.name : null);
    setImageFile(file);

    // Do NOT auto-search on file selection.
    // Search should happen only after user selects lost/found.
    setSimilar([]);
    setHasSearched(false);
    setSuccess(null);
    setError(null);
  };

  const handleTypeClick = async (nextType: ItemType) => {
    setType(nextType);
    setSuccess(null);
    setError(null);

    // If user already picked a file, run search now.
    if (imageFile) {
      await runSimilarSearch(nextType, imageFile);
    } else {
      // No file -> no results.
      setSimilar([]);
      setHasSearched(false);
    }
  };

  // Anti-duplicate rule (MVP):
  // If there is a very similar ACTIVE item (status != CLOSED), ask user via modal.
  const DUPLICATE_THRESHOLD = 0.9;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccess(null);
    if (!imageFile) return setError("Прикрепите фото, чтобы опубликовать пост");
    if (!type) return setError("Выберите: Потерял или Нашёл");
    if (!title.trim()) return setError("Введите название");
    if (!category) return setError("Выберите категорию");
    if (!room) return setError("Выберите аудиторию");

    setError(null);
    setIsSubmitting(true);

    const doPublish = async () => {
      const meta = ROOM_META[room as RoomId];

      const payload: ItemCreatePayload = {
        title,
        type,
        category: category as CategoryType,
        roomId: room as RoomId,
        roomLabel: meta.roomLabel,
        floorLabel: meta.floorLabel,
        timeAgo: "только что",
        description,
      };

      const created = await createItem(payload);
      const finalItem = imageFile ? await uploadItemImage(created.id, imageFile) : created;

      onItemCreated(finalItem);

      setSuccess("Пост опубликован ✅");

      // Reset form.
      setTitle("");
      setDescription("");
      setCategory("");
      setRoom("");
      setDatetime("");
      setImageName(null);
      setImageFile(null);
      setSimilar([]);
      setHasSearched(false);
      setType(null);
    };

    try {
      // If we have an image, check duplicates BEFORE publishing.
      if (imageFile) {
        const matches = hasSearched ? similar : await runSimilarSearch(type, imageFile);

        const strongDuplicate = matches.find(
          (m) =>
            m.similarity >= DUPLICATE_THRESHOLD &&
            // Treat missing status as active (safety).
            (m.item.status ?? "OPEN") !== "CLOSED",
        );

        if (strongDuplicate) {
          // Stop submit spinner and ask user via modal.
          setIsSubmitting(false);

          openConfirm(
            `Найдено очень похожее объявление (${Math.round(
              strongDuplicate.similarity * 100,
            )}%).\n\nРекомендуем открыть похожее объявление и написать владельцу в чат.\n\nОпубликовать всё равно?`,
            async () => {
              setIsSubmitting(true);
              try {
                await doPublish();
                closeConfirm();
              } catch (err: any) {
                console.error(err);
                const msg =
                  err?.response?.data?.detail ||
                  err?.message ||
                  "Не удалось опубликовать пост";
                setError(String(msg));
              } finally {
                setIsSubmitting(false);
              }
            },
          );

          return;
        }
      }

      // No strong duplicates -> publish immediately.
      await doPublish();
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.detail || err?.message || "Не удалось опубликовать пост";
      setError(String(msg));
    } finally {
      setIsSubmitting(false);
    }
  }

  const previewTitle =
    type === "lost" ? "Я потерял" : type === "found" ? "Я нашёл" : "Выберите тип";

  return (
    <>
      <Seo
        title="Create Item - Campus Lost&Found"
        description="Create a new lost or found item"
        canonicalUrl={`${window.location.origin}/create`}
        robots="noindex,nofollow"
      />

      <div className={styles.root}>
        {/* Left column — form */}
        <div className={styles.formCard}>
          <div className={styles.title}>Создать пост</div>

          <form className={styles.formBody} onSubmit={handleSubmit}>
            {/* Lost / Found selection */}
            <div className={styles.typeRow}>
              <button
                type="button"
                className={type === "lost" ? styles.typePrimary : styles.typeSecondary}
                onClick={() => void handleTypeClick("lost")}
              >
                Потерял
              </button>
              <button
                type="button"
                className={type === "found" ? styles.typePrimary : styles.typeSecondary}
                onClick={() => void handleTypeClick("found")}
              >
                Нашёл
              </button>
            </div>

            {/* Image upload */}
            <label className={styles.dropzone}>
              <span>{imageName ?? "Перетащи фото сюда или нажми, чтобы выбрать файл"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className={styles.fileInputHidden}
              />
            </label>

            {/* Title / description */}
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

            {/* Category, datetime, room */}
            <div className={styles.metaGrid}>
              <select
                className={styles.metaControl}
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType | "")}
              >
                <option value="" disabled>
                  Категория
                </option>
                <option value="electronics">Электроника</option>
                <option value="clothes">Одежда</option>
                <option value="personal">Личные вещи</option>
                <option value="documents">Документы</option>
              </select>

              <input
                className={styles.metaControl}
                placeholder="Дата/время"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
              />

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
            {success && <div className={styles.success}>{success}</div>}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || !imageFile}
              title={!imageFile ? "Сначала прикрепите фото" : undefined}
            >
              {isSubmitting ? "Публикуем..." : "Опубликовать"}
            </button>
          </form>
        </div>

        {/* Right column — map + similar */}
        <div className={styles.previewCard}>
          <div className={styles.title}>{previewTitle} • Предпросмотр + Похожие (ИИ)</div>

          <div className={styles.previewImage}>
            <div className={styles.previewMapWrapper}>
              <iframe
                title="Карта МТУСИ, 1 этаж"
                src="https://mtuci-map.vercel.app/"
                className={styles.previewMapFrame}
                loading="lazy"
                style={{ pointerEvents: "none" }}
              />
              <div className={styles.previewCityBadge}>📍 Кампус МТУСИ • 1 этаж</div>

              {coords && (
                <div
                  className={`${styles.previewMarker} ${
                    type === "found" ? styles.previewMarkerFound : styles.previewMarkerLost
                  }`}
                  style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                />
              )}
            </div>
          </div>

          <div className={styles.previewGrid}>
            {!imageFile ? (
              <div className={styles.previewCaption}>
                Выберите фото, чтобы искать похожие объявления.
              </div>
            ) : !type ? (
              <div className={styles.previewCaption}>
                Теперь выберите: Потерял или Нашёл — и мы покажем похожие
                (противоположного типа).
              </div>
            ) : isSearching ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.previewItem}>
                  <div className={styles.previewThumb} />
                  <div className={styles.previewCaption}>Поиск...</div>
                </div>
              ))
            ) : hasSearched && topSimilar.length === 0 ? (
              <div className={styles.previewCaption}>
                Похожих объявлений не найдено. Можно публиковать.
              </div>
            ) : (
              topSimilar.map((m) => {
                const img = resolveMediaUrl(m.item.image_url);

                return (
                  <div
                    key={m.item.id}
                    className={styles.previewItem}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      navigate(`/chat?itemId=${m.item.id}&ownerId=${m.item.owner_id}`, {
                        state: {
                          itemId: m.item.id,
                          ownerId: m.item.owner_id,
                          similarity: m.similarity,
                        },
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        navigate(`/chat?itemId=${m.item.id}&ownerId=${m.item.owner_id}`, {
                          state: {
                            itemId: m.item.id,
                            ownerId: m.item.owner_id,
                            similarity: m.similarity,
                          },
                        });
                      }
                    }}
                  >
                    <div className={styles.previewThumb}>
                      {img ? (
                        <img
                          src={img}
                          alt={m.item.title}
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            display: "block",
                          }}
                        />
                      ) : null}
                    </div>

                    <div className={styles.previewCaption}>
                      {m.item.title} • {Math.round(m.similarity * 100)}%
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Confirmation modal */}
        {confirmOpen && (
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            onClick={closeConfirm}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalTitle}>Подтверждение</div>

              <div className={styles.modalText}>
                {(confirmText ?? "").split("\n").map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalSecondary}
                  onClick={closeConfirm}
                  disabled={isSubmitting}
                >
                  Отмена
                </button>

                <button
                  type="button"
                  className={styles.modalPrimary}
                  onClick={() => {
                    void pendingPublish?.();
                  }}
                  disabled={!pendingPublish || isSubmitting}
                >
                  Опубликовать всё равно
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}