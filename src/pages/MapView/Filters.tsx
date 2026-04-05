import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { CategoryType, ItemSort, ItemType, StatusType } from "../../api/items";
import styles from "./Filters.module.css";

type TypeFilter = "all" | ItemType;
type CategoryFilter = "all" | CategoryType;
type StatusFilter = "all" | StatusType;

function getTypeFilter(value: string | null): TypeFilter {
  if (value === "lost" || value === "found") return value;
  return "all";
}

function getCategoryFilter(value: string | null): CategoryFilter {
  if (
    value === "electronics" ||
    value === "clothes" ||
    value === "personal" ||
    value === "documents"
  ) {
    return value;
  }
  return "all";
}

function getStatusFilter(value: string | null): StatusFilter {
  if (value === "OPEN" || value === "IN_PROGRESS" || value === "CLOSED") {
    return value;
  }
  return "all";
}

function getSort(value: string | null): ItemSort {
  if (
    value === "id_desc" ||
    value === "id_asc" ||
    value === "title_asc" ||
    value === "title_desc"
  ) {
    return value;
  }
  return "id_desc";
}

function getPageSize(value: string | null): number {
  const parsed = Number(value);
  if (parsed === 10 || parsed === 20 || parsed === 50) return parsed;
  return 20;
}

export default function Filters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setSearchInput(searchParams.get("q") ?? "");
  }, [searchParams]);

  const typeFilter = getTypeFilter(searchParams.get("type"));
  const categoryFilter = getCategoryFilter(searchParams.get("category"));
  const statusFilter = getStatusFilter(searchParams.get("status"));
  const sort = getSort(searchParams.get("sort"));
  const pageSize = getPageSize(searchParams.get("page_size"));

  const updateParams = (updates: Record<string, string | null>, resetPage = true) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);

      Object.entries(updates).forEach(([key, value]) => {
        if (value == null || value === "" || value === "all") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });

      if (resetPage) {
        next.delete("page");
      }

      return next;
    });
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateParams({ q: searchInput.trim() || null });
  };

  const handleReset = () => {
    setSearchParams({});
  };

  return (
    <div className={styles.root}>
      <form
        onSubmit={handleSearchSubmit}
        style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}
      >
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Поиск по названию, описанию, аудитории"
          style={{
            flex: "1 1 220px",
            minWidth: 0,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.12)",
            outline: "none",
          }}
        />

        <button
          type="submit"
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.12)",
            background: "white",
            cursor: "pointer",
          }}
        >
          Найти
        </button>

        <button
          type="button"
          onClick={handleReset}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.12)",
            background: "white",
            cursor: "pointer",
          }}
        >
          Сброс
        </button>
      </form>

      <select
        className={styles.select}
        value={typeFilter}
        onChange={(e) => updateParams({ type: e.target.value })}
      >
        <option value="all">Тип: все</option>
        <option value="lost">Потеря</option>
        <option value="found">Находка</option>
      </select>

      <select
        className={styles.select}
        value={categoryFilter}
        onChange={(e) => updateParams({ category: e.target.value })}
      >
        <option value="all">Категория: все</option>
        <option value="electronics">Электроника</option>
        <option value="clothes">Одежда</option>
        <option value="personal">Личные вещи</option>
        <option value="documents">Документы</option>
      </select>

      <select
        className={styles.select}
        value={statusFilter}
        onChange={(e) => updateParams({ status: e.target.value })}
      >
        <option value="all">Статус: все</option>
        <option value="OPEN">OPEN</option>
        <option value="IN_PROGRESS">IN_PROGRESS</option>
        <option value="CLOSED">CLOSED</option>
      </select>

      <select
        className={styles.select}
        value={sort}
        onChange={(e) => updateParams({ sort: e.target.value })}
      >
        <option value="id_desc">Сначала новые</option>
        <option value="id_asc">Сначала старые</option>
        <option value="title_asc">Название A-Z</option>
        <option value="title_desc">Название Z-A</option>
      </select>

      <select
        className={styles.select}
        value={String(pageSize)}
        onChange={(e) => updateParams({ page_size: e.target.value })}
      >
        <option value="10">10 на странице</option>
        <option value="20">20 на странице</option>
        <option value="50">50 на странице</option>
      </select>
    </div>
  );
}