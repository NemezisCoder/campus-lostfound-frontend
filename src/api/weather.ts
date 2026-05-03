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
  const response = await fetch("/api/v1/weather/campus", { signal });

  if (!response.ok) {
    throw new Error(`Weather request failed: ${response.status}`);
  }

  return response.json();
}