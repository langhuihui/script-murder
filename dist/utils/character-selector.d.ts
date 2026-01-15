import type { Character, GameScript } from '../types/script';
/**
 * 根据玩家人数获取可用角色列表
 */
export declare function getCharactersForPlayerCount(script: GameScript, playerCount: number): Character[];
/**
 * 随机分配角色给玩家
 * @param characters 可用角色列表
 * @param playerIds 玩家ID列表
 * @returns 玩家ID到角色的映射
 */
export declare function assignCharactersToPlayers(characters: Character[], playerIds: string[]): Map<string, Character>;
/**
 * 获取角色的显示名称（用于隐藏真实身份）
 * 在游戏中，玩家看到的是 displayName，而不是原始 name
 */
export declare function getCharacterDisplayInfo(character: Character): {
    displayName: string;
    displayTitle: string;
};
/**
 * 验证投票结果是否正确
 * @param script 剧本
 * @param votedCharacterId 被投票选中的角色ID
 * @returns 是否为真凶
 */
export declare function verifyVoteResult(script: GameScript, votedCharacterId: string): boolean;
/**
 * 获取剧本支持的玩家人数范围
 */
export declare function getPlayerCountRange(script: GameScript): {
    min: number;
    max: number;
    recommended: number;
};
