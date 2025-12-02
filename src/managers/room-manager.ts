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

export class RoomManager extends EventEmitter {
  private network: NetworkClient;
  public currentRoom: Room | null = null;
  public currentPlayer: Player | null = null;

  constructor(network: NetworkClient) {
    super();
    this.network = network;
    this.setupNetworkListeners();
  }

  private setupNetworkListeners(): void {
    // Listen for player joined events from server
    this.network.on('room:playerJoined', (data: { player: Player }) => {
      console.log('[RoomManager] Player joined:', data.player);
      if (this.currentRoom && data.player) {
        // Add player to current room if not already present
        const exists = this.currentRoom.players.some(p => p.id === data.player.id);
        if (!exists) {
          this.currentRoom.players.push(data.player);
        }
        this.emit('playerJoined', data.player);
        this.emit('roomUpdated', this.currentRoom);
      }
    });

    // Listen for player left events from server
    this.network.on('room:playerLeft', (data: { playerId: string }) => {
      console.log('[RoomManager] Player left:', data.playerId);
      if (this.currentRoom) {
        this.currentRoom.players = this.currentRoom.players.filter(p => p.id !== data.playerId);
        this.emit('playerLeft', data.playerId);
        this.emit('roomUpdated', this.currentRoom);
      }
    });

    // Listen for room updates from server
    this.network.on('room:updated', (data: { room: Room }) => {
      console.log('[RoomManager] Room updated:', data.room);
      if (data.room) {
        this.currentRoom = data.room;
        this.emit('roomUpdated', this.currentRoom);
      }
    });

    // Listen for player ready status changes
    this.network.on('room:playerReady', (data: { playerId: string; playerName: string; isReady: boolean; room: Room }) => {
      console.log('[RoomManager] Player ready status changed:', data);
      if (this.currentRoom) {
        // Update local room data
        const player = this.currentRoom.players.find(p => p.id === data.playerId);
        if (player) {
          player.isReady = data.isReady;
        }
        // Also update with full room data from server
        if (data.room) {
          this.currentRoom = data.room;
        }
        this.emit('playerReady', { playerId: data.playerId, isReady: data.isReady });
        this.emit('roomUpdated', this.currentRoom);
      }
    });

    // Listen for chat messages
    this.network.on('chat:message', (data: { playerId: string; playerName: string; message: string; timestamp: number }) => {
      console.log('[RoomManager] Chat message received:', data);
      this.emit('chatMessage', data);
    });
  }

  public async createRoom(scriptId: string, maxPlayers: number, playerName?: string): Promise<CreateRoomResult> {
    const res = await this.network.send('room:create', { scriptId, maxPlayers, playerName });

    console.log('[RoomManager] createRoom response:', JSON.stringify(res, null, 2));

    // 网络层已经解析了 message.data，所以 res 就是服务器返回的 data 内容
    // 使用服务器返回的完整数据
    this.currentRoom = res.room || null;
    this.currentPlayer = res.player || null;

    if (!this.currentRoom || !this.currentPlayer) {
      throw new Error('Failed to create room: missing room or player data');
    }

    this.emit('roomCreated', { room: this.currentRoom, player: this.currentPlayer });

    const roomId = res.roomId || this.currentRoom.id;
    console.log('[RoomManager] Extracted roomId:', roomId);

    return {
      roomId: roomId,
      room: this.currentRoom,
      player: this.currentPlayer
    };
  }

  public async joinRoom(roomId: string, playerName: string): Promise<JoinRoomResult> {
    const res = await this.network.send('room:join', { roomId, playerName });

    // 网络层已经解析了 message.data，所以 res 就是服务器返回的 data 内容
    // 使用服务器返回的完整数据
    this.currentRoom = res.room || null;
    this.currentPlayer = res.player || null;

    if (!this.currentRoom || !this.currentPlayer) {
      throw new Error('Failed to join room: missing room or player data');
    }

    console.log(`Joined room ${roomId} as ${playerName}`, res);

    this.emit('roomJoined', { room: this.currentRoom, player: this.currentPlayer });

    return {
      room: this.currentRoom,
      player: this.currentPlayer
    };
  }

  public leaveRoom(): void {
    this.currentRoom = null;
    this.currentPlayer = null;
    this.emit('left');
  }

  public async setReady(ready: boolean): Promise<{ success: boolean; isReady: boolean }> {
    const res = await this.network.send('room:setReady', { ready });

    // Update local player ready status
    if (this.currentPlayer) {
      this.currentPlayer.isReady = ready;
    }

    return res;
  }

  public async sendMessage(message: string): Promise<{ success: boolean }> {
    const res = await this.network.send('chat:message', { message });
    return res;
  }
}