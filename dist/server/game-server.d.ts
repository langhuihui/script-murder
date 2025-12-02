import { Server } from 'http';
export interface GameServerOptions {
    server?: Server;
    port?: number;
    path?: string;
}
export declare class JubenshaServer {
    private wss;
    private rooms;
    private players;
    constructor(options: GameServerOptions);
    private setup;
    private handleMessage;
    /**
     * 加载脚本模块
     */
    private loadScriptModule;
    private handleScriptList;
    private handleScriptGet;
    /**
     * 创建玩家对象
     */
    private createPlayer;
    /**
     * 将玩家添加到房间
     */
    private addPlayerToRoom;
    private handleCreateRoom;
    private handleJoinRoom;
    private handleGameStart;
    /**
     * 为玩家分配角色
     */
    private assignCharacters;
    private handlePhaseUpdate;
    private handleClueFound;
    private handleSetReady;
    private handleChatMessage;
    private handlePlayerLeave;
    private broadcastToRoom;
    private send;
    /**
     * 发送响应消息（支持请求-响应模式或事件模式）
     */
    private sendResponse;
    private sendError;
    private generateRoomId;
}
