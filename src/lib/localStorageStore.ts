const CHANGE_EVENT = "workouts:storage-change";

export function readStoredValue(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function parseStoredValue<T>(value: string | null, fallback: T): T {
  try {
    return value === null ? fallback : JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function writeStoredValue<T>(
  key: string,
  update: T | ((previous: T) => T),
  fallback: T
) {
  const previous = parseStoredValue(readStoredValue(key), fallback);
  const next = typeof update === "function"
    ? (update as (previous: T) => T)(previous)
    : update;
  // Write before notifying subscribers so navigation and functional updates see
  // the latest value. Do not write during reads or mounting.
  window.localStorage.setItem(key, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
}

export function subscribeStoredValue(key: string, onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.storageArea === window.localStorage &&
        (event.key === key || event.key === null)) onChange();
  };
  const onLocalChange = (event: Event) => {
    if ((event as CustomEvent<string>).detail === key) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onLocalChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onLocalChange);
  };
}
