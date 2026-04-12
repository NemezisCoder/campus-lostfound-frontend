import { useState } from "react";
import Toggle from "../../components/Toggle";
import SettingRow from "../../components/SettingRow";
import styles from "./AccountSettingsView.module.css";
import Seo from "../../components/Seo";

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
    <>
      <Seo
        title="Account Settings - Campus Lost&Found"
        description="Manage your Campus Lost&Found account settings"
        canonicalUrl={`${window.location.origin}/account`}
        robots="noindex,nofollow"
      />

      <div className={styles.root}>
        <div className={styles.inner}>
          <div className={styles.headerRow}>
            <button onClick={onBack} className={styles.backBtn}>
              ← Back
            </button>
            <h1 className={styles.headerTitle}>Account</h1>
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>Account</h2>
            <SettingRow icon="🔐" label="Login / Register" onClick={onOpenAuth}>
              Перейти
            </SettingRow>
            <SettingRow icon="🛡" label="Privacy & Security">
              ›
            </SettingRow>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>Preferences</h2>
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
            <h2 className={styles.sectionLabel}>Security</h2>
            <SettingRow
              icon="🔑"
              label="Change Password"
              onClick={onOpenChangePassword}
            >
              Изменить
            </SettingRow>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>Support</h2>
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
    </>
  );
}