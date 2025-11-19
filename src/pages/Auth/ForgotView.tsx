import Input from "../../components/Input";
import AuthCard from "./AuthCard";
import styles from "./ForgotView.module.css";

export default function ForgotView({ onBack }: { onBack: () => void }) {
  return (
    <AuthCard
      title="Reset Password"
      subtitle="Enter your email to receive reset link"
    >
      <div className={styles.root}>
        <Input placeholder="Email" type="email" />

        <button className={styles.sendBtn}>
          Send reset link
        </button>

        <div className={styles.backRow}>
          <button className={styles.backBtn} onClick={onBack}>
            Back to Sign In
          </button>
        </div>
      </div>
    </AuthCard>
  );
}
