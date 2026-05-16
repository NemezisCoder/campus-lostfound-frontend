import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { api, clearTokens, setAccessToken, setRefreshToken } from "../client";

describe("api client", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();
    clearTokens();

    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
    vi.clearAllMocks();
  });

  it("clears tokens and emits auth:invalid when refresh fails", async () => {
    setAccessToken("old-access");
    setRefreshToken("old-refresh");

    const eventSpy = vi.fn();
    window.addEventListener("auth:invalid", eventSpy);

    mock.onGet("/protected").replyOnce(401);
    mock.onPost("/auth/refresh").replyOnce(401);

    await expect(api.get("/protected")).rejects.toThrow();

    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
    expect(eventSpy).toHaveBeenCalledTimes(1);

    window.removeEventListener("auth:invalid", eventSpy);
  });

  it("refreshes token and retries request when access token expired", async () => {
    setAccessToken("old-access");
    setRefreshToken("old-refresh");

    mock.onGet("/protected").replyOnce(401);

    mock.onPost("/auth/refresh").replyOnce(200, {
      access_token: "new-access",
      refresh_token: "new-refresh",
    });

    mock.onGet("/protected").replyOnce(200, {
      ok: true,
    });

    const response = await api.get("/protected");

    expect(response.status).toBe(200);
    expect(response.data.ok).toBe(true);
    expect(localStorage.getItem("access_token")).toBe("new-access");
    expect(localStorage.getItem("refresh_token")).toBe("new-refresh");
  });
});