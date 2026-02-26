import type { GameType } from '@/types/index';
import type {
  Preset,
  PresetData,
  PrizePresetData,
  NamePresetData,
  NumberPresetData,
  LadderPresetData,
} from '@/types/preset';

export const STORAGE_KEY_PREFIX = 'lucky-pick-presets-';
export const MAX_PRESETS_PER_GAME = 5;
export const MAX_PRESET_NAME_LENGTH = 30;
export const MAX_PRESET_DATA_SIZE = 50_000;

/**
 * Generate a unique ID using crypto.randomUUID with fallback.
 */
function generateId(): string {
  try {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
  } catch {
    // fallback below
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getStorageKey(gameType: GameType): string {
  return `${STORAGE_KEY_PREFIX}${gameType}`;
}

/**
 * Remove dangerous characters (<>"'&) from a name string.
 */
function sanitizeName(name: string): string {
  return name.replace(/[<>"'&]/g, '');
}

/**
 * Validates game-specific data structure.
 */
function isValidPresetData(gameType: string, data: unknown): boolean {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  switch (gameType) {
    case 'prize': {
      const d = data as PrizePresetData;
      return typeof d.items === 'string';
    }
    case 'name': {
      const d = data as NamePresetData;
      return (
        typeof d.names === 'string' &&
        typeof d.pickCount === 'number' &&
        typeof d.removeAfterPick === 'boolean'
      );
    }
    case 'number': {
      const d = data as NumberPresetData;
      return (
        typeof d.minValue === 'number' &&
        typeof d.maxValue === 'number' &&
        typeof d.pickCount === 'number' &&
        typeof d.allowDuplicates === 'boolean' &&
        typeof d.sortResults === 'boolean'
      );
    }
    case 'ladder': {
      const d = data as LadderPresetData;
      return (
        typeof d.participantCount === 'number' &&
        Array.isArray(d.participantNames) &&
        Array.isArray(d.resultNames)
      );
    }
    default:
      return false;
  }
}

/**
 * Validates that an unknown value has the shape of a Preset object,
 * including game-specific data validation.
 */
function isValidPreset(item: unknown): item is Preset {
  if (
    typeof item !== 'object' ||
    item === null ||
    typeof (item as Preset).id !== 'string' ||
    typeof (item as Preset).name !== 'string' ||
    typeof (item as Preset).gameType !== 'string' ||
    typeof (item as Preset).createdAt !== 'number' ||
    typeof (item as Preset).data !== 'object' ||
    (item as Preset).data === null
  ) {
    return false;
  }

  return isValidPresetData(
    (item as Preset).gameType,
    (item as Preset).data
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
 * - Name is sanitized (dangerous chars removed), trimmed, and truncated.
 * - Returns null if name is empty after processing, data exceeds size limit,
 *   or localStorage write fails.
 * - If the number of presets exceeds MAX_PRESETS_PER_GAME, the oldest is removed.
 */
export function savePreset<T extends PresetData>(
  gameType: GameType,
  name: string,
  data: T
): Preset<T> | null {
  // L-1: Check data size
  const dataJson = JSON.stringify(data);
  if (dataJson.length > MAX_PRESET_DATA_SIZE) {
    return null;
  }

  // H-1: Sanitize dangerous characters, L-2: trim whitespace
  const safeName = sanitizeName(name).trim().slice(0, MAX_PRESET_NAME_LENGTH);

  // L-2: Empty name after sanitization + trim
  if (safeName.length === 0) {
    return null;
  }

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
 * Returns true if the preset was found and deleted, false otherwise.
 */
export function deletePreset(gameType: GameType, presetId: string): boolean {
  const existing = getPresets(gameType);
  const filtered = existing.filter((p) => p.id !== presetId);

  // If lengths are equal, nothing was deleted
  if (filtered.length === existing.length) {
    return false;
  }

  try {
    localStorage.setItem(getStorageKey(gameType), JSON.stringify(filtered));
  } catch {
    return false;
  }

  return true;
}
