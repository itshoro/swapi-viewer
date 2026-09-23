import { Link } from "react-router";
import { SiteNav } from "../components/SiteNav";

export function NotFoundPage() {
  return (
    <main>
      <SiteNav />
      <h1>404 — page not found</h1>
      <p>
        <Link to="/">Back to the API root</Link>
      </p>
    </main>
  );
}