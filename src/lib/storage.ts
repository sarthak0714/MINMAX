const VERSION = 'v1';

function buildKey(name: string): string {
  return `mmx.${name}.${VERSION}`;
}

export function readStorage<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(buildKey(name));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(name: string, value: T): void {
  try {
    localStorage.setItem(buildKey(name), JSON.stringify(value));
  } catch {
    // ignore write errors (quota/private mode)
  }
}

export function updateStorage<T>(name: string, updater: (prev: T) => T, fallback: T): T {
  const next = updater(readStorage<T>(name, fallback));
  writeStorage<T>(name, next);
  return next;
}


