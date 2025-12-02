// 游戏阶段枚举（内置默认阶段）
export enum GamePhase {
  IDLE = 'IDLE',             // 等待开始
  READING = 'READING',       // 阅读剧本
  SEARCH = 'SEARCH',         // 搜证环节
  DISCUSSION = 'DISCUSSION', // 集中讨论
  VOTE = 'VOTE',             // 投票环节
  REVEAL = 'REVEAL'          // 复盘/结案
}

// 游戏阶段类型：可以是内置 GamePhase，也可以是任意自定义字符串
export type AnyGamePhase = GamePhase | (string & {});

// 玩家信息接口
export interface Player {
  id: string;
  name: string;
  isHost: boolean;       // 是否是房主
  characterId?: string;  // 扮演的角色ID
  status: 'online' | 'offline';
  isReady?: boolean;     // 是否已准备
  joinedAt?: number;     // 加入时间（服务器端使用）
}

// 房间信息接口
export interface Room {
  id: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  scriptId: string;      // 剧本ID
}

// 游戏状态接口 (用于同步)
export interface GameState {
  phase: AnyGamePhase;
  round: number;
  cluesFound: string[];         // 已发现的线索ID列表
  votes: Record<string, string>; // 投票记录: { voterId: targetId }
}

// SDK 初始化配置
export interface ClientConfig {
  serverUrl: string;
  debug?: boolean;
  /**
   * 自定义游戏阶段列表（按流程顺序）
   * 不传则使用内置的 GamePhase 顺序
   */
  gamePhases?: AnyGamePhase[];
}