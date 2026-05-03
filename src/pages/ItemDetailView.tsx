import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Seo from "../components/Seo";
import { fetchItem, type MapItem } from "../api/items";
import { resolveMediaUrl } from "../api/media";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ItemDetailView() {
  const { id, slug } = useParams();
  const [item, setItem] = useState<MapItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) {
        setError("Item id is missing");
        setLoading(false);
        return;
      }

      try {
        const data = await fetchItem(Number(id));
        setItem(data);
      } catch (e: any) {
        setError(e?.response?.data?.detail ?? "Failed to load item");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  const imageUrl = resolveMediaUrl(item?.image_url);

  const itemSlug = item ? slugify(item.title) : slug ?? "";
  const canonicalUrl = item
    ? `${window.location.origin}/items/${item.id}/${itemSlug}`
    : `${window.location.origin}/items/${id}${slug ? `/${slug}` : ""}`;

  const title = item
    ? `${item.title} - Campus Lost&Found`
    : "Item - Campus Lost&Found";

  const description = item
    ? `${item.description || item.title}. Место: ${item.roomLabel}, ${item.floorLabel}.`
    : "Lost or found item at Campus Lost&Found.";

  const robots = item?.status === "CLOSED" ? "noindex,follow" : "index,follow";

  const jsonLd = useMemo(() => {
    if (!item) return undefined;

    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Thing",
          name: item.title,
          description: item.description || item.title,
          url: canonicalUrl,
          image: imageUrl || undefined,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Главная",
              item: `${window.location.origin}/`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Объявление",
              item: canonicalUrl,
            },
          ],
        },
      ],
    };
  }, [item, canonicalUrl, imageUrl]);

  if (loading) {
    return (
      <>
        <Seo
          title="Loading item - Campus Lost&Found"
          canonicalUrl={canonicalUrl}
          robots="noindex,nofollow"
        />
        <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
          <p>Загрузка...</p>
        </main>
      </>
    );
  }

  if (error || !item) {
    return (
      <>
        <Seo
          title="Item not found - Campus Lost&Found"
          canonicalUrl={canonicalUrl}
          robots="noindex,nofollow"
        />
        <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
          <h1>Объявление не найдено</h1>
          <p>{error ?? "Такого объявления нет."}</p>
          <Link to="/">Вернуться на главную</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Seo
        title={title}
        description={description}
        canonicalUrl={canonicalUrl}
        robots={robots}
        ogImageUrl={imageUrl || undefined}
        jsonLd={jsonLd}
      />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
        <nav aria-label="Хлебные крошки" style={{ marginBottom: 16 }}>
          <Link to="/">Главная</Link> / <span>{item.title}</span>
        </nav>

        <Link to="/" style={{ display: "inline-block", marginBottom: 16 }}>
          ← Назад к списку
        </Link>

        <article>
          <h1>{item.title}</h1>

          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.title}
              loading="eager"
              style={{
                width: "100%",
                maxWidth: 520,
                maxHeight: 420,
                objectFit: "contain",
                display: "block",
                marginBottom: 20,
                borderRadius: 12,
              }}
            />
          ) : null}

          <section style={{ display: "grid", gap: 10, fontSize: 16 }}>
            <div>
              <b>Тип:</b> {item.type === "lost" ? "Потеря" : "Находка"}
            </div>
            <div>
              <b>Статус:</b> {item.status}
            </div>
            <div>
              <b>Категория:</b> {item.category}
            </div>
            <div>
              <b>Место:</b> {item.roomLabel}, {item.floorLabel}
            </div>
            <div>
              <b>Когда:</b> {item.timeAgo}
            </div>
            <div>
              <b>Описание:</b> {item.description}
            </div>
          </section>
        </article>
      </main>
    </>
  );
}