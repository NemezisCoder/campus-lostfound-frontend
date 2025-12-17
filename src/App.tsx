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
import type { MapItem } from "./api/items";
import { fetchItems } from "./api/items";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

import { api, setAccessToken } from "./api/client"; // ✅ добавили
import styles from "./App.module.css";

export default function App() {
  const [view, setView] = useState<View>("map");
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [dark, setDark] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [items, setItems] = useState<MapItem[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ 1) На старте пытаемся восстановить сессию через refresh-cookie
  useEffect(() => {
    (async () => {
      try {
        const r = await api.post("/auth/refresh");
        setAccessToken(r.data.access_token);
        setIsAuthed(true);
      } catch {
        setAccessToken(null);
        setIsAuthed(false);
      }
    })();
  }, []);

  // ✅ 2) Items грузим через axios (у тебя fetchItems уже axios)
  useEffect(() => {
    fetchItems()
      .then((data) => setItems(data))
      .catch((e) => console.error("Failed to load items:", e));
  }, []);

  function addItem(newItem: MapItem) {
    setItems((prev) => [newItem, ...prev]);
  }

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
    <div className={dark ? `${styles.app} ${styles.appDark}` : styles.app}>
      <Header
        view={view}
        setView={handleSetView}
        isAuthed={isAuthed}
        setIsAuthed={setIsAuthed}
      />

      <Routes>
        <Route
          path="/"
          element={
            <MapView drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} items={items} />
          }
        />
        <Route path="/create" element={<CreateView onItemCreated={addItem} />} />
        <Route path="/chat" element={<ChatView />} />
        <Route path="/moderation" element={<ModerationView />} />

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
        <Route path="/forgot" element={<ForgotView onBack={() => handleSetView("login")} />} />

        <Route
          path="/profile"
          element={<ProfileView onOpenSettings={() => handleSetView("account")} />}
        />
        <Route
          path="/account"
          element={
            <AccountSettingsView
              dark={dark}
              setDark={setDark}
              onOpenChangePassword={() => handleSetView("change_password")}
              onBack={() => handleSetView("profile")}
              onOpenAuth={() => handleSetView("login")}
            />
          }
        />
        <Route
          path="/account/password"
          element={<ChangePasswordView onBack={() => handleSetView("account")} />}
        />
      </Routes>



      {showTests && <TestRunner setView={handleSetView} />}
    </div>
  );
}
