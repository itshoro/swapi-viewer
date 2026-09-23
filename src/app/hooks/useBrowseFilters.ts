import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { CATEGORIES, type Category } from "../../dal/swapi";
import type { SortDir, SortKey } from "../sorting";

export type PinFilter = "all" | "pinned" | "unpinned";

export interface BrowseFilters {
  search: string;
  query: string;
  pinFilter: PinFilter;
  sortKey: SortKey;
  sortDir: SortDir;
  enabledCategories: ReadonlySet<Category>;
  setQuery: (value: string) => void;
  setPinFilter: (value: string) => void;
  setSortKey: (value: string) => void;
  toggleSortDir: () => void;
  setCategories: (next: ReadonlySet<Category>) => void;
  toggleCategory: (category: Category) => void;
}

export function useBrowseFilters(): BrowseFilters {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.toString();
  const query = searchParams.get("search") ?? "";

  const pinFilterParam = searchParams.get("pin") ?? "";
  const pinFilter: PinFilter =
    pinFilterParam === "pinned" || pinFilterParam === "unpinned"
      ? pinFilterParam
      : "all";

  const sortParam = searchParams.get("sort") ?? "";
  const sortKey: SortKey =
    sortParam === "pin" || sortParam === "created" || sortParam === "edited"
      ? sortParam
      : "name";
  const sortDir: SortDir = searchParams.get("dir") === "desc" ? "desc" : "asc";

  const categoriesParam = searchParams.get("categories");

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

  const setQuery = (value: string) => {
    setSearchParams(value.trim() ? { search: value } : {}, { replace: true });
  };

  const setPinFilter = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("pin");
    else next.set("pin", value);
    setSearchParams(next, { replace: true });
  };

  const setSortKey = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "name") next.delete("sort");
    else next.set("sort", value);
    if (value === "pin" && next.get("dir") === null) {
      next.set("dir", "desc");
    }
    setSearchParams(next, { replace: true });
  };

  const toggleSortDir = () => {
    const next = new URLSearchParams(searchParams);
    if (sortDir === "asc") next.set("dir", "desc");
    else next.delete("dir");
    setSearchParams(next, { replace: true });
  };

  const setCategories = (next: ReadonlySet<Category>) => {
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
    setCategories(next);
  };

  return {
    search,
    query,
    pinFilter,
    sortKey,
    sortDir,
    enabledCategories,
    setQuery,
    setPinFilter,
    setSortKey,
    toggleSortDir,
    setCategories,
    toggleCategory,
  };
}