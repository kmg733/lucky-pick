import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePreset } from '@/hooks/usePreset';
import { savePreset as storageSavePreset } from '@/lib/presetStorage';
import type { NumberPresetData, PrizePresetData } from '@/types/preset';

describe('usePreset', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ─── Initial Rendering ──────────────────────────────────────

  describe('initial rendering', () => {
    it('returns empty presets list when no presets exist', () => {
      const { result } = renderHook(() => usePreset<NumberPresetData>('number'));

      expect(result.current.presets).toEqual([]);
    });

    it('loads existing presets from localStorage on mount', () => {
      const data: NumberPresetData = {
        minValue: 1,
        maxValue: 50,
        pickCount: 5,
        allowDuplicates: false,
        sortResults: true,
      };
      storageSavePreset<NumberPresetData>('number', 'Existing Preset', data);

      const { result } = renderHook(() => usePreset<NumberPresetData>('number'));

      expect(result.current.presets).toHaveLength(1);
      expect(result.current.presets[0].name).toBe('Existing Preset');
      expect(result.current.presets[0].data).toEqual(data);
    });
  });

  // ─── savePreset ─────────────────────────────────────────────

  describe('savePreset', () => {
    it('adds a preset to the list when savePreset is called', () => {
      const { result } = renderHook(() => usePreset<NumberPresetData>('number'));

      const data: NumberPresetData = {
        minValue: 1,
        maxValue: 100,
        pickCount: 3,
        allowDuplicates: false,
        sortResults: true,
      };

      act(() => {
        result.current.savePreset('My Number Preset', data);
      });

      expect(result.current.presets).toHaveLength(1);
      expect(result.current.presets[0].name).toBe('My Number Preset');
      expect(result.current.presets[0].gameType).toBe('number');
      expect(result.current.presets[0].data).toEqual(data);
    });

    it('persists saved preset to localStorage', () => {
      const { result } = renderHook(() => usePreset<PrizePresetData>('prize'));

      const data: PrizePresetData = { items: 'Gold\nSilver' };

      act(() => {
        result.current.savePreset('Prize Set', data);
      });

      // Verify by reading directly from localStorage
      const raw = localStorage.getItem('lucky-pick-presets-prize');
      expect(raw).toBeTruthy();

      const parsed = JSON.parse(raw!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Prize Set');
    });
  });

  // ─── loadPreset ─────────────────────────────────────────────

  describe('loadPreset', () => {
    it('returns preset data when given a valid ID', () => {
      const { result } = renderHook(() => usePreset<NumberPresetData>('number'));

      const data: NumberPresetData = {
        minValue: 10,
        maxValue: 99,
        pickCount: 2,
        allowDuplicates: true,
        sortResults: false,
      };

      act(() => {
        result.current.savePreset('Loadable Preset', data);
      });

      const savedId = result.current.presets[0].id;
      const loaded = result.current.loadPreset(savedId);

      expect(loaded).toEqual(data);
    });

    it('returns null when given a non-existent ID', () => {
      const { result } = renderHook(() => usePreset<NumberPresetData>('number'));

      const loaded = result.current.loadPreset('non-existent-id');

      expect(loaded).toBeNull();
    });
  });

  // ─── deletePreset ───────────────────────────────────────────

  describe('deletePreset', () => {
    it('removes a preset from the list when deletePreset is called', () => {
      const { result } = renderHook(() => usePreset<PrizePresetData>('prize'));

      const data: PrizePresetData = { items: 'item1\nitem2' };

      act(() => {
        result.current.savePreset('To Delete', data);
      });

      expect(result.current.presets).toHaveLength(1);

      const presetId = result.current.presets[0].id;

      act(() => {
        result.current.deletePreset(presetId);
      });

      expect(result.current.presets).toHaveLength(0);
    });

    it('only removes the specified preset, keeping others intact', () => {
      const { result } = renderHook(() => usePreset<PrizePresetData>('prize'));

      const data: PrizePresetData = { items: 'item' };

      act(() => {
        result.current.savePreset('Keep This', data);
      });

      act(() => {
        result.current.savePreset('Delete This', data);
      });

      expect(result.current.presets).toHaveLength(2);

      const toDeleteId = result.current.presets.find(
        (p) => p.name === 'Delete This'
      )!.id;

      act(() => {
        result.current.deletePreset(toDeleteId);
      });

      expect(result.current.presets).toHaveLength(1);
      expect(result.current.presets[0].name).toBe('Keep This');
    });

    it('persists deletion to localStorage', () => {
      const { result } = renderHook(() => usePreset<PrizePresetData>('prize'));

      const data: PrizePresetData = { items: 'item' };

      act(() => {
        result.current.savePreset('Will Be Deleted', data);
      });

      const presetId = result.current.presets[0].id;

      act(() => {
        result.current.deletePreset(presetId);
      });

      const raw = localStorage.getItem('lucky-pick-presets-prize');
      const parsed = JSON.parse(raw!);
      expect(parsed).toHaveLength(0);
    });

    it('returns true when successfully deleting an existing preset (M-2)', () => {
      const { result } = renderHook(() => usePreset<PrizePresetData>('prize'));

      const data: PrizePresetData = { items: 'item' };

      act(() => {
        result.current.savePreset('Delete Me', data);
      });

      const presetId = result.current.presets[0].id;
      let deleteResult: boolean = false;

      act(() => {
        deleteResult = result.current.deletePreset(presetId);
      });

      expect(deleteResult).toBe(true);
    });

    it('returns false when deleting a non-existent preset (M-2)', () => {
      const { result } = renderHook(() => usePreset<PrizePresetData>('prize'));

      let deleteResult: boolean = true;

      act(() => {
        deleteResult = result.current.deletePreset('non-existent-id');
      });

      expect(deleteResult).toBe(false);
    });
  });

  // ─── Game Type Isolation ────────────────────────────────────

  describe('game type isolation', () => {
    it('manages presets independently per game type', () => {
      const { result: numberHook } = renderHook(() =>
        usePreset<NumberPresetData>('number')
      );
      const { result: prizeHook } = renderHook(() =>
        usePreset<PrizePresetData>('prize')
      );

      const numberData: NumberPresetData = {
        minValue: 1,
        maxValue: 100,
        pickCount: 1,
        allowDuplicates: false,
        sortResults: false,
      };

      const prizeData: PrizePresetData = { items: 'Gold\nSilver' };

      act(() => {
        numberHook.current.savePreset('Number Preset', numberData);
      });

      act(() => {
        prizeHook.current.savePreset('Prize Preset', prizeData);
      });

      expect(numberHook.current.presets).toHaveLength(1);
      expect(numberHook.current.presets[0].name).toBe('Number Preset');
      expect(numberHook.current.presets[0].gameType).toBe('number');

      expect(prizeHook.current.presets).toHaveLength(1);
      expect(prizeHook.current.presets[0].name).toBe('Prize Preset');
      expect(prizeHook.current.presets[0].gameType).toBe('prize');
    });
  });
});
