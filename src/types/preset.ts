import type { GameType } from './index';

/** Prize game preset data - items stored as newline-separated text */
export interface PrizePresetData {
  items: string;
}

/** Name picker preset data */
export interface NamePresetData {
  names: string;
  pickCount: number;
  removeAfterPick: boolean;
}

/** Number picker preset data */
export interface NumberPresetData {
  minValue: number;
  maxValue: number;
  pickCount: number;
  allowDuplicates: boolean;
  sortResults: boolean;
}

/** Ladder game preset data */
export interface LadderPresetData {
  participantCount: number;
  participantNames: string[];
  resultNames: string[];
}

/** Union of all preset data types */
export type PresetData =
  | PrizePresetData
  | NamePresetData
  | NumberPresetData
  | LadderPresetData;

/** A saved preset with metadata */
export interface Preset<T extends PresetData = PresetData> {
  id: string;
  name: string;
  gameType: GameType;
  data: T;
  createdAt: number;
}
