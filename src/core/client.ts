import { ClientConfig } from '../types';
import { NetworkClient } from './network';
import { RoomManager } from '../managers/room-manager';
import { GameManager } from '../managers/game-manager';

export class JubenshaClient {
  public network: NetworkClient;
  public room: RoomManager;
  public game: GameManager;

  constructor(config: ClientConfig) {
    this.network = new NetworkClient(config.serverUrl);
    this.room = new RoomManager(this.network);
    this.game = new GameManager(this.network, config.gamePhases);
  }

  public async connect(): Promise<void> {
    await this.network.connect();
  }

  public disconnect(): void {
    this.network.disconnect();
  }
}