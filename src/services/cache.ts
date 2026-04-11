import AsyncStorage from '@react-native-async-storage/async-storage';

type CacheEnvelope<T> = {
  updatedAt: number;
  data: T;
};

export const readCache = async <T>(key: string): Promise<CacheEnvelope<T> | null> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEnvelope<T>;
  } catch {
    return null;
  }
};

export const writeCache = async <T>(key: string, data: T): Promise<void> => {
  const payload: CacheEnvelope<T> = { updatedAt: Date.now(), data };
  try {
    await AsyncStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // cache write is best-effort only
  }
};

export const getFreshCache = async <T>(key: string, ttlMs: number): Promise<T | null> => {
  const cached = await readCache<T>(key);
  if (!cached) return null;
  if (Date.now() - cached.updatedAt > ttlMs) return null;
  return cached.data;
};
