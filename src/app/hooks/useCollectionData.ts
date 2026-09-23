import { useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { getDeletedKeys } from "../../dal/cache";
import {
  CATEGORIES,
  resourceKey,
  resourceLabel,
  type Category,
  type CollectionItem,
  type ResourceRef,
} from "../../dal/swapi";
import { editors } from "../editors";
import { compareItems, type SortDir, type SortKey } from "../sorting";
import type { PinFilter } from "./useBrowseFilters";

export interface CategoryGroup {
  category: Category;
  items: CollectionItem[];
}

export interface CollectionData {
  groups: CategoryGroup[];
  pinnedGroups: CategoryGroup[];
  total: number;
  pinnedTotal: number;
  itemsByKey: Map<string, CollectionItem>;
  selectedItem: CollectionItem | null;
  resolveResourceLabel: (ref: ResourceRef) => string | null | undefined;
  loading: boolean;
  error: Error | null;
}

export function useCollectionData({
  enabledCategories,
  query,
  pinFilter,
  sortKey,
  sortDir,
  selectedKey,
}: {
  enabledCategories: ReadonlySet<Category>;
  query: string;
  pinFilter: PinFilter;
  sortKey: SortKey;
  sortDir: SortDir;
  selectedKey: string | null;
}): CollectionData {
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

  const itemsByKey = useMemo(
    () =>
      new Map(
        collectionResults
          .flatMap((result) => result.data ?? [])
          .map((item) => [item.key, item]),
      ),
    [collectionResults],
  );

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATEGORIES.map(
      (category, index): CategoryGroup | null => {
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
      (group): group is CategoryGroup =>
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

  const loading = collectionResults.some(
    (result, index) =>
      enabledCategories.has(CATEGORIES[index]) && result.isPending,
  );
  const error =
    collectionResults.find(
      (result, index) =>
        enabledCategories.has(CATEGORIES[index]) && result.error,
    )?.error ?? null;

  return {
    groups,
    pinnedGroups,
    total,
    pinnedTotal,
    itemsByKey,
    selectedItem,
    resolveResourceLabel,
    loading,
    error,
  };
}