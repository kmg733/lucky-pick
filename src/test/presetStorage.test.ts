import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPresets,
  savePreset,
  deletePreset,
  MAX_PRESETS_PER_GAME,
  MAX_PRESET_NAME_LENGTH,
  MAX_PRESET_DATA_SIZE,
  STORAGE_KEY_PREFIX,
} from '@/lib/presetStorage';
import type { NumberPresetData, PrizePresetData, NamePresetData, LadderPresetData } from '@/types/preset';

describe('presetStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // ─── getPresets ───────────────────────────────────────────────

  describe('getPresets', () => {
    it('returns empty array when no presets exist', () => {
      const result = getPresets<NumberPresetData>('number');
      expect(result).toEqual([]);
    });

    it('returns saved presets for a given game type', () => {
      const data: NumberPresetData = {
        minValue: 1,
        maxValue: 100,
        pickCount: 3,
        allowDuplicates: false,
        sortResults: true,
      };
      savePreset<NumberPresetData>('number', 'My Number Preset', data);

      const result = getPresets<NumberPresetData>('number');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('My Number Preset');
      expect(result[0].gameType).toBe('number');
      expect(result[0].data).toEqual(data);
    });

    it('returns empty array when localStorage contains corrupted JSON', () => {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}prize`, 'not-valid-json{{{');

      const result = getPresets<PrizePresetData>('prize');
      expect(result).toEqual([]);
    });

    it('returns empty array when localStorage contains non-array JSON', () => {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}prize`, '{"key": "value"}');

      const result = getPresets<PrizePresetData>('prize');
      expect(result).toEqual([]);
    });

    it('does not return presets from different game types', () => {
      const prizeData: PrizePresetData = { items: 'item1\nitem2' };
      savePreset<PrizePresetData>('prize', 'Prize Preset', prizeData);

      const result = getPresets<NumberPresetData>('number');
      expect(result).toEqual([]);
    });
  });

  // ─── savePreset ──────────────────────────────────────────────

  describe('savePreset', () => {
    it('saves a new preset and returns it with id, createdAt, and gameType', () => {
      const data: PrizePresetData = { items: 'Gold\nSilver\nBronze' };

      const saved = savePreset<PrizePresetData>('prize', 'Prizes', data);
      expect(saved).not.toBeNull();

      expect(saved!.id).toBeTruthy();
      expect(saved!.name).toBe('Prizes');
      expect(saved!.gameType).toBe('prize');
      expect(saved!.data).toEqual(data);
      expect(saved!.createdAt).toBeTypeOf('number');
      expect(saved!.createdAt).toBeGreaterThan(0);
    });

    it('generates unique IDs for each saved preset', () => {
      const data: PrizePresetData = { items: 'item' };

      const preset1 = savePreset<PrizePresetData>('prize', 'P1', data);
      const preset2 = savePreset<PrizePresetData>('prize', 'P2', data);
      expect(preset1).not.toBeNull();
      expect(preset2).not.toBeNull();

      expect(preset1!.id).not.toBe(preset2!.id);
    });

    it('persists preset to localStorage', () => {
      const data: NamePresetData = {
        names: 'Alice\nBob',
        pickCount: 1,
        removeAfterPick: false,
      };
      savePreset<NamePresetData>('name', 'Names', data);

      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}name`);
      expect(raw).toBeTruthy();

      const parsed = JSON.parse(raw!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Names');
    });

    it('allows saving up to MAX_PRESETS_PER_GAME presets', () => {
      const data: PrizePresetData = { items: 'item' };

      for (let i = 0; i < MAX_PRESETS_PER_GAME; i++) {
        savePreset<PrizePresetData>('prize', `Preset ${i}`, data);
      }

      const result = getPresets<PrizePresetData>('prize');
      expect(result).toHaveLength(MAX_PRESETS_PER_GAME);
    });

    it('removes the oldest preset when exceeding MAX_PRESETS_PER_GAME', () => {
      const data: PrizePresetData = { items: 'item' };

      // Save MAX presets
      for (let i = 0; i < MAX_PRESETS_PER_GAME; i++) {
        savePreset<PrizePresetData>('prize', `Preset ${i}`, data);
      }

      // Save one more - should evict the oldest (Preset 0)
      savePreset<PrizePresetData>('prize', 'Newest Preset', data);

      const result = getPresets<PrizePresetData>('prize');
      expect(result).toHaveLength(MAX_PRESETS_PER_GAME);

      const names = result.map((p) => p.name);
      expect(names).not.toContain('Preset 0');
      expect(names).toContain('Newest Preset');
    });

    it('handles localStorage write failure gracefully and returns null', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      const data: PrizePresetData = { items: 'item' };

      // Should not throw even when localStorage fails
      const result = savePreset<PrizePresetData>('prize', 'Test', data);
      expect(result).toBeNull();

      setItemSpy.mockRestore();
    });
  });

  // ─── deletePreset ────────────────────────────────────────────

  describe('deletePreset', () => {
    it('deletes a preset by ID', () => {
      const data: PrizePresetData = { items: 'item' };
      const saved = savePreset<PrizePresetData>('prize', 'To Delete', data);
      expect(saved).not.toBeNull();

      deletePreset('prize', saved!.id);

      const result = getPresets<PrizePresetData>('prize');
      expect(result).toHaveLength(0);
    });

    it('only deletes the specified preset, keeping others intact', () => {
      const data: PrizePresetData = { items: 'item' };
      const preset1 = savePreset<PrizePresetData>('prize', 'Keep', data);
      const preset2 = savePreset<PrizePresetData>('prize', 'Delete', data);
      expect(preset1).not.toBeNull();
      expect(preset2).not.toBeNull();

      deletePreset('prize', preset2!.id);

      const result = getPresets<PrizePresetData>('prize');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(preset1!.id);
      expect(result[0].name).toBe('Keep');
    });

    it('does nothing when deleting a non-existent ID', () => {
      const data: PrizePresetData = { items: 'item' };
      savePreset<PrizePresetData>('prize', 'Existing', data);

      // Should not throw
      expect(() => deletePreset('prize', 'non-existent-id')).not.toThrow();

      const result = getPresets<PrizePresetData>('prize');
      expect(result).toHaveLength(1);
    });

    it('does nothing when no presets exist for the game type', () => {
      expect(() => deletePreset('ladder', 'some-id')).not.toThrow();
    });
  });

  // ─── getPresets - structure validation (H-1) ────────────────

  describe('getPresets - structure validation', () => {
    it('filters out array items missing required fields', () => {
      const malformed = [
        { id: 'valid', name: 'Test', gameType: 'prize', data: { items: 'a' }, createdAt: 1000 },
        { name: 'no-id' },
        { id: 123, name: 'bad-id-type', gameType: 'prize', data: {}, createdAt: 1000 },
        'just a string',
        null,
      ];
      localStorage.setItem(`${STORAGE_KEY_PREFIX}prize`, JSON.stringify(malformed));

      const result = getPresets<PrizePresetData>('prize');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test');
    });

    it('filters out items where data is not an object', () => {
      const items = [
        { id: 'a', name: 'N', gameType: 'prize', data: 'string-data', createdAt: 1000 },
        { id: 'b', name: 'M', gameType: 'prize', data: null, createdAt: 1000 },
        { id: 'c', name: 'O', gameType: 'prize', data: { items: 'ok' }, createdAt: 1000 },
      ];
      localStorage.setItem(`${STORAGE_KEY_PREFIX}prize`, JSON.stringify(items));

      const result = getPresets<PrizePresetData>('prize');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('c');
    });
  });

  // ─── savePreset - name truncation (H-2) ────────────────────

  describe('savePreset - name handling', () => {
    it('truncates name to MAX_PRESET_NAME_LENGTH characters', () => {
      const longName = 'A'.repeat(100);
      const data: PrizePresetData = { items: 'item' };
      const saved = savePreset<PrizePresetData>('prize', longName, data);
      expect(saved).not.toBeNull();

      expect(saved!.name).toHaveLength(MAX_PRESET_NAME_LENGTH);
      expect(saved!.name).toBe('A'.repeat(MAX_PRESET_NAME_LENGTH));
    });

    it('does not truncate names within the limit', () => {
      const data: PrizePresetData = { items: 'item' };
      const saved = savePreset<PrizePresetData>('prize', 'Short Name', data);
      expect(saved).not.toBeNull();

      expect(saved!.name).toBe('Short Name');
    });
  });

  // ─── savePreset - returns null on write failure (M-2) ──────

  describe('savePreset - write failure', () => {
    it('returns null when localStorage write fails', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      const data: PrizePresetData = { items: 'item' };
      const saved = savePreset<PrizePresetData>('prize', 'Test', data);

      expect(saved).toBeNull();
    });
  });

  // ─── Constants ───────────────────────────────────────────────

  describe('Constants', () => {
    it('MAX_PRESETS_PER_GAME is 5', () => {
      expect(MAX_PRESETS_PER_GAME).toBe(5);
    });

    it('MAX_PRESET_NAME_LENGTH is 30', () => {
      expect(MAX_PRESET_NAME_LENGTH).toBe(30);
    });

    it('STORAGE_KEY_PREFIX is correct', () => {
      expect(STORAGE_KEY_PREFIX).toBe('lucky-pick-presets-');
    });

    it('MAX_PRESET_DATA_SIZE is 50000', () => {
      expect(MAX_PRESET_DATA_SIZE).toBe(50000);
    });
  });

  // ─── H-1: Name sanitization ──────────────────────────────────

  describe('savePreset - name sanitization (H-1)', () => {
    it('removes < > " \' & characters from preset name', () => {
      const data: PrizePresetData = { items: 'item' };
      const saved = savePreset<PrizePresetData>('prize', 'Test<script>"name\'&', data);

      expect(saved).not.toBeNull();
      expect(saved!.name).not.toContain('<');
      expect(saved!.name).not.toContain('>');
      expect(saved!.name).not.toContain('"');
      expect(saved!.name).not.toContain("'");
      expect(saved!.name).not.toContain('&');
      expect(saved!.name).toBe('Testscriptname');
    });

    it('preserves normal characters after sanitization', () => {
      const data: PrizePresetData = { items: 'item' };
      const saved = savePreset<PrizePresetData>('prize', 'Normal Name 123', data);

      expect(saved).not.toBeNull();
      expect(saved!.name).toBe('Normal Name 123');
    });

    it('sanitizes before truncation', () => {
      // Name with special chars making it long; after sanitizing + truncating
      const nameWithSpecials = '<>'.repeat(20) + 'A'.repeat(MAX_PRESET_NAME_LENGTH);
      const data: PrizePresetData = { items: 'item' };
      const saved = savePreset<PrizePresetData>('prize', nameWithSpecials, data);

      expect(saved).not.toBeNull();
      expect(saved!.name).toHaveLength(MAX_PRESET_NAME_LENGTH);
      expect(saved!.name).not.toContain('<');
      expect(saved!.name).not.toContain('>');
    });
  });

  // ─── H-2: Game-specific data validation ──────────────────────

  describe('getPresets - game-specific data validation (H-2)', () => {
    it('filters out prize presets with non-string items', () => {
      const items = [
        { id: 'a', name: 'Valid', gameType: 'prize', data: { items: 'Gold\nSilver' }, createdAt: 1000 },
        { id: 'b', name: 'Invalid', gameType: 'prize', data: { items: 123 }, createdAt: 1001 },
        { id: 'c', name: 'Missing', gameType: 'prize', data: {}, createdAt: 1002 },
      ];
      localStorage.setItem(`${STORAGE_KEY_PREFIX}prize`, JSON.stringify(items));

      const result = getPresets<PrizePresetData>('prize');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a');
    });

    it('filters out name presets with invalid structure', () => {
      const items = [
        { id: 'a', name: 'Valid', gameType: 'name', data: { names: 'Alice\nBob', pickCount: 1, removeAfterPick: false }, createdAt: 1000 },
        { id: 'b', name: 'BadPick', gameType: 'name', data: { names: 'Alice', pickCount: 'one', removeAfterPick: false }, createdAt: 1001 },
        { id: 'c', name: 'NoNames', gameType: 'name', data: { pickCount: 1, removeAfterPick: true }, createdAt: 1002 },
      ];
      localStorage.setItem(`${STORAGE_KEY_PREFIX}name`, JSON.stringify(items));

      const result = getPresets<NamePresetData>('name');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a');
    });

    it('filters out number presets with invalid structure', () => {
      const items = [
        { id: 'a', name: 'Valid', gameType: 'number', data: { minValue: 1, maxValue: 100, pickCount: 3, allowDuplicates: false, sortResults: true }, createdAt: 1000 },
        { id: 'b', name: 'BadMin', gameType: 'number', data: { minValue: 'one', maxValue: 100, pickCount: 3, allowDuplicates: false, sortResults: true }, createdAt: 1001 },
        { id: 'c', name: 'MissingSort', gameType: 'number', data: { minValue: 1, maxValue: 100, pickCount: 3, allowDuplicates: false }, createdAt: 1002 },
      ];
      localStorage.setItem(`${STORAGE_KEY_PREFIX}number`, JSON.stringify(items));

      const result = getPresets<NumberPresetData>('number');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a');
    });

    it('filters out ladder presets with invalid structure', () => {
      const items = [
        { id: 'a', name: 'Valid', gameType: 'ladder', data: { participantCount: 3, participantNames: ['A', 'B', 'C'], resultNames: ['1', '2', '3'] }, createdAt: 1000 },
        { id: 'b', name: 'BadCount', gameType: 'ladder', data: { participantCount: 'three', participantNames: ['A'], resultNames: ['1'] }, createdAt: 1001 },
        { id: 'c', name: 'NotArray', gameType: 'ladder', data: { participantCount: 2, participantNames: 'A,B', resultNames: ['1'] }, createdAt: 1002 },
      ];
      localStorage.setItem(`${STORAGE_KEY_PREFIX}ladder`, JSON.stringify(items));

      const result = getPresets<LadderPresetData>('ladder');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a');
    });
  });

  // ─── M-1: crypto.randomUUID ──────────────────────────────────

  describe('savePreset - ID generation (M-1)', () => {
    it('generates valid string IDs', () => {
      const data: PrizePresetData = { items: 'item' };
      const saved = savePreset<PrizePresetData>('prize', 'Test', data);

      expect(saved).not.toBeNull();
      expect(saved!.id).toBeTruthy();
      expect(typeof saved!.id).toBe('string');
      expect(saved!.id.length).toBeGreaterThan(0);
    });

    it('uses crypto.randomUUID when available', () => {
      const mockUUID = '550e8400-e29b-41d4-a716-446655440000';
      const randomUUIDSpy = vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(mockUUID as `${string}-${string}-${string}-${string}-${string}`);

      const data: PrizePresetData = { items: 'item' };
      const saved = savePreset<PrizePresetData>('prize', 'Test', data);

      expect(saved).not.toBeNull();
      expect(saved!.id).toBe(mockUUID);

      randomUUIDSpy.mockRestore();
    });

    it('falls back when crypto.randomUUID is not available', () => {
      const randomUUIDSpy = vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(() => {
        throw new Error('not supported');
      });

      const data: PrizePresetData = { items: 'item' };
      const saved = savePreset<PrizePresetData>('prize', 'Test', data);

      expect(saved).not.toBeNull();
      expect(saved!.id).toBeTruthy();
      expect(typeof saved!.id).toBe('string');
      // Should not be a UUID format since fallback was used
      expect(saved!.id).not.toContain('-');

      randomUUIDSpy.mockRestore();
    });
  });

  // ─── M-2: deletePreset returns boolean ────────────────────────

  describe('deletePreset - returns boolean (M-2)', () => {
    it('returns true when preset is successfully deleted', () => {
      const data: PrizePresetData = { items: 'item' };
      const saved = savePreset<PrizePresetData>('prize', 'ToDelete', data);
      expect(saved).not.toBeNull();

      const result = deletePreset('prize', saved!.id);
      expect(result).toBe(true);
    });

    it('returns false when preset ID does not exist', () => {
      const data: PrizePresetData = { items: 'item' };
      savePreset<PrizePresetData>('prize', 'Existing', data);

      const result = deletePreset('prize', 'non-existent-id');
      expect(result).toBe(false);
    });

    it('returns false when no presets exist for the game type', () => {
      const result = deletePreset('ladder', 'some-id');
      expect(result).toBe(false);
    });

    it('returns false when localStorage write fails during delete', () => {
      const data: PrizePresetData = { items: 'item' };
      const saved = savePreset<PrizePresetData>('prize', 'Test', data);
      expect(saved).not.toBeNull();

      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      const result = deletePreset('prize', saved!.id);
      expect(result).toBe(false);
    });
  });

  // ─── L-1: Data size limit ────────────────────────────────────

  describe('savePreset - data size limit (L-1)', () => {
    it('returns null when data exceeds MAX_PRESET_DATA_SIZE', () => {
      const hugeItems = 'x'.repeat(MAX_PRESET_DATA_SIZE + 1);
      const data: PrizePresetData = { items: hugeItems };

      const saved = savePreset<PrizePresetData>('prize', 'Huge', data);
      expect(saved).toBeNull();
    });

    it('allows data within MAX_PRESET_DATA_SIZE', () => {
      const normalItems = 'x'.repeat(100);
      const data: PrizePresetData = { items: normalItems };

      const saved = savePreset<PrizePresetData>('prize', 'Normal', data);
      expect(saved).not.toBeNull();
      expect(saved!.name).toBe('Normal');
    });
  });

  // ─── L-2: Name trim + empty check ────────────────────────────

  describe('savePreset - name trim (L-2)', () => {
    it('trims whitespace from preset name', () => {
      const data: PrizePresetData = { items: 'item' };
      const saved = savePreset<PrizePresetData>('prize', '  My Preset  ', data);

      expect(saved).not.toBeNull();
      expect(saved!.name).toBe('My Preset');
    });

    it('returns null when name is empty after trim', () => {
      const data: PrizePresetData = { items: 'item' };
      const saved = savePreset<PrizePresetData>('prize', '   ', data);

      expect(saved).toBeNull();
    });

    it('returns null when name is empty after sanitization and trim', () => {
      const data: PrizePresetData = { items: 'item' };
      const saved = savePreset<PrizePresetData>('prize', ' <>"\'& ', data);

      expect(saved).toBeNull();
    });
  });

  // ─── L-4/L-5: Non-null assertion safety ──────────────────────

  describe('savePreset - non-null assertion safety (L-4/L-5)', () => {
    it('returns non-null result for valid save operation', () => {
      const data: PrizePresetData = { items: 'Gold\nSilver' };
      const saved = savePreset<PrizePresetData>('prize', 'Test', data);

      expect(saved).not.toBeNull();
      expect(saved!.id).toBeTruthy();
      expect(saved!.name).toBe('Test');
      expect(saved!.gameType).toBe('prize');
      expect(saved!.data).toEqual(data);
    });
  });
});
