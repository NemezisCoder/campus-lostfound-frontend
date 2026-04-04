import { useEffect, useState } from "react";
import { View } from "./types/view";
import Header from "./components/Header";
import MapView from "./pages/MapView/MapView";
import CreateView from "./pages/CreateView";
import ChatView from "./pages/ChatView";
import AdminView from "./pages/AdminView";
import LoginView from "./pages/Auth/LoginView";
import SignUpView from "./pages/Auth/SignUpView";
import ForgotView from "./pages/Auth/ForgotView";
import ProfileView from "./pages/ProfileView";
import AccountSettingsView from "./pages/Account/AccountSettingsView";
import ChangePasswordView from "./pages/Account/ChangePasswordView";
import TestRunner from "./tests/TestRunner";
import type { MapItem } from "./api/items";
import { fetchItems } from "./api/items";
import { Routes, Route, useNavigate, useLocation, Navigate, Outlet } from "react-router-dom";

import { clearTokens, getRefreshToken, setAccessToken, setRefreshToken } from "./api/client";
import { fetchMe, logout as apiLogout, type MeResponse } from "./api/auth";
import styles from "./App.module.css";

export default function App() {
  const [view, setView] = useState<View>("map");
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [meLoaded, setMeLoaded] = useState(false);
  const [dark, setDark] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [items, setItems] = useState<MapItem[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  async function loadMe() {
    try {
      const m = await fetchMe();
      setMe(m);
      setIsAuthed(true);
    } catch {
      setMe(null);
      setIsAuthed(false);
    } finally {
      setMeLoaded(true);
    }
  }

  async function doLogout() {
    try {
      await apiLogout();
    } finally {
      clearTokens();
      setMe(null);
      setIsAuthed(false);
      setMeLoaded(true);
      handleSetView("login");
    }
  }

  useEffect(() => {
    const handler = () => {
      clearTokens();
      setMe(null);
      setIsAuthed(false);
      setMeLoaded(true);
      handleSetView("login");
    };

    window.addEventListener("auth:invalid", handler);
    return () => window.removeEventListener("auth:invalid", handler);
  }, []);

  useEffect(() => {
    (async () => {
      const storedRefreshToken = getRefreshToken();

      if (!storedRefreshToken) {
        clearTokens();
        setMe(null);
        setIsAuthed(false);
        setMeLoaded(true);
        return;
      }

      try {
        const r = await fetch("/api/v1/auth/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh_token: storedRefreshToken,
          }),
        });

        if (!r.ok) {
          throw new Error("Refresh failed");
        }

        const data = await r.json();

        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);

        await loadMe();
      } catch {
        clearTokens();
        setMe(null);
        setIsAuthed(false);
        setMeLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    fetchItems()
      .then((data) => setItems(data))
      .catch((e) => console.error("Failed to load items:", e));
  }, []);

  function addItem(newItem: MapItem) {
    setItems((prev) => [newItem, ...prev]);
  }

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
      case "/admin":
        setView("admin");
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
      case "admin":
        navigate("/admin");
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

  function RequireAuth() {
    if (!meLoaded) return <div style={{ padding: 16 }}>Loading…</div>;
    return me ? <Outlet /> : <Navigate to="/login" replace />;
  }

  function RequireNotBanned() {
    if (!meLoaded) return <div style={{ padding: 16 }}>Loading…</div>;
    if (!me) return <Navigate to="/login" replace />;
    if (me.is_banned) return <Navigate to="/" replace />;
    return <Outlet />;
  }

  function RequireAdmin() {
    if (!meLoaded) return <div style={{ padding: 16 }}>Loading…</div>;
    if (!me) return <Navigate to="/login" replace />;
    if (me.is_banned) return <Navigate to="/" replace />;
    if (me.role !== "admin") return <Navigate to="/" replace />;
    return <Outlet />;
  }

  return (
    <div className={dark ? `${styles.app} ${styles.appDark}` : styles.app}>
      <Header
        view={view}
        setView={handleSetView}
        me={me}
        meLoaded={meLoaded}
        onLogout={() => {
          void doLogout();
        }}
      />

      <Routes>
        <Route
          path="/"
          element={
            <MapView drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} items={items} />
          }
        />

        <Route element={<RequireNotBanned />}>
          <Route path="/create" element={<CreateView onItemCreated={addItem} />} />
          <Route path="/chat" element={<ChatView />} />
        </Route>

        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminView />} />
        </Route>

        <Route
          path="/moderation"
          element={
            <MapView drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} items={items} />
          }
        />

        <Route
          path="/login"
          element={
            <LoginView
              onSignIn={() => {
                void loadMe().then(() => handleSetView("map"));
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
                void loadMe().then(() => handleSetView("map"));
              }}
              onGoSignIn={() => handleSetView("login")}
            />
          }
        />

        <Route path="/forgot" element={<ForgotView onBack={() => handleSetView("login")} />} />

        <Route element={<RequireAuth />}>
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
        </Route>
      </Routes>

      {showTests && <TestRunner setView={handleSetView} />}
    </div>
  );
}