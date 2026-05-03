import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate, Outlet } from "react-router-dom";

import { View } from "./types/view";
import Header from "./components/Header";
import MapView from "./pages/MapView/MapView";
import ItemDetailView from "./pages/ItemDetailView";

import type {
  MapItem,
  ItemsQuery,
  ItemType,
  StatusType,
  CategoryType,
  ItemSort,
} from "./api/items";
import { fetchItemsPage } from "./api/items";

import { clearTokens, getRefreshToken, setAccessToken, setRefreshToken } from "./api/client";
import { fetchMe, logout as apiLogout, type MeResponse } from "./api/auth";
import styles from "./App.module.css";

const CreateView = lazy(() => import("./pages/CreateView"));
const ChatView = lazy(() => import("./pages/ChatView"));
const AdminView = lazy(() => import("./pages/AdminView"));
const LoginView = lazy(() => import("./pages/Auth/LoginView"));
const SignUpView = lazy(() => import("./pages/Auth/SignUpView"));
const ForgotView = lazy(() => import("./pages/Auth/ForgotView"));
const ProfileView = lazy(() => import("./pages/ProfileView"));
const AccountSettingsView = lazy(() => import("./pages/Account/AccountSettingsView"));
const ChangePasswordView = lazy(() => import("./pages/Account/ChangePasswordView"));
const TestRunner = lazy(() => import("./tests/TestRunner"));
const NotFoundView = lazy(() => import("./pages/NotFoundView/NotFoundView"));

function isItemType(value: string | null): value is ItemType {
  return value === "lost" || value === "found";
}

function isStatusType(value: string | null): value is StatusType {
  return value === "OPEN" || value === "IN_PROGRESS" || value === "CLOSED";
}

function isCategoryType(value: string | null): value is CategoryType {
  return (
    value === "electronics" ||
    value === "clothes" ||
    value === "personal" ||
    value === "documents"
  );
}

function isItemSort(value: string | null): value is ItemSort {
  return (
    value === "id_desc" ||
    value === "id_asc" ||
    value === "title_asc" ||
    value === "title_desc"
  );
}

function parsePositiveInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
  return parsed;
}

function buildItemsQuery(search: string): ItemsQuery {
  const params = new URLSearchParams(search);

  const query: ItemsQuery = {};

  const q = params.get("q")?.trim();
  if (q) query.q = q;

  const type = params.get("type");
  if (isItemType(type)) query.type = type;

  const status = params.get("status");
  if (isStatusType(status)) query.status = status;

  const category = params.get("category");
  if (isCategoryType(category)) query.category = category;

  const sort = params.get("sort");
  if (isItemSort(sort)) query.sort = sort;

  const page = parsePositiveInt(params.get("page"));
  if (page !== undefined) query.page = page;

  const pageSize = parsePositiveInt(params.get("page_size"));
  if (pageSize !== undefined) query.page_size = pageSize;

  return query;
}

function RouteLoader() {
  return <div style={{ padding: 16 }}>Loading…</div>;
}

export default function App() {
  const [view, setView] = useState<View>("map");
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [meLoaded, setMeLoaded] = useState(false);
  const [dark, setDark] = useState(false);
  const [showTests, setShowTests] = useState(false);

  const [items, setItems] = useState<MapItem[]>([]);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPageSize, setItemsPageSize] = useState(20);

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
    void (async () => {
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
    const isItemsRoute = location.pathname === "/";

    if (!isItemsRoute) {
      return;
    }

    const query = buildItemsQuery(location.search);

    fetchItemsPage(query)
      .then((data) => {
        setItems(data.items);
        setItemsTotal(data.total);
        setItemsPage(data.page);
        setItemsPageSize(data.page_size);
      })
      .catch((e) => {
        console.error("Failed to load items:", e);
      });
  }, [location.pathname, location.search]);

  function addItem(newItem: MapItem) {
    setItems((prev) => [newItem, ...prev]);
    setItemsTotal((prev) => prev + 1);
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
        navigate("/");
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
    if (!meLoaded) return <RouteLoader />;
    return me ? <Outlet /> : <Navigate to="/login" replace />;
  }

  function RequireNotBanned() {
    if (!meLoaded) return <RouteLoader />;
    if (!me) return <Navigate to="/login" replace />;
    if (me.is_banned) return <Navigate to="/" replace />;
    return <Outlet />;
  }

  function RequireAdmin() {
    if (!meLoaded) return <RouteLoader />;
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

      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route
            path="/"
            element={
              <MapView
                drawerOpen={drawerOpen}
                setDrawerOpen={setDrawerOpen}
                items={items}
                itemsTotal={itemsTotal}
                itemsPage={itemsPage}
                itemsPageSize={itemsPageSize}
              />
            }
          />

          <Route path="/items/:id/:slug?" element={<ItemDetailView />} />

          <Route element={<RequireNotBanned />}>
            <Route path="/create" element={<CreateView onItemCreated={addItem} />} />
            <Route path="/chat" element={<ChatView />} />
          </Route>

          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminView />} />
          </Route>

          <Route path="/moderation" element={<Navigate to="/" replace />} />

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

          <Route path="*" element={<NotFoundView />} />
        </Routes>

        {showTests && <TestRunner setView={handleSetView} />}
      </Suspense>
    </div>
  );
}