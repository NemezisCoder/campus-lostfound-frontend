import Input from "../../components/Input";
import AuthCard from "./AuthCard";
import OrDivider from "./OrDivider";
import OauthButtons from "./OauthButtons";
import styles from "./LoginView.module.css";

export default function LoginView({
  onSignIn,
  onGoSignUp,
  onForgot,
}: {
  onSignIn: () => void;
  onGoSignUp: () => void;
  onForgot: () => void;
}) {
  return (
    <AuthCard
      title="Welcome Back"
      subtitle="Sign in to continue to Campus Lost&Found"
    >
      <div className={styles.root}>
        <Input placeholder="Email" type="email" />
        <Input placeholder="Password" type="password" />

        <div className={styles.forgotRow}>
          <button className={styles.forgotBtn} onClick={onForgot}>
            Forgot Password?
          </button>
        </div>

        <button onClick={onSignIn} className={styles.signInBtn}>
          Sign In
        </button>

        <OrDivider />
        <OauthButtons />

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
