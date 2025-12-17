import { useState } from "react";
import Input from "../../components/Input";
import AuthCard from "./AuthCard";
import OrDivider from "./OrDivider";
import styles from "./SignUpView.module.css";
import { register, login } from "../../api/auth";

export default function SignUpView({
  onSignUp,
  onGoSignIn,
}: {
  onSignUp: () => void;
  onGoSignIn: () => void;
}) {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    setLoading(true);
    setErr(null);
    try {
      await register({ name, surname, email, password });

      await login(email, password);

      onSignUp();
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Create Account" subtitle="Join Campus Lost&Found community">
      <div className={styles.root}>
        <div className={styles.nameRow}>
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            placeholder="Surname"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
          />
        </div>

        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {err && <div style={{ color: "crimson", fontSize: 14 }}>{err}</div>}

        <button onClick={handleSignUp} className={styles.signUpBtn} disabled={loading}>
          {loading ? "Signing Up..." : "Sign Up"}
        </button>

        <OrDivider />

        <div className={styles.bottomText}>
          Already have an account?
          <button className={styles.linkBtn} onClick={onGoSignIn}>
            Sign In
          </button>
        </div>
      </div>
    </AuthCard>
  );
}
