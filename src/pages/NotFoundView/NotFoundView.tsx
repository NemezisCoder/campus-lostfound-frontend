import Seo from "../../components/Seo";
import { Link } from "react-router-dom";

export default function NotFoundView() {
  return (
    <>
      <Seo
        title="Страница не найдена"
        description="Запрошенная страница не существует."
        robots="noindex,nofollow"
        canonical={`${window.location.origin}/not-found`}
      />
      <main>
        <h1>Страница не найдена</h1>
        <p>Такого адреса в Campus Lost&Found нет.</p>
        <Link to="/">Вернуться на главную</Link>
      </main>
    </>
  );
}