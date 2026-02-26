import type { GameType } from '@/types/index';
import type { Preset, PresetData } from '@/types/preset';

export const STORAGE_KEY_PREFIX = 'lucky-pick-presets-';
export const MAX_PRESETS_PER_GAME = 5;
export const MAX_PRESET_NAME_LENGTH = 30;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getStorageKey(gameType: GameType): string {
  return `${STORAGE_KEY_PREFIX}${gameType}`;
}

/**
 * Validates that an unknown value has the shape of a Preset object.
 */
function isValidPreset(item: unknown): item is Preset {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof (item as Preset).id === 'string' &&
    typeof (item as Preset).name === 'string' &&
    typeof (item as Preset).gameType === 'string' &&
    typeof (item as Preset).createdAt === 'number' &&
    typeof (item as Preset).data === 'object' &&
    (item as Preset).data !== null
  );
}

/**
 * Retrieve all presets for a given game type from localStorage.
 * Returns an empty array if no presets exist, data is corrupted, or SSR.
 * Invalid entries are filtered out to guard against manually tampered data.
 */
export function getPresets<T extends PresetData>(gameType: GameType): Preset<T>[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(getStorageKey(gameType));
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isValidPreset) as Preset<T>[];
  } catch {
    return [];
  }
}

/**
 * Save a new preset for the given game type.
 * If the number of presets exceeds MAX_PRESETS_PER_GAME, the oldest is removed.
 * Name is truncated to MAX_PRESET_NAME_LENGTH characters.
 * Returns the newly created preset, or null if localStorage write fails.
 */
export function savePreset<T extends PresetData>(
  gameType: GameType,
  name: string,
  data: T
): Preset<T> | null {
  const safeName = name.slice(0, MAX_PRESET_NAME_LENGTH);

  const preset: Preset<T> = {
    id: generateId(),
    name: safeName,
    gameType,
    data,
    createdAt: Date.now(),
  };

  const existing = getPresets<T>(gameType);
  existing.push(preset);

  // Evict oldest presets if over the limit, keeping only the most recent
  const trimmed = existing.length > MAX_PRESETS_PER_GAME
    ? existing.slice(-MAX_PRESETS_PER_GAME)
    : existing;

  try {
    localStorage.setItem(getStorageKey(gameType), JSON.stringify(trimmed));
  } catch {
    return null;
  }

  return preset;
}

/**
 * Delete a preset by ID for the given game type.
 * Does nothing if the ID does not exist.
 */
export function deletePreset(gameType: GameType, presetId: string): void {
  const existing = getPresets(gameType);
  const filtered = existing.filter((p) => p.id !== presetId);

  try {
    localStorage.setItem(getStorageKey(gameType), JSON.stringify(filtered));
  } catch {
    // localStorage unavailable - fail silently
  }
}
