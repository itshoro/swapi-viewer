import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { API_BASE, isCategory, type Category } from "../../dal/swapi";
import { editors } from "../editors";
import { CategoryForm } from "../components/CategoryForm";

export function AddPage() {
  const raw = useParams().category;
  const category: Category | null =
    raw !== undefined && isCategory(raw) ? raw : null;
  const editor = category ? editors[category] : null;

  const {
    data: nextId,
    error,
    isPending,
  } = useQuery({
    queryKey: ["next-id", category],
    queryFn: () => {
      if (!editor) throw new Error("Unknown category");
      return editor.nextId();
    },
    enabled: editor !== null,
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <p className="mb-1 text-sm text-slate-500">
        <Link to="/" className="text-blue-600 hover:text-blue-800">
          /api
        </Link>
        {category ? (
          <>
            {" / "}
            <Link
              to={`/?categories=${category}`}
              className="text-blue-600 hover:text-blue-800"
            >
              /api/{category}
            </Link>
            {" / "}
            <span>/api/{category}/new</span>
          </>
        ) : null}
      </p>
      <h1 className="mb-5 text-xl font-semibold text-slate-900">
        {category ? `Add entity: ${category}` : "Unknown category"}
      </h1>
      {category && editor ? (
        isPending ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error.message}</p>
        ) : nextId ? (
          <CategoryForm
            key={`${category}-${nextId}`}
            editor={editor}
            category={category}
            resourceId={nextId}
            initial={editor.blank(`${API_BASE}/${category}/${nextId}`)}
            isNew
            modified={false}
          />
        ) : null
      ) : (
        <p className="text-sm text-slate-500">That endpoint does not exist.</p>
      )}
    </main>
  );
}
