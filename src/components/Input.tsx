import React from "react";
import styles from "./Input.module.css";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  placeholder: string;
};

export default function Input({ className, ...props }: Props) {
  return (
    <input
      {...props}
      className={[styles.input, className].filter(Boolean).join(" ")}
    />
  );
}
