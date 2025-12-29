import type { Character, GameScript } from '../types/script';

/**
 * 根据玩家人数获取可用角色列表
 */
export function getCharactersForPlayerCount(
  script: GameScript,
  playerCount: number
): Character[] {
  const { characters, characterConfig } = script;
  
  // 如果没有配置，返回所有角色（取前 playerCount 个）
  if (!characterConfig) {
    return characters.slice(0, playerCount);
  }
  
  const { required, optional } = characterConfig;
  
  // 获取必选角色
  const requiredCharacters = characters.filter(c => required.includes(c.id));
  
  // 获取符合人数条件的可选角色
  const availableOptional = optional
    .filter(opt => playerCount >= opt.minPlayers)
    .map(opt => characters.find(c => c.id === opt.characterId))
    .filter((c): c is Character => c !== undefined);
  
  // 合并并按优先级排序
  const allAvailable = [...requiredCharacters, ...availableOptional];
  allAvailable.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  
  // 返回前 playerCount 个角色
  return allAvailable.slice(0, playerCount);
}

/**
 * 随机分配角色给玩家
 * @param characters 可用角色列表
 * @param playerIds 玩家ID列表
 * @returns 玩家ID到角色的映射
 */
export function assignCharactersToPlayers(
  characters: Character[],
  playerIds: string[]
): Map<string, Character> {
  if (characters.length < playerIds.length) {
    throw new Error(`角色数量不足：需要 ${playerIds.length} 个，只有 ${characters.length} 个`);
  }
  
  // 随机打乱角色顺序
  const shuffled = [...characters].sort(() => Math.random() - 0.5);
  
  const assignments = new Map<string, Character>();
  playerIds.forEach((playerId, index) => {
    assignments.set(playerId, shuffled[index]);
  });
  
  return assignments;
}

/**
 * 获取角色的显示名称（用于隐藏真实身份）
 * 在游戏中，玩家看到的是 displayName，而不是原始 name
 */
export function getCharacterDisplayInfo(character: Character): {
  displayName: string;
  displayTitle: string;
} {
  // 如果角色有 displayName 字段，使用它
  // 否则使用原始 name
  return {
    displayName: (character as any).displayName ?? character.name,
    displayTitle: (character as any).displayTitle ?? character.title
  };
}

/**
 * 验证投票结果是否正确
 * @param script 剧本
 * @param votedCharacterId 被投票选中的角色ID
 * @returns 是否为真凶
 */
export function verifyVoteResult(
  script: GameScript,
  votedCharacterId: string
): boolean {
  return script.culpritId === votedCharacterId;
}

/**
 * 获取剧本支持的玩家人数范围
 */
export function getPlayerCountRange(script: GameScript): {
  min: number;
  max: number;
  recommended: number;
} {
  return {
    min: script.minPlayers,
    max: script.maxPlayers,
    // 推荐人数：如果有可选角色配置，取中间值；否则取最大值
    recommended: script.characterConfig
      ? Math.floor((script.minPlayers + script.maxPlayers) / 2)
      : script.maxPlayers
  };
}
