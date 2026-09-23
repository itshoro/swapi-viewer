import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  API_BASE,
  CATEGORIES,
  getRoot,
  resourceLabel,
  type CollectionItem,
} from "../../dal/swapi";
import { editors } from "../editors";
import { EntityField } from "../components/EntityField";
import { EntityList } from "../components/EntityList";
import { SiteNav } from "../components/SiteNav";

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("search") ?? "";
  const [selected, setSelected] = useState<CollectionItem | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchParams(value.trim() ? { search: value } : {}, { replace: true });
  };

  const rootQuery = useQuery({
    queryKey: ["root"],
    queryFn: getRoot,
  });

  const collectionResults = useQueries({
    queries: CATEGORIES.map((category) => ({
      queryKey: ["collection", category],
      queryFn: () => editors[category].list(),
    })),
  });

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATEGORIES.map((category, index) => ({
      category,
      items: (collectionResults[index]?.data ?? []).filter(
        (item) =>
          q.length === 0 ||
          resourceLabel(item.resource).toLowerCase().includes(q),
      ),
    })).filter((group) => group.items.length > 0);
  }, [query, collectionResults]);

  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  const itemsByKey = useMemo(
    () =>
      new Map(
        collectionResults
          .flatMap((result) => result.data ?? [])
          .map((item) => [item.key, item]),
      ),
    [collectionResults],
  );

  const selectedItem = selected ? itemsByKey.get(selected.key) ?? selected : null;

  const loading = collectionResults.some((result) => result.isPending);
  const error =
    collectionResults.find((result) => result.error)?.error ?? null;

  return (
    <main className="flex h-screen flex-col px-4 py-4 lg:px-6">
      <SiteNav />
      <header className="mb-4">
        <h1 className="flex items-baseline gap-2 text-2xl font-semibold text-slate-900">
          SWAPI API viewer
        </h1>
        <p className="text-sm text-slate-500">
          Source:{" "}
          <a
            href={API_BASE}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            {API_BASE}
          </a>
        </p>
      </header>
      <div className="grid flex-1 gap-6 lg:min-h-0 lg:grid-cols-3 lg:overflow-hidden">
        <section className="lg:col-span-2 lg:min-h-0 lg:overflow-y-auto lg:pr-2">
          <fieldset className="sticky top-0 z-20 mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <legend className="px-1 text-sm font-medium text-slate-700">
              Search options
            </legend>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Search
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="e.g. skywalker"
                autoComplete="off"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </fieldset>
          {loading ? (
            <p className="p-2 text-sm text-slate-500">Loading all endpoints…</p>
          ) : error ? (
            <p className="p-2 text-sm text-red-600">{error.message}</p>
          ) : (
            <>
              <h2 className="mb-3 text-lg font-semibold text-slate-800">
                {query.trim() ? `Results for "${query}"` : `All results`}
                {total > 0 ? (
                  <span className="ml-2 font-normal text-slate-500">
                    ({total} {total === 1 ? "item" : "items"})
                  </span>
                ) : null}
              </h2>
              {groups.length === 0 ? (
                <p className="p-2 text-sm text-slate-500">
                  No results for "{query}".
                </p>
              ) : (
                groups.map((group) => (
                  <section key={group.category} className="mb-5">
                    <h3 className="sticky top-28 z-10 mb-2 flex items-baseline gap-2 bg-white py-1 text-base font-semibold text-slate-800">
                      <Link
                        to={`/categories/${group.category}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        /api/{group.category}
                      </Link>
                      <span className="text-sm font-normal text-slate-500">
                        ({group.items.length})
                      </span>
                    </h3>
                    <EntityList
                      items={group.items}
                      onSelect={(item) => setSelected(item)}
                    />
                  </section>
                ))
              )}
            </>
          )}
        </section>
        <section className="lg:min-h-0 lg:overflow-y-auto lg:pr-2">
          {selectedItem ? (
            <DetailPanel
              item={selectedItem}
              onClose={() => setSelected(null)}
            />
          ) : (
            <>
              <h2 className="mb-3 text-lg font-semibold text-slate-800">
                Endpoints
              </h2>
              {rootQuery.isPending ? (
                <p className="text-sm text-slate-500">Loading…</p>
              ) : rootQuery.error ? (
                <p className="text-sm text-red-600">
                  {rootQuery.error.message}
                </p>
              ) : rootQuery.data ? (
                <ul className="space-y-2">
                  {CATEGORIES.map((category) => (
                    <li
                      key={category}
                      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                    >
                      <Link
                        to={`/categories/${category}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        /api/{category}
                      </Link>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {rootQuery.data[category]}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function DetailPanel({
  item,
  onClose,
}: {
  item: CollectionItem;
  onClose: () => void;
}) {
  const { category, id, resource, modified } = item;
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {resourceLabel(resource)}
          </h2>
          <p className="break-all text-xs text-slate-500">
            {`/api/${category}/${id}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="rounded-md px-2 py-1 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          ×
        </button>
      </div>
      <p className="mb-3 text-sm">
        <Link
          to={`/items/${category}/${id}/edit`}
          className="text-blue-600 hover:text-blue-800"
        >
          Edit
        </Link>
        {" · "}
        <Link
          to={`/items/${category}/${id}`}
          className="text-blue-600 hover:text-blue-800"
        >
          Full page
        </Link>
        {modified ? (
          <>
            {" · "}
            <strong className="text-amber-600">Modified</strong>
          </>
        ) : null}
      </p>
      <h3 className="mb-2 text-sm font-semibold text-slate-700">
        Fields &amp; relations
      </h3>
      <dl className="space-y-1">
        {Object.entries(resource).map(([name, value]) => (
          <EntityField key={name} name={name} value={value} />
        ))}
      </dl>
    </section>
  );
}