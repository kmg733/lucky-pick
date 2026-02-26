import { useState, useEffect, useCallback } from 'react';
import type { GameType } from '@/types/index';
import type { Preset, PresetData } from '@/types/preset';
import {
  getPresets,
  savePreset as storageSavePreset,
  deletePreset as storageDeletePreset,
} from '@/lib/presetStorage';

interface UsePresetReturn<T extends PresetData> {
  presets: Preset<T>[];
  savePreset: (name: string, data: T) => void;
  loadPreset: (id: string) => T | null;
  deletePreset: (id: string) => void;
}

export function usePreset<T extends PresetData>(
  gameType: GameType
): UsePresetReturn<T> {
  const [presets, setPresets] = useState<Preset<T>[]>(() =>
    getPresets<T>(gameType)
  );

  useEffect(() => {
    setPresets(getPresets<T>(gameType));
  }, [gameType]);

  const savePreset = useCallback(
    (name: string, data: T) => {
      storageSavePreset<T>(gameType, name, data);
      setPresets(getPresets<T>(gameType));
    },
    [gameType]
  );

  const loadPreset = useCallback(
    (id: string): T | null => {
      const found = presets.find((p) => p.id === id);
      return found ? found.data : null;
    },
    [presets]
  );

  const deletePreset = useCallback(
    (id: string) => {
      storageDeletePreset(gameType, id);
      setPresets(getPresets<T>(gameType));
    },
    [gameType]
  );

  return { presets, savePreset, loadPreset, deletePreset };
}
