import { ClientConfig } from '../types';
import { NetworkClient } from './network';
import { RoomManager } from '../managers/room-manager';
import { GameManager } from '../managers/game-manager';
export declare class JubenshaClient {
    network: NetworkClient;
    room: RoomManager;
    game: GameManager;
    constructor(config: ClientConfig);
    connect(): Promise<void>;
    disconnect(): void;
}
