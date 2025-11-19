import styles from "./Toggle.module.css";

export default function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <label className={styles.label}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={styles.input}
      />
      <span
        className={`${styles.track} ${checked ? styles.trackChecked : ""
          }`}
      >
        <span
          className={`${styles.thumb} ${checked ? styles.thumbChecked : ""
            }`}
        />
      </span>
    </label>
  );
}
