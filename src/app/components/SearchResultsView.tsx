import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Category, CollectionItem } from "../../dal/swapi";
import type { BrowseFilters } from "../hooks/useBrowseFilters";
import type { CategoryGroup } from "../hooks/useCollectionData";
import { GroupSection } from "./GroupSection";
import { SearchOptions } from "./SearchOptions";

interface SearchResultsViewProps {
  filters: BrowseFilters;
  listRef: RefObject<HTMLElement | null>;
  headingRef: RefObject<HTMLHeadingElement | null>;
  loading: boolean;
  error: Error | null;
  groups: CategoryGroup[];
  pinnedGroups: CategoryGroup[];
  total: number;
  pinnedTotal: number;
  resultsTitle: string;
  emptyMessage: string;
  enabledCategories: ReadonlySet<Category>;
  selectedKey: string | null;
  onSelect: (item: CollectionItem) => void;
  onTogglePin: (item: CollectionItem) => void;
}

export function SearchResultsView({
  filters,
  listRef,
  headingRef,
  loading,
  error,
  groups,
  pinnedGroups,
  total,
  pinnedTotal,
  resultsTitle,
  emptyMessage,
  enabledCategories,
  selectedKey,
  onSelect,
  onTogglePin,
}: SearchResultsViewProps) {
  const optionsRef = useRef<HTMLFieldSetElement>(null);

  useEffect(() => {
    const container = listRef.current;
    const options = optionsRef.current;
    if (!container || !options) return;
    const update = () => {
      container.style.setProperty(
        "--sticky-offset",
        `${options.offsetHeight}px`,
      );
      const heading = headingRef.current;
      if (heading) {
        container.style.setProperty(
          "--sticky-heading-height",
          `${heading.offsetHeight}px`,
        );
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(options);
    if (headingRef.current) observer.observe(headingRef.current);
    return () => observer.disconnect();
  }, [listRef, headingRef, loading, error]);

  return (
    <>
      <SearchOptions ref={optionsRef} filters={filters} />
      <div className="px-4 lg:px-5">
        {loading ? (
          <p className="p-2 text-sm text-slate-500">Loading all endpoints…</p>
        ) : error ? (
          <p className="p-2 text-sm text-red-600">{error.message}</p>
        ) : (
          <>
            {pinnedGroups.length > 0 ? (
              <section className="mb-6">
                <h2
                  style={{
                    top: "var(--sticky-offset, 0rem)",
                    scrollPaddingTop:
                      "calc(var(--sticky-offset, 0rem) + var(--sticky-heading-height, 2.5rem) + 0.5rem)",
                  }}
                  className="sticky z-20 flex items-baseline gap-2 bg-white pt-1 pb-3 text-lg font-semibold text-slate-800"
                >
                  Pinned
                  <span className="text-sm font-normal text-slate-500">
                    ({pinnedTotal} {pinnedTotal === 1 ? "item" : "items"})
                  </span>
                </h2>
                {pinnedGroups.map((group) => (
                  <GroupSection
                    key={group.category}
                    group={group}
                    selectedKey={selectedKey}
                    onSelect={onSelect}
                    onTogglePin={onTogglePin}
                  />
                ))}
              </section>
            ) : null}
            <h2
              ref={headingRef}
              style={{
                top: "var(--sticky-offset, 0rem)",
                scrollPaddingTop:
                  "calc(var(--sticky-offset, 0rem) + var(--sticky-heading-height, 2.5rem) + 0.5rem)",
              }}
              className="sticky z-50 bg-white pt-1 pb-3 text-lg font-semibold text-slate-800"
            >
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
              groups.map((group) => (
                <GroupSection
                  key={group.category}
                  group={group}
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  onTogglePin={onTogglePin}
                />
              ))
            )}
          </>
        )}
      </div>
    </>
  );
}
