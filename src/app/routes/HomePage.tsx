import { useEffect, useMemo, useRef } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
  type To,
} from "react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  API_BASE,
  CATEGORIES,
  getRoot,
  resourceKey,
  resourceLabel,
  type Category,
  type CollectionItem,
  type ResourceRef,
} from "../../dal/swapi";
import { editors } from "../editors";
import { EntityField } from "../components/EntityField";
import { EntityList } from "../components/EntityList";

export function HomePage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("search") ?? "";
  const categoriesParam = searchParams.get("categories");
  const listRef = useRef<HTMLElement>(null);

  const handleSearchChange = (value: string) => {
    setSearchParams(value.trim() ? { search: value } : {}, { replace: true });
  };

  const urlCategory: Category | null = CATEGORIES.includes(
    params.category as Category,
  )
    ? (params.category as Category)
    : null;
  const selectedKey =
    urlCategory && params.id ? resourceKey(urlCategory, params.id) : null;

  const enabledCategories = useMemo(() => {
    if (categoriesParam === null) return new Set(CATEGORIES);
    const values = (categoriesParam ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter((value): value is Category =>
        CATEGORIES.includes(value as Category),
      );
    return new Set<Category>(values);
  }, [categoriesParam]);

  const updateCategoryParam = (next: ReadonlySet<Category>) => {
    const params = new URLSearchParams(searchParams);
    if (next.size === CATEGORIES.length) {
      params.delete("categories");
    } else if (next.size === 0) {
      params.set("categories", "");
    } else {
      params.set(
        "categories",
        CATEGORIES.filter((category) => next.has(category)).join(","),
      );
    }
    setSearchParams(params, { replace: true });
  };

  const toggleCategory = (category: Category) => {
    const next = new Set(enabledCategories);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    updateCategoryParam(next);
  };

  const rootQuery = useQuery({
    queryKey: ["root"],
    queryFn: getRoot,
  });

  const collectionResults = useQueries({
    queries: CATEGORIES.map((category) => ({
      queryKey: ["collection", category],
      queryFn: () => editors[category].list(),
      enabled: enabledCategories.has(category),
    })),
  });

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATEGORIES.map(
      (
        category,
        index,
      ): {
        category: Category;
        items: CollectionItem[];
      } | null => {
        if (!enabledCategories.has(category)) return null;
        return {
          category,
          items: (collectionResults[index]?.data ?? []).filter(
            (item) =>
              q.length === 0 ||
              resourceLabel(item.resource).toLowerCase().includes(q),
          ),
        };
      },
    ).filter(
      (group): group is { category: Category; items: CollectionItem[] } =>
        group !== null && group.items.length > 0,
    );
  }, [query, collectionResults, enabledCategories]);

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

  const selectedItem = selectedKey
    ? (itemsByKey.get(selectedKey) ?? null)
    : null;

  useEffect(() => {
    if (!selectedKey) return;
    listRef.current
      ?.querySelector('[data-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedKey]);

  const handleSelect = (item: CollectionItem) => {
    navigate(
      {
        pathname: `/${item.category}/${item.id}`,
        search: searchParams.toString(),
      },
      { replace: true },
    );
  };

  const handleClose = () => {
    navigate(
      { pathname: "/", search: searchParams.toString() },
      { replace: true },
    );
  };

  const loading = collectionResults.some(
    (result, index) =>
      enabledCategories.has(CATEGORIES[index]) && result.isPending,
  );
  const error =
    collectionResults.find(
      (result, index) =>
        enabledCategories.has(CATEGORIES[index]) && result.error,
    )?.error ?? null;

  return (
    <main className="flex h-screen flex-col px-4 py-4 lg:px-6">
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
        <section
          ref={listRef}
          className="lg:col-span-2 lg:min-h-0 lg:overflow-y-auto lg:pr-2"
        >
          <fieldset className="sticky top-0 z-20 mb-4 rounded-lg border border-slate-200 bg-white p-4">
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
            <div className="mt-3">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Categories
                </span>
                <span className="text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={() => updateCategoryParam(new Set(CATEGORIES))}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    all
                  </button>
                  {" · "}
                  <button
                    type="button"
                    onClick={() => updateCategoryParam(new Set())}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    none
                  </button>
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                {CATEGORIES.map((category) => (
                  <label
                    key={category}
                    className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={enabledCategories.has(category)}
                      onChange={() => toggleCategory(category)}
                      className="accent-blue-600"
                    />
                    {category}
                  </label>
                ))}
              </div>
            </div>
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
                enabledCategories.size === 0 ? (
                  <p className="p-2 text-sm text-slate-500">
                    Select at least one category to show results.
                  </p>
                ) : (
                  <p className="p-2 text-sm text-slate-500">
                    {query.trim()
                      ? `No results for "${query}".`
                      : "No results."}
                  </p>
                )
              ) : (
                groups.map((group) => (
                  <section key={group.category} className="mb-5">
                    <h3 className="sticky top-28 z-10 mb-2 flex items-baseline gap-2 bg-white py-1 text-base font-semibold text-slate-800">
                      <Link
                        to={`/?categories=${group.category}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        /api/{group.category}
                      </Link>
                      <span className="text-sm font-normal text-slate-500">
                        ({group.items.length})
                      </span>
                      <Link
                        to={`/${group.category}/add`}
                        className="ml-auto rounded border border-slate-300 px-2 py-0.5 text-xs font-normal text-slate-600 hover:border-blue-500 hover:text-blue-700"
                      >
                        Add
                      </Link>
                    </h3>
                    <EntityList
                      items={group.items}
                      onSelect={handleSelect}
                      selectedKey={selectedKey}
                    />
                  </section>
                ))
              )}
            </>
          )}
        </section>
        <section className="lg:min-h-0 lg:overflow-y-auto lg:pr-2">
          {selectedItem && (
            <DetailPanel
              item={selectedItem}
              onClose={handleClose}
              linkTo={(ref) => `/${ref.category}/${ref.id}`}
              replace
            />
          )}
        </section>
      </div>
    </main>
  );
}

function DetailPanel({
  item,
  onClose,
  linkTo,
  replace,
}: {
  item: CollectionItem;
  onClose: () => void;
  linkTo: (ref: ResourceRef) => To;
  replace: boolean;
}) {
  const { category, id, resource, modified } = item;
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
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
          to={`/${category}/${id}/edit`}
          className="text-blue-600 hover:text-blue-800"
        >
          Edit
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
          <EntityField
            key={name}
            name={name}
            value={value}
            linkTo={linkTo}
            replace={replace}
          />
        ))}
      </dl>
    </section>
  );
}
