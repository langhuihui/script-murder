import EventEmitter from 'eventemitter3';
import { NetworkClient } from '../core/network';
import { Room, Player } from '../types';

export class RoomManager extends EventEmitter {
  private network: NetworkClient;
  public currentRoom: Room | null = null;

  constructor(network: NetworkClient) {
    super();
    this.network = network;
  }

  public async createRoom(scriptId: string, maxPlayers: number): Promise<string> {
    const res = await this.network.send('room:create', { scriptId, maxPlayers });
    // 模拟本地立即更新状态
    this.currentRoom = {
      id: res.roomId,
      hostId: 'LOCAL_USER', // 简化处理
      players: [],
      maxPlayers,
      scriptId
    };
    return res.roomId;
  }

  public async joinRoom(roomId: string, playerName: string): Promise<void> {
    await this.network.send('room:join', { roomId, playerName });
    // 模拟加入成功
    console.log(`Joined room ${roomId} as ${playerName}`);
  }

  public leaveRoom(): void {
    this.currentRoom = null;
    this.emit('left');
  }
}