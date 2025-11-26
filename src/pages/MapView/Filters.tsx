import styles from "./Filters.module.css";

type TypeFilter = "all" | "lost" | "found";
type CategoryFilter = "all" | "electronics" | "clothes" | "personal" | "documents";
type StatusFilter = "all" | "OPEN" | "IN_PROGRESS" | "CLOSED";

type FiltersProps = {
  typeFilter: TypeFilter;
  setTypeFilter: (v: TypeFilter) => void;
  categoryFilter: CategoryFilter;
  setCategoryFilter: (v: CategoryFilter) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
};

export default function Filters({
  typeFilter,
  setTypeFilter,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
}: FiltersProps) {
  return (
    <div className={styles.root}>
      {/* Тип */}
      <select
        className={styles.select}
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
      >
        <option value="all">Тип: все</option>
        <option value="lost">Потеря</option>
        <option value="found">Находка</option>
      </select>

      {/* Категория */}
      <select
        className={styles.select}
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
      >
        <option value="all">Категория</option>
        <option value="electronics">Электроника</option>
        <option value="clothes">Одежда</option>
        <option value="personal">Личные вещи</option>
      </select>

      {/* Статус */}
      <select
        className={styles.select}
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
      >
        <option value="all">Статус</option>
        <option value="OPEN">OPEN</option>
        <option value="IN_PROGRESS">IN_PROGRESS</option>
        <option value="CLOSED">CLOSED</option>
      </select>
    </div>
  );
}
