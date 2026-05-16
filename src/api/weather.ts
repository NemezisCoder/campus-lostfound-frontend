import { api } from "./client";

export type CampusWeather = {
  provider: string;
  location: {
    lat: number;
    lon: number;
  };
  temp_c: number;
  feels_like_c: number;
  humidity: number;
  wind_mps: number;
  summary: string;
  icon: string | null;
  fetched_at: string;
  cached: boolean;
};

export async function fetchCampusWeather(signal?: AbortSignal): Promise<CampusWeather> {
  const response = await api.get<CampusWeather>("/weather/campus", { signal });
  return response.data;
}
