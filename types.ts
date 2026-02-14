
export enum AppView {
  FOREST = 'FOREST',
  CHAT = 'CHAT',
  ARCHIVE = 'ARCHIVE',
  MARKET = 'MARKET'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Wisdom {
  id: string;
  title: string; // The "Mindset" name
  situation: string; // Brief summary of the issue
  insight: string; // The core logic/philosophy extracted
  date: string;
}

export interface Tree {
  id: string;
  wisdomId: string;
  stage: 'sapling' | 'growing' | 'mature' | 'fruiting';
  plantedAt: number;
  stageStartedAt: number; // Timestamp when the current stage began
  lastWatered: number;
  type: 'oak' | 'willow' | 'pine' | 'cherry';
  hasProduced?: boolean; // Track if the current fruiting has been counted in stats
}

export interface CommunityFruit {
  id: string;
  author: string;
  insight: string;
  cost: number; // 1 fruit
}
