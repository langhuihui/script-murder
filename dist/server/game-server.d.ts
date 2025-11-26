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
    private handleCreateRoom;
    private handleJoinRoom;
    private handleGameStart;
    private handlePhaseUpdate;
    private handleClueFound;
    private handleChatMessage;
    private handlePlayerLeave;
    private broadcastToRoom;
    private send;
    private sendError;
    private generateRoomId;
}
