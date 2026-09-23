import {
  deleteOverride,
  getCachedEntry,
  getOverride,
  getOverrides,
  setCachedEntry,
  setOverride,
} from "./cache";

export const API_BASE = "https://swapi.info/api";

export const CATEGORIES = [
  "films",
  "people",
  "planets",
  "species",
  "vehicles",
  "starships",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Resource = Record<string, unknown> & { url: string };

export type RootIndex = Record<Category, string>;

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

export function resourceLabel(resource: Resource): string {
  const label = resource.name ?? resource.title;
  if (typeof label === "string") return label;
  return typeof resource.url === "string" ? resource.url : "";
}

export function resourceKey(category: Category, id: string): string {
  return `/api/${category}/${id}`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`swapi.info request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

async function readThrough<T>(key: string, path: string): Promise<T> {
  const cached = await getCachedEntry<T>(key);
  if (cached !== null) return cached;
  const data = await fetchJson<T>(path);
  await setCachedEntry(key, data);
  return data;
}

export function getRoot(): Promise<RootIndex> {
  return readThrough<RootIndex>("root", "/");
}

export interface CollectionItem {
  key: string;
  category: Category;
  id: string;
  resource: Resource;
  modified: boolean;
}

export async function getCollection(
  category: Category,
): Promise<CollectionItem[]> {
  const base = await readThrough<Resource[]>(`/api/${category}`, `/${category}`);
  const entries = base
    .map((resource) => {
      const ref = parseResourceUrl(resource.url);
      return ref ? { resource, ref } : null;
    })
    .filter(
      (entry): entry is { resource: Resource; ref: ResourceRef } =>
        entry !== null,
    );
  const overrides = await getOverrides(
    entries.map(({ ref }) => resourceKey(ref.category, ref.id)),
  );
  return entries.map(({ resource, ref }) => {
    const key = resourceKey(ref.category, ref.id);
    const override = overrides.get(key);
    return {
      key,
      category: ref.category,
      id: ref.id,
      resource: override !== undefined ? (override as Resource) : resource,
      modified: override !== undefined,
    };
  });
}

export async function getResource(
  category: Category,
  id: string,
): Promise<Resource> {
  const key = resourceKey(category, id);
  const override = await getOverride<Resource>(key);
  if (override !== null) return override;
  return readThrough<Resource>(key, `/${category}/${id}`);
}

export async function isResourceModified(
  category: Category,
  id: string,
): Promise<boolean> {
  return (await getOverride(resourceKey(category, id))) !== null;
}

export async function saveResourceOverride(
  category: Category,
  id: string,
  data: Resource,
): Promise<void> {
  await setOverride(resourceKey(category, id), data);
}

export async function restoreResource(
  category: Category,
  id: string,
): Promise<void> {
  await deleteOverride(resourceKey(category, id));
}

export interface ResourceRef {
  category: Category;
  id: string;
  url: string;
}

export function parseResourceUrl(url: string): ResourceRef | null {
  const prefix = `${API_BASE}/`;
  if (typeof url !== "string" || !url.startsWith(prefix)) return null;
  const [category, id] = url.slice(prefix.length).split("/");
  if (!category || !isCategory(category) || !/^\d+$/.test(id ?? "")) return null;
  return { category, id, url };
}
