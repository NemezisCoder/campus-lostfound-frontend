import Input from "../../components/Input";
import AuthCard from "./AuthCard";
import OrDivider from "./OrDivider";
import OauthButtons from "./OauthButtons";
import styles from "./SignUpView.module.css";

export default function SignUpView({
  onSignUp,
  onGoSignIn,
}: {
  onSignUp: () => void;
  onGoSignIn: () => void;
}) {
  return (
    <AuthCard
      title="Create Account"
      subtitle="Join Campus Lost&Found community"
    >
      <div className={styles.root}>
        <Input placeholder="Full Name" />
        <Input placeholder="Email" type="email" />
        <Input placeholder="Password" type="password" />

        <button onClick={onSignUp} className={styles.signUpBtn}>
          Sign Up
        </button>

        <OrDivider />
        <OauthButtons />

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
