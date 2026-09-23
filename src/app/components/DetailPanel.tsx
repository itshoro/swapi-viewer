import { Link, type To } from "react-router";
import {
  resourceLabel,
  type CollectionItem,
  type ResourceRef,
} from "../../dal/swapi";
import { EntityField } from "./EntityField";

interface DetailPanelProps {
  item: CollectionItem;
  onClose: () => void;
  onTogglePin: (item: CollectionItem) => void;
  onDelete: (item: CollectionItem) => void;
  linkTo: (ref: ResourceRef) => To;
  resolveLabel: (ref: ResourceRef) => string | null | undefined;
}

export function DetailPanel({
  item,
  onClose,
  onTogglePin,
  onDelete,
  linkTo,
  resolveLabel,
}: DetailPanelProps) {
  const { category, id, resource, modified, pinned } = item;
  return (
    <section className="rounded-none border-0 bg-white p-4 lg:rounded-lg lg:border lg:border-slate-200">
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
          />
        ))}
      </dl>
    </section>
  );
}