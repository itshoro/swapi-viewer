import * as v from "valibot";
import {
  deleteCachedEntry,
  deleteOverride,
  getCachedEntry,
  getOverride,
  getOverridesByPrefix,
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

export interface Resource {
  url: string;
  [key: string]: unknown;
}

export type RootIndex = Record<Category, string>;

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

export function resourceLabel(resource: Resource): string {
  const label = resource.name ?? resource.title;
  if (typeof label === "string") return label;
  return resource.url;
}

export function resourceKey(category: Category, id: string): string {
  return `/api/${category}/${id}`;
}

export class HttpError extends Error {
  status: number;

  constructor(status: number) {
    super(`swapi.info request failed with status ${status}`);
    this.name = "HttpError";
    this.status = status;
  }
}

// ---------------------------------------------------------------- schemas

export type TypeGuard<T> = (value: unknown) => value is T;

const rootSchema = v.object({
  films: v.string(),
  people: v.string(),
  planets: v.string(),
  species: v.string(),
  vehicles: v.string(),
  starships: v.string(),
});

const resourceSchema = v.objectWithRest({ url: v.string() }, v.unknown());

/** Best-effort structural check used for collection payload parsing. */
function isResource(value: unknown): boolean {
  return v.is(resourceSchema, value);
}

// ------------------------------------------------------------------ http

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new HttpError(response.status);
  }
  return (await response.json()) as T;
}

async function readThrough<T>(
  key: string,
  path: string,
  isValid: (value: unknown) => boolean,
): Promise<T> {
  const cached = await getCachedEntry<unknown>(key);
  if (cached !== null) {
    if (isValid(cached)) return cached as T;
    await deleteCachedEntry(key);
  }
  const data = await fetchJson<unknown>(path);
  if (!isValid(data)) {
    throw new Error(`Unexpected response format from ${path}`);
  }
  await setCachedEntry(key, data);
  return data as T;
}

export function getRoot(): Promise<RootIndex> {
  return readThrough<RootIndex>("root", "/", (value) => v.is(rootSchema, value));
}

// ------------------------------------------------------------- overrides

export async function getResourceOverride<T>(
  category: Category,
  id: string,
  guard: TypeGuard<T>,
): Promise<T | null> {
  const override = await getOverride<unknown>(resourceKey(category, id));
  if (override === null) return null;
  return guard(override) ? override : null;
}

export async function setResourceOverride<T>(
  category: Category,
  id: string,
  data: T,
): Promise<void> {
  await setOverride(resourceKey(category, id), data);
}

export async function clearResourceOverride(
  category: Category,
  id: string,
): Promise<void> {
  await deleteOverride(resourceKey(category, id));
}

export async function isResourceModified(
  category: Category,
  id: string,
): Promise<boolean> {
  return (await getOverride(resourceKey(category, id))) !== null;
}

// ------------------------------------------------------------ collections

export interface CollectionItem<T = Resource> {
  key: string;
  category: Category;
  id: string;
  resource: T;
  modified: boolean;
}

export async function getCollection<T>(
  category: Category,
  guard: TypeGuard<T>,
): Promise<CollectionItem<T>[]> {
  const base = await readThrough<Resource[]>(
    `/api/${category}`,
    `/${category}`,
    (value) => Array.isArray(value) && value.every((element) => guard(element)),
  );
  const entries = base
    .map((resource) => {
      const ref = parseResourceUrl(resource.url);
      return ref ? { resource, ref } : null;
    })
    .filter(
      (entry): entry is { resource: Resource; ref: ResourceRef } =>
        entry !== null,
    );
  const overrides = await getOverridesByPrefix(`/api/${category}/`);
  const items = entries.map(({ resource, ref }) => {
    const key = resourceKey(ref.category, ref.id);
    const override = overrides.get(key);
    const hasValidOverride = override !== undefined && guard(override);
    return {
      key,
      category: ref.category,
      id: ref.id,
      resource: hasValidOverride ? (override as T) : (resource as T),
      modified: hasValidOverride,
    };
  });
  const seen = new Set(items.map((item) => item.key));
  const prefix = `/api/${category}/`;
  for (const [key, data] of overrides) {
    if (seen.has(key) || !key.startsWith(prefix) || !guard(data)) continue;
    const id = key.slice(prefix.length);
    if (!/^\d+$/.test(id)) continue;
    items.push({
      key,
      category,
      id,
      resource: data as T,
      modified: true,
    });
  }
  return items;
}

export async function getResource<T>(
  category: Category,
  id: string,
  guard: TypeGuard<T>,
): Promise<T> {
  const key = resourceKey(category, id);
  const override = await getResourceOverride(category, id, guard);
  if (override !== null) return override;
  return readThrough<T>(key, `/${category}/${id}`, guard);
}

export async function nextResourceId(category: Category): Promise<string> {
  const overrides = await getOverridesByPrefix(`/api/${category}/`);
  let max = 0;
  for (const key of overrides.keys()) {
    const id = Number(key.split("/").pop());
    if (Number.isInteger(id) && id > max) max = id;
  }
  try {
    const base = await readThrough<Resource[]>(
      `/api/${category}`,
      `/${category}`,
      (value) => Array.isArray(value) && value.every(isResource),
    );
    for (const resource of base) {
      const ref = parseResourceUrl(resource.url);
      if (ref && /^\d+$/.test(ref.id)) {
        const id = Number(ref.id);
        if (id > max) max = id;
      }
    }
  } catch {
    // Offline and no cache: fall back to the highest override id + 1.
  }
  return String(max + 1);
}

// ------------------------------------------------------------- category api

export interface CategoryApi<T> {
  list(): Promise<CollectionItem<T>[]>;
  get(id: string): Promise<T>;
  save(id: string, data: T): Promise<void>;
  restore(id: string): Promise<void>;
  isModified(id: string): Promise<boolean>;
  blank(url: string): T;
  label(resource: T): string;
  guard(value: unknown): value is T;
}

export function categoryApi<T>(
  category: Category,
  blank: (url: string) => T,
  label: (resource: T) => string,
  guard: TypeGuard<T>,
): CategoryApi<T> {
  return {
    list: () => getCollection(category, guard),
    get: (id: string) => getResource(category, id, guard),
    save: (id: string, data: T) => setResourceOverride(category, id, data),
    restore: (id: string) => clearResourceOverride(category, id),
    isModified: (id: string) => isResourceModified(category, id),
    blank,
    label,
    guard,
  };
}

// ---------------------------------------------------------------- refs

export interface ResourceRef {
  category: Category;
  id: string;
  url: string;
}

export function parseResourceUrl(url: string): ResourceRef | null {
  const prefix = `${API_BASE}/`;
  if (typeof url !== "string" || !url.startsWith(prefix)) return null;
  const [category, id] = url.slice(prefix.length).split("/");
  if (!category || !isCategory(category) || !/^\d+$/.test(id ?? ""))
    return null;
  return { category, id, url };
}
