import { useRef } from "react";
import { useNavigate, useParams } from "react-router";
import {
  API_BASE,
  CATEGORIES,
  resourceKey,
  type Category,
  type CollectionItem,
} from "../../dal/swapi";
import { DetailPanel } from "../components/DetailPanel";
import { SearchResultsView } from "../components/SearchResultsView";
import { useBrowseFilters } from "../hooks/useBrowseFilters";
import { useCollectionData } from "../hooks/useCollectionData";
import { useResourceActions } from "../hooks/useResourceActions";

export function HomePage() {
  const navigate = useNavigate();
  const params = useParams();
  const filters = useBrowseFilters();
  const { query, pinFilter, enabledCategories, search } = filters;
  const listRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const urlCategory: Category | null = CATEGORIES.includes(
    params.category as Category,
  )
    ? (params.category as Category)
    : null;
  const selectedKey =
    urlCategory && params.id ? resourceKey(urlCategory, params.id) : null;

  const handleSelect = (item: CollectionItem) => {
    navigate({
      pathname: `/${item.category}/${item.id}`,
      search,
    });
  };

  const handleClose = () => {
    navigate({ pathname: "/", search }, { replace: true });
  };

  const { togglePin, remove } = useResourceActions(selectedKey, handleClose);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  const showList = !selectedKey || !isMobile;
  const showDetail = Boolean(selectedKey);

  const {
    groups,
    pinnedGroups,
    total,
    pinnedTotal,
    selectedItem,
    resolveResourceLabel,
    loading,
    error,
  } = useCollectionData({
    enabledCategories,
    query,
    pinFilter,
    sortKey: filters.sortKey,
    sortDir: filters.sortDir,
    selectedKey,
  });

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

  return (
    <main className="flex h-screen flex-col px-0 py-0 lg:px-6 lg:py-4">
      <header className="mb-4 px-4 py-4 lg:px-6 lg:py-4">
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
      <div className="grid flex-1 gap-0 lg:min-h-0 lg:grid-cols-3 lg:overflow-hidden lg:rounded-lg lg:border lg:border-slate-200 lg:bg-white">
        <section
          ref={listRef}
          className={`${showList ? "" : "hidden"} lg:block lg:col-span-2 lg:min-h-0 lg:overflow-y-auto lg:border-r lg:border-slate-200 lg:pr-4`}
        >
            <SearchResultsView
              filters={filters}
              listRef={listRef}
              headingRef={headingRef}
              loading={loading}
              error={error}
              groups={groups}
              pinnedGroups={pinnedGroups}
              total={total}
              pinnedTotal={pinnedTotal}
              resultsTitle={resultsTitle}
              emptyMessage={emptyMessage}
              enabledCategories={enabledCategories}
              selectedKey={selectedKey}
              onSelect={handleSelect}
              onTogglePin={togglePin}
            />
          </section>
        <section className={`${showDetail ? "" : "hidden"} lg:block lg:min-h-0 lg:overflow-y-auto lg:p-4`}>
          {selectedItem ? (
            <>
              <div className="mb-2 lg:hidden">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:border-blue-500 hover:text-blue-700"
                >
                  ← Search
                </button>
              </div>
              <DetailPanel
                item={selectedItem}
                onClose={handleClose}
                onTogglePin={togglePin}
                onDelete={remove}
                linkTo={(ref) => `/${ref.category}/${ref.id}`}
                resolveLabel={resolveResourceLabel}
              />
            </>
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
