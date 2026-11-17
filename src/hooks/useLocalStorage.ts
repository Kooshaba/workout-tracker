import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import type { SetStateAction } from "react";
import {
  parseStoredValue,
  readStoredValue,
  subscribeStoredValue,
  writeStoredValue,
} from "../lib/localStorageStore";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const fallback = useRef(initialValue);
  const subscribe = useCallback(
    (onChange: () => void) => subscribeStoredValue(key, onChange),
    [key]
  );
  const getSnapshot = useCallback(() => readStoredValue(key), [key]);
  const rawValue = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const storedValue = useMemo(
    () => parseStoredValue(rawValue, fallback.current),
    [rawValue]
  );
  const setStoredValue = useCallback((update: SetStateAction<T>) => {
    writeStoredValue(key, update, fallback.current);
  }, [key]);

  return [storedValue, setStoredValue] as const;
}
