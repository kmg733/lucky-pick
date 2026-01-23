export type GameType = 'prize' | 'name' | 'number' | 'ladder';

export interface PrizeItem {
  id: string;
  name: string;
  count: number;
}

export interface NameItem {
  id: string;
  name: string;
}

export interface NumberRange {
  min: number;
  max: number;
}

export interface LadderParticipant {
  id: string;
  name: string;
}

export interface LadderResult {
  id: string;
  name: string;
}

export interface GameCardInfo {
  type: GameType;
  title: string;
  description: string;
  icon: string;
  href: string;
}
