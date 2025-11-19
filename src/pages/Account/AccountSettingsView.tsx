import { useState } from "react";
import Toggle from "../../components/Toggle";
import SettingRow from "../../components/SettingRow";
import styles from "./AccountSettingsView.module.css";

export default function AccountSettingsView({
  dark,
  setDark,
  onOpenChangePassword,
  onBack,
  onOpenAuth,
}: {
  dark: boolean;
  setDark: (b: boolean) => void;
  onOpenChangePassword: () => void;
  onBack: () => void;
  onOpenAuth: () => void;
}) {
  const [push, setPush] = useState(true);
  const [lang, setLang] = useState<"English" | "Русский">("English");

  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.headerRow}>
          <button onClick={onBack} className={styles.backBtn}>
            ← Back
          </button>
          <div className={styles.headerTitle}>Account</div>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionLabel}>Account</div>
          <SettingRow icon="🔐" label="Login / Register" onClick={onOpenAuth}>
            Перейти
          </SettingRow>
          <SettingRow icon="🛡" label="Privacy & Security">
            ›
          </SettingRow>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionLabel}>Preferences</div>
          <div className={styles.prefGrid}>
            <div className={styles.prefCard}>
              <div className={styles.prefLeft}>
                <div className={styles.prefIconBox}>🔔</div>
                <div className={styles.prefLabel}>Push Notifications</div>
              </div>
              <Toggle checked={push} onChange={setPush} />
            </div>

            <div className={styles.prefCard}>
              <div className={styles.prefLeft}>
                <div className={styles.prefIconBox}>🌙</div>
                <div className={styles.prefLabel}>Dark Mode</div>
              </div>
              <Toggle checked={dark} onChange={setDark} />
            </div>

            <div className={styles.prefCard}>
              <div className={styles.prefLeft}>
                <div className={styles.prefIconBox}>🌐</div>
                <div className={styles.prefLabel}>Language</div>
              </div>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as any)}
                className={styles.langSelect}
              >
                <option>English</option>
                <option>Русский</option>
              </select>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionLabel}>Security</div>
          <SettingRow
            icon="🔑"
            label="Change Password"
            onClick={onOpenChangePassword}
          >
            Изменить
          </SettingRow>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionLabel}>Support</div>
          <SettingRow icon="❓" label="Help Center">
            ›
          </SettingRow>
          <SettingRow icon="ℹ️" label="About">
            ›
          </SettingRow>
          <button className={styles.logoutBtn}>Logout</button>
          <div className={styles.version}>Version 1.0.0</div>
        </section>
      </div>
    </div>
  );
}