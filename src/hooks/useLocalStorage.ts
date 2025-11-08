import { useEffect, useState } from 'react';

type SetValue<T> = (value: T | ((val: T) => T)) => void;

function readValue<T>(key: string, initialValue: T): T {
  if (typeof window === 'undefined' || !key) {
    return initialValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) as T : initialValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const [storedValue, setStoredValue] = useState<T>(() => readValue(key, initialValue));

  const setValue: SetValue<T> = (value) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);

    if (typeof window === 'undefined' || !key) return;

    try {
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  useEffect(() => {
    setStoredValue(readValue(key, initialValue));
  }, [key, initialValue]);

  useEffect(() => {
    if (typeof window === 'undefined' || !key) return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key) return;

      try {
        const newValue = event.newValue ? JSON.parse(event.newValue) : initialValue;
        setStoredValue(newValue);
      } catch (error) {
        console.warn(`Error syncing localStorage key "${key}":`, error);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, initialValue]);

  return [storedValue, setValue];
}
