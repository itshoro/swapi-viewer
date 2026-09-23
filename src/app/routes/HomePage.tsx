import { useEffect, useMemo, useRef } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
  type To,
} from "react-router";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  API_BASE,
  CATEGORIES,
  deleteResource,
  resourceKey,
  resourceLabel,
  setResourcePinned,
  type Category,
  type CollectionItem,
  type ResourceRef,
} from "../../dal/swapi";
import { getDeletedKeys } from "../../dal/cache";
import { editors } from "../editors";
import { EntityField } from "../components/EntityField";
import { EntityList } from "../components/EntityList";

type SortKey = "name" | "pin" | "created" | "edited";
type SortDir = "asc" | "desc";

function resourceDate(
  item: CollectionItem,
  field: "created" | "edited",
): number {
  const raw = item.resource[field];
  if (typeof raw !== "string") return 0;
  const value = Date.parse(raw);
  return Number.isFinite(value) ? value : 0;
}

function compareItems(
  a: CollectionItem,
  b: CollectionItem,
  sortKey: SortKey,
  sortDir: SortDir,
): number {
  const result =
    sortKey === "name"
      ? resourceLabel(a.resource).localeCompare(
          resourceLabel(b.resource),
          undefined,
          { sensitivity: "base" },
        )
      : sortKey === "pin"
        ? Number(a.pinned) - Number(b.pinned)
        : resourceDate(a, sortKey) - resourceDate(b, sortKey);
  return sortDir === "asc" ? result : -result;
}

export function HomePage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("search") ?? "";
  const categoriesParam = searchParams.get("categories");
  const pinFilterParam = searchParams.get("pin") ?? "";
  const pinFilter: "all" | "pinned" | "unpinned" =
    pinFilterParam === "pinned" || pinFilterParam === "unpinned"
      ? pinFilterParam
      : "all";
  const sortParam = searchParams.get("sort") ?? "";
  const sortKey: SortKey =
    sortParam === "pin" || sortParam === "created" || sortParam === "edited"
      ? sortParam
      : "name";
  const sortDir: SortDir = searchParams.get("dir") === "desc" ? "desc" : "asc";
  const listRef = useRef<HTMLElement>(null);

  const handleSearchChange = (value: string) => {
    setSearchParams(value.trim() ? { search: value } : {}, { replace: true });
  };

  const handlePinFilterChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("pin");
    else next.set("pin", value);
    setSearchParams(next, { replace: true });
  };

  const handleSortKeyChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "name") next.delete("sort");
    else next.set("sort", value);
    if (value === "pin" && next.get("dir") === null) {
      next.set("dir", "desc");
    }
    setSearchParams(next, { replace: true });
  };

  const handleSortDirChange = () => {
    const next = new URLSearchParams(searchParams);
    if (sortDir === "asc") next.set("dir", "desc");
    else next.delete("dir");
    setSearchParams(next, { replace: true });
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

  const collectionResults = useQueries({
    queries: CATEGORIES.map((category) => ({
      queryKey: ["collection", category],
      queryFn: () => editors[category].list(),
      enabled: enabledCategories.has(category),
    })),
  });

  const { data: deletedKeys = new Set<string>() } = useQuery({
    queryKey: ["deleted-keys"],
    queryFn: () => getDeletedKeys(),
    staleTime: Infinity,
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
          items: (collectionResults[index]?.data ?? [])
            .filter(
              (item) =>
                (q.length === 0 ||
                  resourceLabel(item.resource).toLowerCase().includes(q)) &&
                (pinFilter === "pinned"
                  ? item.pinned
                  : pinFilter === "unpinned"
                    ? !item.pinned
                    : true),
            )
            .sort((a, b) => compareItems(a, b, sortKey, sortDir)),
        };
      },
    ).filter(
      (group): group is { category: Category; items: CollectionItem[] } =>
        group !== null && group.items.length > 0,
    );
  }, [query, collectionResults, enabledCategories, pinFilter, sortKey, sortDir]);

  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  const pinnedGroups = useMemo(
    () =>
      pinFilter === "all"
        ? groups
            .map((group) => ({
              ...group,
              items: group.items.filter((item) => item.pinned),
            }))
            .filter((group) => group.items.length > 0)
        : [],
    [groups, pinFilter],
  );

  const pinnedTotal = pinnedGroups.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );

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

  const resolveResourceLabel = (
    ref: ResourceRef,
  ): string | null | undefined => {
    if (deletedKeys.has(resourceKey(ref.category, ref.id))) return null;
    const entry = itemsByKey.get(resourceKey(ref.category, ref.id));
    return entry ? resourceLabel(entry.resource) : undefined;
  };

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

  const queryClient = useQueryClient();

  const handleTogglePin = async (item: CollectionItem) => {
    try {
      await setResourcePinned(item.category, item.id, !item.pinned);
      await queryClient.invalidateQueries({
        queryKey: ["collection", item.category],
      });
    } catch {
      // Pin storage is best-effort; ignore failures.
    }
  };

  const handleDelete = async (item: CollectionItem) => {
    if (!window.confirm(`Delete "${resourceLabel(item.resource)}"?`)) return;
    try {
      await deleteResource(item.category, item.id);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["collection", item.category],
        }),
        queryClient.invalidateQueries({ queryKey: ["deleted-keys"] }),
      ]);
      if (selectedKey === item.key) handleClose();
    } catch {
      // Delete storage is best-effort; ignore failures.
    }
  };

  const resultsTitle = query.trim()
    ? `Results for "${query}"`
    : pinFilter === "pinned"
      ? "Pinned"
      : pinFilter === "unpinned"
        ? "Un-pinned"
        : "All results";

  const emptyMessage = query.trim()
    ? `No results for "${query}".`
    : pinFilter === "pinned"
      ? "No pinned entries."
      : pinFilter === "unpinned"
        ? "No un-pinned entries."
        : "No results.";

  const renderGroupList = (
    groupList: { category: Category; items: CollectionItem[] }[],
  ) =>
    groupList.map((group) => (
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
          onTogglePin={handleTogglePin}
          selectedKey={selectedKey}
        />
      </section>
    ));

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
            <label className="mt-3 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Pin filter
              </span>
              <select
                value={pinFilter}
                onChange={(event) =>
                  handlePinFilterChange(event.target.value)
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">Doesn't matter</option>
                <option value="pinned">Pinned only</option>
                <option value="unpinned">Un-pinned only</option>
              </select>
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Sort by
              </span>
              <div className="flex gap-2">
                <select
                  value={sortKey}
                  onChange={(event) => handleSortKeyChange(event.target.value)}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="name">Name / Title</option>
                  <option value="pin">Pin status</option>
                  <option value="created">Created</option>
                  <option value="edited">Edited</option>
                </select>
                <button
                  type="button"
                  onClick={handleSortDirChange}
                  className="w-16 shrink-0 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                >
                  {sortDir === "asc" ? "Asc" : "Desc"}
                </button>
              </div>
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
              {pinnedGroups.length > 0 ? (
                <section className="mb-6">
                  <h2 className="mb-3 flex items-baseline gap-2 text-lg font-semibold text-slate-800">
                    Pinned
                    <span className="text-sm font-normal text-slate-500">
                      ({pinnedTotal} {pinnedTotal === 1 ? "item" : "items"})
                    </span>
                  </h2>
                  {renderGroupList(pinnedGroups)}
                </section>
              ) : null}
              <h2 className="mb-3 text-lg font-semibold text-slate-800">
                {resultsTitle}
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
                  <p className="p-2 text-sm text-slate-500">{emptyMessage}</p>
                )
              ) : (
                renderGroupList(groups)
              )}
            </>
          )}
        </section>
        <section className="lg:min-h-0 lg:overflow-y-auto lg:pr-2">
          {selectedItem ? (
            <DetailPanel
              item={selectedItem}
              onClose={handleClose}
              onTogglePin={handleTogglePin}
              onDelete={handleDelete}
              linkTo={(ref) => `/${ref.category}/${ref.id}`}
              resolveLabel={resolveResourceLabel}
              replace
            />
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              Select an entry from the list to view its details.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function DetailPanel({
  item,
  onClose,
  onTogglePin,
  onDelete,
  linkTo,
  resolveLabel,
  replace,
}: {
  item: CollectionItem;
  onClose: () => void;
  onTogglePin: (item: CollectionItem) => void;
  onDelete: (item: CollectionItem) => void;
  linkTo: (ref: ResourceRef) => To;
  resolveLabel: (ref: ResourceRef) => string | null | undefined;
  replace: boolean;
}) {
  const { category, id, resource, modified, pinned } = item;
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
        {" · "}
        <button
          type="button"
          onClick={() => onTogglePin(item)}
          className="text-blue-600 hover:text-blue-800"
        >
          {pinned ? "Unpin" : "Pin"}
        </button>
        {" · "}
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="text-red-600 hover:text-red-800"
        >
          Delete
        </button>
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
      <dl className="divide-y divide-slate-100">
        {Object.entries(resource).map(([name, value]) => (
          <EntityField
            key={name}
            name={name}
            value={value}
            linkTo={linkTo}
            resolveLabel={resolveLabel}
            replace={replace}
          />
        ))}
      </dl>
    </section>
  );
}
