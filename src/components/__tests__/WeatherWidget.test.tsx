import { describe, it, expect, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import WeatherWidget from "../WeatherWidget";
import { fetchCampusWeather } from "../../api/weather";

vi.mock("../../api/weather", () => ({
  fetchCampusWeather: vi.fn(),
}));

describe("WeatherWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", () => {
    vi.mocked(fetchCampusWeather).mockReturnValueOnce(new Promise(() => {}));

    render(<WeatherWidget />);

    expect(screen.getByText(/Загрузка погоды/i)).toBeInTheDocument();
  });

  it("renders weather after successful request", async () => {
    vi.mocked(fetchCampusWeather).mockResolvedValueOnce({
      temp_c: 20,
      feels_like_c: 18,
      summary: "Ясно",
    } as any);

    render(<WeatherWidget />);

    await waitFor(() => {
      expect(screen.getByText(/Погода на кампусе/i)).toBeInTheDocument();
      expect(screen.getByText(/20°C/i)).toBeInTheDocument();
      expect(screen.getByText(/Ощущается как 18°C/i)).toBeInTheDocument();
      expect(screen.getByText(/Ясно/i)).toBeInTheDocument();
    });
  });

  it("renders error state on server error", async () => {
    vi.mocked(fetchCampusWeather).mockRejectedValueOnce(
      new Error("Service unavailable")
    );

    render(<WeatherWidget />);

    await waitFor(() => {
      expect(screen.getByText(/Погода временно недоступна/i)).toBeInTheDocument();
    });
  });
});