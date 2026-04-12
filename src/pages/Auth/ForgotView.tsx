import Input from "../../components/Input";
import AuthCard from "./AuthCard";
import styles from "./ForgotView.module.css";
import Seo from "../../components/Seo";

export default function ForgotView({ onBack }: { onBack: () => void }) {
  return (
    <>
      <Seo
        title="Forgot Password - Campus Lost&Found"
        description="Reset your Campus Lost&Found password"
        canonicalUrl={`${window.location.origin}/forgot`}
        robots="noindex,nofollow"
      />

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
    </>
  );
}