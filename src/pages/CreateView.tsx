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

function getAccessToken(): string | null {
  const candidates = [
    localStorage.getItem("access_token"),
    localStorage.getItem("token"),
    localStorage.getItem("authToken"),
    sessionStorage.getItem("access_token"),
    sessionStorage.getItem("token"),
    sessionStorage.getItem("authToken"),
  ];

  for (const value of candidates) {
    if (value && value.trim()) return value;
  }

  return null;
}

export default function CreateView({ onItemCreated }: Props) {
  const navigate = useNavigate();

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
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState<string | null>(null);
  const [pendingPublish, setPendingPublish] = useState<(() => Promise<void>) | null>(null);

  const coords = useMemo(() => {
    return room ? PREVIEW_MAP_COORDS[room] : undefined;
  }, [room]);

  const topSimilar = useMemo(() => {
    return [...similar].sort((a, b) => b.similarity - a.similarity).slice(0, 3);
  }, [similar]);

  function openConfirm(message: string, onConfirm: () => Promise<void>) {
    setConfirmText(message);
    setPendingPublish(() => onConfirm);
    setConfirmOpen(true);
  }

  function closeConfirm() {
    setConfirmOpen(false);
    setConfirmText(null);
    setPendingPublish(null);
  }

  useEffect(() => {
    if (!confirmOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeConfirm();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmOpen]);

  async function runSimilarSearch(selectedType: ItemType, file: File) {
    setIsSearching(true);
    setHasSearched(true);
    setError(null);

    try {
      const raw = await searchSimilarByImage(file, 8);

      const filtered = raw;
      console.log("raw", raw, "selectedType", selectedType);

      setSimilar(filtered);
      return filtered;
    } catch (err: any) {
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
    setUploadProgress(0);

    setSimilar([]);
    setHasSearched(false);
    setSuccess(null);
    setError(null);
  };

  const handleTypeClick = async (nextType: ItemType) => {
    setType(nextType);
    setSuccess(null);
    setError(null);

    if (imageFile) {
      await runSimilarSearch(nextType, imageFile);
    } else {
      setSimilar([]);
      setHasSearched(false);
    }
  };

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
    setUploadProgress(0);

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

      let finalItem = created;

      if (imageFile) {
        const token = getAccessToken();

        if (!token) {
          throw new Error("Не найден токен авторизации. Войдите в аккаунт снова.");
        }

        finalItem = await uploadItemImage(created.id, imageFile, token, setUploadProgress);
      }

      onItemCreated(finalItem);

      setSuccess("Пост опубликован ✅");

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
      setUploadProgress(0);
    };

    try {
      if (imageFile) {
        const matches = hasSearched ? similar : await runSimilarSearch(type, imageFile);

        const strongDuplicate = matches.find(
          (m) =>
            m.similarity >= DUPLICATE_THRESHOLD &&
            (m.item.status ?? "OPEN") !== "CLOSED",
        );

        if (strongDuplicate) {
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
        <div className={styles.formCard}>
          <div className={styles.title}>Создать пост</div>

          <form className={styles.formBody} onSubmit={handleSubmit}>
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

            <label className={styles.dropzone}>
              <span>{imageName ?? "Перетащи фото сюда или нажми, чтобы выбрать файл"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className={styles.fileInputHidden}
              />
            </label>

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

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className={styles.previewCaption}>Загрузка изображения: {uploadProgress}%</div>
            )}

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