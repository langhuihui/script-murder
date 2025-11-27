import EventEmitter from 'eventemitter3';
import { NetworkClient } from '../core/network';
import { Room, Player } from '../types';
export interface CreateRoomResult {
    roomId: string;
    room: Room;
    player: Player;
}
export interface JoinRoomResult {
    room: Room;
    player: Player;
}
export declare class RoomManager extends EventEmitter {
    private network;
    currentRoom: Room | null;
    currentPlayer: Player | null;
    constructor(network: NetworkClient);
    private setupNetworkListeners;
    createRoom(scriptId: string, maxPlayers: number, playerName?: string): Promise<CreateRoomResult>;
    joinRoom(roomId: string, playerName: string): Promise<JoinRoomResult>;
    leaveRoom(): void;
    setReady(ready: boolean): Promise<{
        success: boolean;
        isReady: boolean;
    }>;
    sendMessage(message: string): Promise<{
        success: boolean;
    }>;
}
