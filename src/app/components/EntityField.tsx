import type { ReactNode } from "react";
import type { To } from "react-router";
import { ResourceLink } from "./ResourceLink";
import { parseResourceUrl, type ResourceRef } from "../../dal/swapi";

type LinkTo = (ref: ResourceRef) => To;
type ResolveLabel = (ref: ResourceRef) => string | null | undefined;

function isResourceUrl(value: unknown): value is string {
  return typeof value === "string" && parseResourceUrl(value) !== null;
}

function isDeletedRef(value: string, resolveLabel?: ResolveLabel): boolean {
  const ref = parseResourceUrl(value);
  return ref !== null && resolveLabel?.(ref) === null;
}

function renderValue(
  value: unknown,
  linkTo?: LinkTo,
  replace?: boolean,
  resolveLabel?: ResolveLabel,
): ReactNode {
  if (typeof value === "string") {
    if (isResourceUrl(value)) {
      if (isDeletedRef(value, resolveLabel)) return null;
      return (
        <ResourceLink
          url={value}
          to={linkTo}
          replace={replace}
          label={resolveLabel}
        />
      );
    }
    return <span>{value}</span>;
  }
  if (Array.isArray(value) && value.length > 0 && value.every(isResourceUrl)) {
    const visible = value.filter((entry) => !isDeletedRef(entry, resolveLabel));
    if (visible.length === 0) return null;
    return (
      <ul className="space-y-0.5">
        {visible.map((entry) => (
          <li key={entry}>
            <ResourceLink
              url={entry}
              to={linkTo}
              replace={replace}
              label={resolveLabel}
            />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
      {JSON.stringify(value)}
    </code>
  );
}

interface EntityFieldProps {
  name: string;
  value: unknown;
  linkTo?: LinkTo;
  replace?: boolean;
  resolveLabel?: ResolveLabel;
}

export function EntityField({
  name,
  value,
  linkTo,
  replace,
  resolveLabel,
}: EntityFieldProps) {
  const rendered = renderValue(value, linkTo, replace, resolveLabel);
  if (rendered === null) return null;
  return (
    <div className="grid grid-cols-[minmax(0,10rem)_1fr] items-baseline gap-x-3 py-1.5">
      <dt className="text-sm font-medium text-slate-500">{name}</dt>
      <dd className="min-w-0 break-words text-sm text-slate-800">{rendered}</dd>
    </div>
  );
}