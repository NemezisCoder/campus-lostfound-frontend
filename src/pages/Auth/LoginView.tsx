import { useState } from "react";
import Input from "../../components/Input";
import AuthCard from "./AuthCard";
import OrDivider from "./OrDivider";
import OauthButtons from "./OauthButtons";
import styles from "./LoginView.module.css";
import { login } from "../../api/auth";

export default function LoginView({
  onSignIn,
  onGoSignUp,
  onForgot,
}: {
  onSignIn: () => void;
  onGoSignUp: () => void;
  onForgot: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    setErr(null);
    try {
      await login(email, password);
      onSignIn();
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Welcome Back" subtitle="Sign in to continue to Campus Lost&Found">
      <div className={styles.root}>
        <Input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e: any) => setEmail(e.target.value)}
        />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e: any) => setPassword(e.target.value)}
        />

        {err && <div style={{ color: "crimson", fontSize: 14 }}>{err}</div>}

        <div className={styles.forgotRow}>
          <button className={styles.forgotBtn} onClick={onForgot}>
            Forgot Password?
          </button>
        </div>

        <button onClick={handleSignIn} className={styles.signInBtn} disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </button>

        <OrDivider />


        <div className={styles.bottomText}>
          Don't have an account?
          <button className={styles.linkBtn} onClick={onGoSignUp}>
            Sign Up
          </button>
        </div>
      </div>
    </AuthCard>
  );
}
