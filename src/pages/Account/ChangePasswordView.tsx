import { useState } from "react";
import AuthCard from "../Auth/AuthCard";
import Input from "../../components/Input";
import styles from "./ChangePasswordView.module.css";
import Seo from "../../components/Seo";

export default function ChangePasswordView({
  onBack,
}: {
  onBack: () => void;
}) {
  const [ok, setOk] = useState(false);

  return (
    <>
      <Seo
        title="Change Password - Campus Lost&Found"
        description="Change your Campus Lost&Found password"
        canonicalUrl={`${window.location.origin}/account/password`}
        robots="noindex,nofollow"
      />

      <AuthCard
        title="Change Password"
        subtitle="Update your account password"
      >
        {!ok ? (
          <div className={styles.form}>
            <Input placeholder="Current password" type="password" />
            <Input placeholder="New password" type="password" />
            <Input placeholder="Confirm new password" type="password" />

            <button
              onClick={() => setOk(true)}
              className={styles.saveBtn}
            >
              Save
            </button>

            <div className={styles.backRow}>
              <button className={styles.backBtn} onClick={onBack}>
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.successBlock}>
            <div className={styles.successText}>Пароль обновлён</div>
            <button
              onClick={onBack}
              className={styles.returnBtn}
            >
              Вернуться в настройки
            </button>
          </div>
        )}
      </AuthCard>
    </>
  );
}