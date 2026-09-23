import type { Ref } from "react";
import { CATEGORIES } from "../../dal/swapi";
import type { BrowseFilters } from "../hooks/useBrowseFilters";

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

export function SearchOptions({
  ref,
  filters,
}: {
  ref?: Ref<HTMLFieldSetElement>;
  filters: BrowseFilters;
}) {
  const {
    query,
    setQuery,
    pinFilter,
    setPinFilter,
    sortKey,
    setSortKey,
    sortDir,
    toggleSortDir,
    enabledCategories,
    setCategories,
    toggleCategory,
  } = filters;
  return (
    <fieldset
      ref={ref}
      className="sticky top-0 z-30 mb-0 rounded-none border-0 border-b border-slate-200 bg-white p-4 lg:rounded-t-lg"
    >
      <div className="mb-3 text-sm font-medium text-slate-700">
        <legend>Search options</legend>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Search
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. skywalker"
          autoComplete="off"
          className={fieldClass}
        />
      </label>
      <label className="mt-3 block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Filter by Pin Status
        </span>
        <select
          value={pinFilter}
          onChange={(event) => setPinFilter(event.target.value)}
          className={fieldClass}
        >
          <option value="all">All</option>
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
            onChange={(event) => setSortKey(event.target.value)}
            className={fieldClass}
          >
            <option value="name">Name / Title</option>
            <option value="pin">Pin status</option>
            <option value="created">Created</option>
            <option value="edited">Edited</option>
          </select>
          <button
            type="button"
            onClick={toggleSortDir}
            className="w-16 shrink-0 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            {sortDir === "asc" ? "Asc" : "Desc"}
          </button>
        </div>
      </label>
      <div className="mt-3">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm font-medium text-slate-700">Categories</span>
          <span className="text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setCategories(new Set(CATEGORIES))}
              className="text-blue-600 hover:text-blue-800"
            >
              all
            </button>
            {" · "}
            <button
              type="button"
              onClick={() => setCategories(new Set())}
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
  );
}
