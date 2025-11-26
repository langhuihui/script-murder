export declare enum GamePhase {
    IDLE = "IDLE",// 等待开始
    READING = "READING",// 阅读剧本
    SEARCH = "SEARCH",// 搜证环节
    DISCUSSION = "DISCUSSION",// 集中讨论
    VOTE = "VOTE",// 投票环节
    REVEAL = "REVEAL"
}
export type AnyGamePhase = GamePhase | (string & {});
export interface Player {
    id: string;
    name: string;
    isHost: boolean;
    characterId?: string;
    status: 'online' | 'offline';
}
export interface Room {
    id: string;
    hostId: string;
    players: Player[];
    maxPlayers: number;
    scriptId: string;
}
export interface GameState {
    phase: AnyGamePhase;
    round: number;
    cluesFound: string[];
    votes: Record<string, string>;
}
export interface ClientConfig {
    serverUrl: string;
    debug?: boolean;
    /**
     * 自定义游戏阶段列表（按流程顺序）
     * 不传则使用内置的 GamePhase 顺序
     */
    gamePhases?: AnyGamePhase[];
}
