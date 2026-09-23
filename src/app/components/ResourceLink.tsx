import { Link, type To } from "react-router";
import { parseResourceUrl, type ResourceRef } from "../../dal/swapi";

interface ResourceLinkProps {
  url: string;
  to?: (ref: ResourceRef) => To;
  replace?: boolean;
  label?: (ref: ResourceRef) => string | null | undefined;
}

export function ResourceLink({
  url,
  to,
  replace = false,
  label,
}: ResourceLinkProps) {
  const ref = parseResourceUrl(url);
  if (!ref) {
    return <span>{url}</span>;
  }
  const text = label?.(ref) ?? `/api/${ref.category}/${ref.id}`;
  return (
    <Link
      to={to ? to(ref) : `/${ref.category}/${ref.id}`}
      replace={replace}
      className="text-blue-600 underline decoration-blue-300 hover:text-blue-800 hover:decoration-blue-800"
    >
      {text}
    </Link>
  );
}