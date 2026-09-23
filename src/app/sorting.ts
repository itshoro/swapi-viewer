import { resourceLabel, type CollectionItem } from "../dal/swapi";

export type SortKey = "name" | "pin" | "created" | "edited";
export type SortDir = "asc" | "desc";

function resourceDate(
  item: CollectionItem,
  field: "created" | "edited",
): number {
  const raw = item.resource[field];
  if (typeof raw !== "string") return 0;
  const value = Date.parse(raw);
  return Number.isFinite(value) ? value : 0;
}

export function compareItems(
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