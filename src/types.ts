export type SceneType = 'cinematic' | 'gameplay';

export interface Dialogue {
  id: string;
  characterId: string;
  text: string;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  type: SceneType;
  dialogues: Dialogue[];
  events: GameEvent[];
  cameraSettings?: string;
  content?: string;
}

export interface Chapter {
  id: string;
  title: string;
  scenes: Scene[];
}

export interface Character {
  id: string;
  name: string;
  traits: string[];
  background: string;
  role: string;
}

export interface WorldBuildingEntry {
  id: string;
  category: string;
  title: string;
  content: string;
}

export interface StoryProject {
  id: string;
  name: string;
  description: string;
  genre: string;
  style: string;
  tense: 'past' | 'present' | 'future';
  chapters: Chapter[];
  characters: Character[];
  worldBuilding: WorldBuildingEntry[];
  outline: string;
  lastModified: number;
}
