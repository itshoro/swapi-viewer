export const CACHE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

const DB_NAME = "swapi-viewer-cache";
const RESPONSES_STORE = "responses";
const OVERRIDES_STORE = "overrides";
const DB_VERSION = 2;

interface CacheEntry<T> {
  key: string;
  timestamp: number;
  data: T;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("indexedDB is not available"));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(RESPONSES_STORE)) {
          db.createObjectStore(RESPONSES_STORE, { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains(OVERRIDES_STORE)) {
          db.createObjectStore(OVERRIDES_STORE, { keyPath: "key" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

function runInStore<T>(
  storeName: string,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const request = operation(transaction.objectStore(storeName));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export async function getCachedEntry<T>(key: string): Promise<T | null> {
  try {
    const entry = await runInStore<CacheEntry<T> | undefined>(
      RESPONSES_STORE,
      (store) => store.get(key),
    );
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_LIFETIME_MS) {
      await runInStore(RESPONSES_STORE, (store) => store.delete(key));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export async function setCachedEntry<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { key, timestamp: Date.now(), data };
    await runInStore(RESPONSES_STORE, (store) => store.put(entry));
  } catch {
    // Caching is best-effort; cache failures must not break requests.
  }
}

interface OverrideEntry {
  key: string;
  data: unknown;
}

export async function getOverride<T>(key: string): Promise<T | null> {
  try {
    const entry = await runInStore<OverrideEntry | undefined>(
      OVERRIDES_STORE,
      (store) => store.get(key),
    );
    return entry ? (entry.data as T) : null;
  } catch {
    return null;
  }
}

export async function getOverrides(
  keys?: readonly string[],
): Promise<Map<string, unknown>> {
  const overrides = new Map<string, unknown>();
  try {
    const entries = await runInStore<OverrideEntry[]>(
      OVERRIDES_STORE,
      (store) => store.getAll(),
    );
    for (const entry of entries) {
      if (!keys || keys.includes(entry.key)) {
        overrides.set(entry.key, entry.data);
      }
    }
  } catch {
    // Overrides are best-effort reads; failures behave like "no override".
  }
  return overrides;
}

export async function setOverride(key: string, data: unknown): Promise<void> {
  const entry: OverrideEntry = { key, data };
  await runInStore(OVERRIDES_STORE, (store) => store.put(entry));
}

export async function deleteOverride(key: string): Promise<void> {
  await runInStore(OVERRIDES_STORE, (store) => store.delete(key));
}
