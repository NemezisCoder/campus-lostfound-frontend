import { describe, it, expect, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import Header from "../Header";

describe("Header", () => {
  const setView = vi.fn();
  const onLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows guest navigation for anonymous user", () => {
    render(
      <Header
        view="map"
        setView={setView}
        me={null}
        meLoaded={true}
        onLogout={onLogout}
      />
    );

    expect(screen.getByText(/Войти/i)).toBeInTheDocument();
    expect(screen.getByText(/Регистрация/i)).toBeInTheDocument();
    expect(screen.queryByText(/Создать пост/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Чат/i)).not.toBeInTheDocument();
  });

  it("shows create and chat links for authenticated user", () => {
    render(
      <Header
        view="map"
        setView={setView}
        me={{
          id: 1,
          email: "user@test.com",
          name: "User",
          surname: "Test",
          role: "user",
          is_banned: false,
        }}
        meLoaded={true}
        onLogout={onLogout}
      />
    );

    expect(screen.getByText(/Создать пост/i)).toBeInTheDocument();
    expect(screen.getByText(/Чат/i)).toBeInTheDocument();
    expect(screen.queryByText(/Администрирование/i)).not.toBeInTheDocument();
  });

  it("shows admin link only for admin", () => {
    render(
      <Header
        view="map"
        setView={setView}
        me={{
          id: 1,
          email: "admin@test.com",
          name: "Admin",
          surname: "Test",
          role: "admin",
          is_banned: false,
        }}
        meLoaded={true}
        onLogout={onLogout}
      />
    );

    expect(screen.getByText(/Администрирование/i)).toBeInTheDocument();
  });

  it("does not show create, chat and admin links for banned user", () => {
    render(
      <Header
        view="map"
        setView={setView}
        me={{
          id: 1,
          email: "banned@test.com",
          name: "Banned",
          surname: "User",
          role: "admin",
          is_banned: true,
        }}
        meLoaded={true}
        onLogout={onLogout}
      />
    );

    expect(screen.queryByText(/Создать пост/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Чат/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Администрирование/i)).not.toBeInTheDocument();
  });
});