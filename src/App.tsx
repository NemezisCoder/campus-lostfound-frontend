import { useEffect, useState } from "react";
import { View } from "./types/view";
import Header from "./components/Header";
import MapView from "./pages/MapView/MapView";
import CreateView from "./pages/CreateView";
import ChatView from "./pages/ChatView";
import ModerationView from "./pages/ModerationView";
import LoginView from "./pages/Auth/LoginView";
import SignUpView from "./pages/Auth/SignUpView";
import ForgotView from "./pages/Auth/ForgotView";
import ProfileView from "./pages/ProfileView";
import AccountSettingsView from "./pages/Account/AccountSettingsView";
import ChangePasswordView from "./pages/Account/ChangePasswordView";
import TestRunner from "./tests/TestRunner";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

import styles from "./App.module.css";

export default function App() {
  const [view, setView] = useState<View>("map");
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [dark, setDark] = useState(false);
  const [showTests, setShowTests] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // URL -> view
  useEffect(() => {
    switch (location.pathname) {
      case "/":
        setView("map");
        break;
      case "/create":
        setView("create");
        break;
      case "/chat":
        setView("chat");
        break;
      case "/moderation":
        setView("moderation");
        break;
      case "/login":
        setView("login");
        break;
      case "/register":
        setView("register");
        break;
      case "/forgot":
        setView("forgot");
        break;
      case "/profile":
        setView("profile");
        break;
      case "/account":
        setView("account");
        break;
      case "/account/password":
        setView("change_password");
        break;
      default:
        setView("map");
    }
  }, [location.pathname]);

  // view -> URL (эта функция идёт в Header и TestRunner)
  const handleSetView = (v: View) => {
    setView(v);
    switch (v) {
      case "map":
        navigate("/");
        break;
      case "create":
        navigate("/create");
        break;
      case "chat":
        navigate("/chat");
        break;
      case "moderation":
        navigate("/moderation");
        break;
      case "login":
        navigate("/login");
        break;
      case "register":
        navigate("/register");
        break;
      case "forgot":
        navigate("/forgot");
        break;
      case "profile":
        navigate("/profile");
        break;
      case "account":
        navigate("/account");
        break;
      case "change_password":
        navigate("/account/password");
        break;
    }
  };

  return (
    <div
      className={
        dark
          ? `${styles.app} ${styles.appDark}`
          : styles.app
      }
    >
      <Header
        view={view}
        setView={handleSetView}
        isAuthed={isAuthed}
        setIsAuthed={setIsAuthed}
      />

      <Routes>
        {/* публичные страницы */}
        <Route
          path="/"
          element={
            <MapView
              drawerOpen={drawerOpen}
              setDrawerOpen={setDrawerOpen}
            />
          }
        />
        <Route path="/create" element={<CreateView />} />
        <Route path="/chat" element={<ChatView />} />
        <Route path="/moderation" element={<ModerationView />} />

        {/* авторизация */}
        <Route
          path="/login"
          element={
            <LoginView
              onSignIn={() => {
                setIsAuthed(true);
                handleSetView("map");
              }}
              onGoSignUp={() => handleSetView("register")}
              onForgot={() => handleSetView("forgot")}
            />
          }
        />
        <Route
          path="/register"
          element={
            <SignUpView
              onSignUp={() => {
                setIsAuthed(true);
                handleSetView("map");
              }}
              onGoSignIn={() => handleSetView("login")}
            />
          }
        />
        <Route
          path="/forgot"
          element={<ForgotView onBack={() => handleSetView("login")} />}
        />

        {/* профиль и настройки */}
        <Route
          path="/profile"
          element={
            <ProfileView
              onOpenSettings={() => handleSetView("account")}
            />
          }
        />
        <Route
          path="/account"
          element={
            <AccountSettingsView
              dark={dark}
              setDark={setDark}
              onOpenChangePassword={() =>
                handleSetView("change_password")
              }
              onBack={() => handleSetView("profile")}
              onOpenAuth={() => handleSetView("login")}
            />
          }
        />
        <Route
          path="/account/password"
          element={
            <ChangePasswordView
              onBack={() => handleSetView("account")}
            />
          }
        />

        {/* опциональный fallback */}
        <Route
          path="*"
          element={
            <MapView
              drawerOpen={drawerOpen}
              setDrawerOpen={setDrawerOpen}
            />
          }
        />
      </Routes>

      <button
        aria-label="Open test panel"
        onClick={() => setShowTests((v) => !v)}
        className={styles.testsButton}
      >
        🧪 Tests
      </button>

      {showTests && <TestRunner setView={handleSetView} />}
    </div>
  );
}
