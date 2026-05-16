import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../../App";

import { fetchMe } from "../../api/auth";
import { getRefreshToken } from "../../api/client";
import { fetchItemsPage } from "../../api/items";

vi.mock("../../api/auth", () => ({
  fetchMe: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("../../api/client", () => ({
  clearTokens: vi.fn(),
  getRefreshToken: vi.fn(),
  setAccessToken: vi.fn(),
  setRefreshToken: vi.fn(),
}));

vi.mock("../../api/items", () => ({
  fetchItemsPage: vi.fn(),
}));

vi.mock("../../pages/CreateView", () => ({
  default: () => <div>Создать пост</div>,
}));

vi.mock("../../pages/ChatView", () => ({
  default: () => <div>Чат</div>,
}));

vi.mock("../../pages/AdminView", () => ({
  default: () => <div>Админ панель</div>,
}));

vi.mock("../../pages/Auth/LoginView", () => ({
  default: () => <div>Войти</div>,
}));

vi.mock("../../pages/MapView/MapView", () => ({
  default: () => <div>Карта</div>,
}));

describe("App routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubGlobal("fetch", vi.fn());

    vi.mocked(fetchItemsPage).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 20,
    } as any);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects anonymous user from private create route to login", async () => {
    vi.mocked(getRefreshToken).mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={["/create"]}>
        <App />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole("button", { name: /Войти/i })
    ).toBeInTheDocument();

    expect(screen.queryByText(/Создать пост/i)).not.toBeInTheDocument();
  });

  it("redirects anonymous user from admin route to login", async () => {
    vi.mocked(getRefreshToken).mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <App />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole("button", { name: /Войти/i })
    ).toBeInTheDocument();

    expect(screen.queryByText(/Админ панель/i)).not.toBeInTheDocument();
  });

  it("does not allow non-admin user to open admin page", async () => {
    vi.mocked(getRefreshToken).mockReturnValue("refresh-token");

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "access-token",
        refresh_token: "new-refresh-token",
      }),
    } as Response);

    vi.mocked(fetchMe).mockResolvedValueOnce({
      id: 1,
      email: "user@test.com",
      name: "User",
      surname: "Test",
      role: "user",
      is_banned: false,
    } as any);

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Админ панель/i)).not.toBeInTheDocument();
    });

    expect(
      await screen.findByRole("button", { name: /Карта/i })
    ).toBeInTheDocument();
  });

  it("allows admin user to open admin page", async () => {
    vi.mocked(getRefreshToken).mockReturnValue("refresh-token");

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "access-token",
        refresh_token: "new-refresh-token",
      }),
    } as Response);

    vi.mocked(fetchMe).mockResolvedValueOnce({
      id: 1,
      email: "admin@test.com",
      name: "Admin",
      surname: "Test",
      role: "admin",
      is_banned: false,
    } as any);

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Админ панель/i)).toBeInTheDocument();
  });
});