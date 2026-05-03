import { useEffect, useState } from "react";
import { fetchCampusWeather, CampusWeather } from "../api/weather";

export default function WeatherWidget() {
  const [data, setData] = useState<CampusWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");

    fetchCampusWeather(controller.signal)
      .then((result) => {
        setData(result);
        setError("");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError("Погода временно недоступна");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  if (loading) return <div>Загрузка погоды…</div>;
  if (error) return <div>{error}</div>;
  if (!data) return <div>Нет данных о погоде</div>;

  return (
    <div>
      <strong>Погода на кампусе</strong>
      <div>{Math.round(data.temp_c)}°C</div>
      <div>Ощущается как {Math.round(data.feels_like_c)}°C</div>
      <div>{data.summary}</div>
    </div>
  );
}