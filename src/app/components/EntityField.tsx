import type { To } from "react-router";
import { ResourceLink } from "./ResourceLink";
import { parseResourceUrl, type ResourceRef } from "../../dal/swapi";

type LinkTo = (ref: ResourceRef) => To;
type ResolveLabel = (ref: ResourceRef) => string | undefined;

function isResourceUrl(value: unknown): value is string {
  return typeof value === "string" && parseResourceUrl(value) !== null;
}

function renderValue(
  value: unknown,
  linkTo?: LinkTo,
  replace?: boolean,
  resolveLabel?: ResolveLabel,
) {
  if (typeof value === "string") {
    if (isResourceUrl(value)) {
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
    return (
      <ul className="space-y-0.5">
        {value.map((entry) => (
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
  return (
    <div className="grid grid-cols-[minmax(0,10rem)_1fr] items-baseline gap-x-3 py-1.5">
      <dt className="text-sm font-medium text-slate-500">{name}</dt>
      <dd className="min-w-0 break-words text-sm text-slate-800">
        {renderValue(value, linkTo, replace, resolveLabel)}
      </dd>
    </div>
  );
}