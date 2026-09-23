import { Link } from "react-router";
import type { CollectionItem } from "../../dal/swapi";
import type { CategoryGroup } from "../hooks/useCollectionData";
import { EntityList } from "./EntityList";

interface GroupSectionProps {
  group: CategoryGroup;
  selectedKey: string | null;
  onSelect: (item: CollectionItem) => void;
  onTogglePin: (item: CollectionItem) => void;
}

export function GroupSection({
  group,
  selectedKey,
  onSelect,
  onTogglePin,
}: GroupSectionProps) {
  return (
    <section className="mb-5">
      <h3
        style={{
          top: "calc(var(--sticky-offset, 0rem) + var(--sticky-heading-height, 2.5rem))",
        }}
        className="sticky z-10 mb-2 flex items-baseline gap-2 bg-white py-1 text-base font-semibold text-slate-800"
      >
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
        onSelect={onSelect}
        onTogglePin={onTogglePin}
        selectedKey={selectedKey}
      />
    </section>
  );
}
