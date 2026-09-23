import { Link, useLocation, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  API_BASE,
  HttpError,
  ResourceDeletedError,
  isCategory,
  resourceKey,
  type Category,
  type Resource,
} from "../../dal/swapi";
import { editors } from "../editors";
import { CategoryForm } from "../components/CategoryForm";

export function EditPage() {
  const { category: rawCategory, id } = useParams();
  const category: Category | null =
    rawCategory !== undefined && isCategory(rawCategory) ? rawCategory : null;
  const resourceId: string | null = id ?? null;
  const location = useLocation();
  const isNew = location.state?.isNew === true;
  const editor = category ? editors[category] : null;
  const enabled = category !== null && resourceId !== null && editor !== null;

  const { data, error, isPending } = useQuery({
    queryKey: ["resource", category, resourceId],
    queryFn: () => {
      if (!editor || !resourceId) throw new Error("Unknown resource");
      return editor.get(resourceId);
    },
    enabled: enabled && !isNew,
    retry: (failureCount, err) =>
      err instanceof HttpError && err.status === 404
        ? false
        : err instanceof ResourceDeletedError
          ? false
          : failureCount < 2,
  });

  const { data: modified = false } = useQuery({
    queryKey: ["override", category, resourceId],
    queryFn: () => {
      if (!editor || !resourceId) throw new Error("Unknown resource");
      return editor.isModified(resourceId);
    },
    enabled: enabled && !isNew,
  });

  const localResource: Resource | null =
    isNew && editor && category && resourceId
      ? editor.blank(`${API_BASE}/${category}/${resourceId}`)
      : null;
  const resource: Resource | null = data ?? localResource;

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
            {isNew && resourceId ? (
              <span>
                /api/{category}/{resourceId}
              </span>
            ) : (
              <Link
                to={`/${category}/${resourceId}`}
                className="text-blue-600 hover:text-blue-800"
              >
                /api/{category}/{resourceId}
              </Link>
            )}
          </>
        ) : null}
      </p>
      <h1 className="mb-5 text-xl font-semibold text-slate-900">
        {isPending
          ? "Loading…"
          : resource && editor
            ? isNew
              ? `New entity: ${category}/${resourceId}`
              : `Edit: ${editor.label(resource)}`
            : "Not found"}
      </h1>
      {isPending ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error.message}</p>
      ) : resource && category && resourceId && editor ? (
        <CategoryForm
          key={resourceKey(category, resourceId)}
          editor={editor}
          category={category}
          resourceId={resourceId}
          initial={resource}
          isNew={isNew}
          modified={modified}
        />
      ) : null}
    </main>
  );
}
