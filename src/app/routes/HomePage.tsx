import { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (!selectedKey) return;
    listRef.current
      ?.querySelector('[data-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedKey]);

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
        <section className="lg:min-h-0 lg:overflow-y-auto lg:pr-2">
          {selectedItem ? (
            <DetailPanel
              item={selectedItem}
              onClose={handleClose}
              onTogglePin={togglePin}
              onDelete={remove}
              linkTo={(ref) => ({ pathname: `/${ref.category}/${ref.id}`, search })}
              resolveLabel={resolveResourceLabel}
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