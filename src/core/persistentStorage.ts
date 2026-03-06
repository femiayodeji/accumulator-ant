type StorageApi = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'clear'>;

const MIGRATION_KEYS = [
  'accumulator.currentLevel',
  'accumulator.maxLevel',
  'accumulator.levelStats',
  'accumulator.musicEnabled',
];

let activeStorage: StorageApi | null = null;
let sdkInitAttempted = false;

function getLocalStorage(): StorageApi | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getStorage(): StorageApi | null {
  if (activeStorage) {
    return activeStorage;
  }

  return getLocalStorage();
}

function migrateKeysToSdkData(local: StorageApi, data: StorageApi): void {
  for (const key of MIGRATION_KEYS) {
    try {
      const localValue = local.getItem(key);
      if (localValue === null) {
        continue;
      }

      const remoteValue = data.getItem(key);
      if (remoteValue === null) {
        data.setItem(key, localValue);
      }
    } catch {
      // Continue migration even if one key fails.
    }
  }
}

function isSupportedCrazyGamesEnvironment(env: string | undefined): boolean {
  return env === 'crazygames' || env === 'local';
}

export async function initPersistentStorage(): Promise<void> {
  if (sdkInitAttempted) {
    return;
  }

  sdkInitAttempted = true;

  if (typeof window === 'undefined' || !window.CrazyGames?.SDK) {
    return;
  }

  const sdk = window.CrazyGames.SDK;

  try {
    await sdk.init();
  } catch {
    return;
  }

  if (!isSupportedCrazyGamesEnvironment(sdk.environment) || !sdk.data) {
    return;
  }

  const local = getLocalStorage();
  if (local) {
    migrateKeysToSdkData(local, sdk.data);
  }

  activeStorage = sdk.data;
}

export function persistGetItem(key: string): string | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function persistSetItem(key: string, value: string): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, value);
  } catch {
    // Ignore storage failures.
  }
}

export function persistRemoveItem(key: string): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
}
