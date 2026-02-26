import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getPresets, savePreset, deletePreset, MAX_PRESETS_PER_GAME, MAX_PRESET_NAME_LENGTH, STORAGE_KEY_PREFIX } from '@/lib/presetStorage';
import type { NumberPresetData, PrizePresetData, NamePresetData } from '@/types/preset';

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

      expect(saved.id).toBeTruthy();
      expect(saved.name).toBe('Prizes');
      expect(saved.gameType).toBe('prize');
      expect(saved.data).toEqual(data);
      expect(saved.createdAt).toBeTypeOf('number');
      expect(saved.createdAt).toBeGreaterThan(0);
    });

    it('generates unique IDs for each saved preset', () => {
      const data: PrizePresetData = { items: 'item' };

      const preset1 = savePreset<PrizePresetData>('prize', 'P1', data);
      const preset2 = savePreset<PrizePresetData>('prize', 'P2', data);

      expect(preset1.id).not.toBe(preset2.id);
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

      deletePreset('prize', saved.id);

      const result = getPresets<PrizePresetData>('prize');
      expect(result).toHaveLength(0);
    });

    it('only deletes the specified preset, keeping others intact', () => {
      const data: PrizePresetData = { items: 'item' };
      const preset1 = savePreset<PrizePresetData>('prize', 'Keep', data);
      const preset2 = savePreset<PrizePresetData>('prize', 'Delete', data);

      deletePreset('prize', preset2.id);

      const result = getPresets<PrizePresetData>('prize');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(preset1.id);
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

      expect(saved.name).toHaveLength(MAX_PRESET_NAME_LENGTH);
      expect(saved.name).toBe('A'.repeat(MAX_PRESET_NAME_LENGTH));
    });

    it('does not truncate names within the limit', () => {
      const data: PrizePresetData = { items: 'item' };
      const saved = savePreset<PrizePresetData>('prize', 'Short Name', data);

      expect(saved.name).toBe('Short Name');
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
  });
});
