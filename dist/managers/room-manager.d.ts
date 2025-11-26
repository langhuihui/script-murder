import EventEmitter from 'eventemitter3';
import { NetworkClient } from '../core/network';
import { Room } from '../types';
export declare class RoomManager extends EventEmitter {
    private network;
    currentRoom: Room | null;
    constructor(network: NetworkClient);
    createRoom(scriptId: string, maxPlayers: number): Promise<string>;
    joinRoom(roomId: string, playerName: string): Promise<void>;
    leaveRoom(): void;
}
