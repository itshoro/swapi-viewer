import { resourceLabel, type CollectionItem } from "../../dal/swapi";

interface EntityListProps {
  items: CollectionItem[];
  onSelect: (item: CollectionItem) => void;
  onTogglePin?: (item: CollectionItem) => void;
  selectedKey?: string | null;
}

export function EntityList({
  items,
  onSelect,
  onTogglePin,
  selectedKey,
}: EntityListProps) {
  if (items.length === 0) return null;
  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
      {items.map((item) => {
        const selected = item.key === selectedKey;
        const selectButtonClassName = [
          "flex",
          "min-w-0",
          "flex-1",
          "items-center",
          "justify-between",
          "gap-2",
          "px-4",
          "py-2",
          "text-left",
          "transition-colors",
          selected ? "hover:bg-blue-100" : "hover:bg-slate-50",
        ].join(" ");
        const labelClassName = selected
          ? "truncate text-sm font-medium text-blue-700"
          : "truncate text-sm text-slate-800";
        return (
          <li
            key={item.key}
            className={selected ? "bg-blue-50" : ""}
            data-selected={selected ? "true" : undefined}
            style={
              selected
                ? {
                    scrollMarginTop:
                      "calc(var(--sticky-offset, 0rem) + var(--sticky-heading-height, 2.5rem) + 2rem)",
                  }
                : undefined
            }
          >
            <div className="flex items-stretch">
              <button
                type="button"
                onClick={() => onSelect(item)}
                className={selectButtonClassName}
              >
                <span className={labelClassName}>
                  {resourceLabel(item.resource)}
                </span>
                {item.modified ? (
                  <strong className="shrink-0 text-xs font-semibold text-amber-600">
                    (modified)
                  </strong>
                ) : null}
              </button>
              {onTogglePin ? (
                <button
                  type="button"
                  onClick={() => onTogglePin(item)}
                  aria-label={item.pinned ? "Unpin" : "Pin"}
                  className="shrink-0 border-l border-slate-200 px-3 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-50 hover:text-blue-600"
                >
                  {item.pinned ? "Unpin" : "Pin"}
                </button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
