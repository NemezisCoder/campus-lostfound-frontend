import { useEffect, useState } from "react";
import { View } from "../types/view";
import styles from "./TestRunner.module.css";

export default function TestRunner({ setView }: { setView: (v: View) => void }) {
  const [results, setResults] = useState<Array<{ name: string; ok: boolean; msg?: string }>>([]);

  useEffect(() => {
    const R: Array<{ name: string; ok: boolean; msg?: string }> = [];
    const pass = (name: string) => R.push({ name, ok: true });
    const fail = (name: string, msg: string) => R.push({ name, ok: false, msg });

    try {
      const map = document.querySelector('[data-testid="map-root"]');
      if (map) pass('MapView mounts with a single root container');
      else fail('MapView mounts with a single root container', '[data-testid=map-root] not found');

      setView('login');
      setTimeout(() => {
        const email = document.querySelector('input[placeholder="Email"]');
        if (email) pass('LoginView renders Email input');
        else fail('LoginView renders Email input', 'Email input not found');

        setView('map');
        setResults(R);
      }, 0);
    } catch (e: any) {
      fail('Unexpected test error', e?.message || String(e));
      setResults(R);
    }
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.title}>UI Smoke Tests</div>

      {results.length === 0 ? (
        <div className={styles.running}>Running…</div>
      ) : (
        <ul className={styles.list}>
          {results.map((r, i) => (
            <li key={i} className={r.ok ? styles.ok : styles.fail}>
              {r.ok ? "✓" : "✗"} {r.name}
              {r.msg ? `: ${r.msg}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
