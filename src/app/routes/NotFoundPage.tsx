import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-2 text-xl font-semibold text-slate-900">
        404 — page not found
      </h1>
      <p className="text-sm text-slate-500">
        <Link to="/" className="text-blue-600 hover:text-blue-800">
          Back to the API root
        </Link>
      </p>
    </main>
  );
}