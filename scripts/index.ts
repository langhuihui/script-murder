import { estherScript } from './esther-story';
import { achanScript } from './achan-story';
import type { GameScript } from '../src/types/script';

export const scripts: GameScript[] = [
  estherScript,
  achanScript
];

export const scriptMap: Map<string, GameScript> = new Map(
  scripts.map(script => [script.id, script])
);

export function getScript(id: string): GameScript | undefined {
  return scriptMap.get(id);
}

export function getAllScripts(): GameScript[] {
  return scripts;
}

export function getScriptSummaries() {
  return scripts.map(script => ({
    id: script.id,
    title: script.title,
    description: script.description,
    maxPlayers: script.maxPlayers,
    minPlayers: script.minPlayers,
    estimatedTime: script.estimatedTime,
    difficulty: script.difficulty,
    theme: script.theme // 包含主题信息
  }));
}

