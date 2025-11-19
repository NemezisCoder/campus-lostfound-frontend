import styles from "./Input.module.css";

export default function Input({
  placeholder,
  type = "text",
}: {
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      className={styles.input}
      placeholder={placeholder}
    />
  );
}
