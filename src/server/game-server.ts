import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export interface GameServerOptions {
  server?: Server;
  port?: number;
  path?: string;
}

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  status: string;
  joinedAt: number;
  roomId?: string;
  [key: string]: any;
}

interface Room {
  id: string;
  hostId: string;
  scriptId: string;
  maxPlayers: number;
  players: Player[];
  status: 'waiting' | 'playing' | 'ended';
  createdAt: number;
  gameStartedAt?: number;
  [key: string]: any;
}

interface ExtendedWebSocket extends WebSocket {
  roomId?: string;
  playerId?: string;
  isAlive?: boolean;
}

export class JubenshaServer {
  private wss: WebSocketServer;
  private rooms: Map<string, Room> = new Map();
  private players: Map<string, Player> = new Map();

  constructor(options: GameServerOptions) {
    this.wss = new WebSocketServer({
      server: options.server,
      port: options.port,
      path: options.path || '/ws'
    });

    this.setup();
  }

  private setup() {
    this.wss.on('connection', (ws: ExtendedWebSocket) => {
      console.log('New WebSocket connection established');

      ws.isAlive = true;
      ws.on('pong', () => { ws.isAlive = true; });

      ws.on('message', (message: any) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Message parse error:', error);
        }
      });

      ws.on('close', () => {
        this.handlePlayerLeave(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handlePlayerLeave(ws);
      });

      // Send connection success message
      this.send(ws, {
        type: 'connected',
        data: { message: 'Connected successfully', timestamp: Date.now() }
      });
    });

    // Heartbeat interval
    setInterval(() => {
      this.wss.clients.forEach((ws: WebSocket) => {
        const extWs = ws as ExtendedWebSocket;
        if (extWs.isAlive === false) return extWs.terminate();
        extWs.isAlive = false;
        extWs.ping();
      });
    }, 30000);
  }

  private handleMessage(ws: ExtendedWebSocket, data: any) {
    const handlers: Record<string, (ws: ExtendedWebSocket, data: any) => void> = {
      'room:create': this.handleCreateRoom.bind(this),
      'room:join': this.handleJoinRoom.bind(this),
      'room:leave': this.handlePlayerLeave.bind(this),
      'game:start': this.handleGameStart.bind(this),
      'game:phaseUpdate': this.handlePhaseUpdate.bind(this),
      'game:clueFound': this.handleClueFound.bind(this),
      'chat:message': this.handleChatMessage.bind(this)
    };

    const handler = handlers[data.type];
    if (handler) {
      handler(ws, data.data || data); // Support both wrapped and unwrapped data
    } else {
      console.warn('Unknown message type:', data.type);
    }
  }

  private handleCreateRoom(ws: ExtendedWebSocket, data: any) {
    const roomId = this.generateRoomId();
    const room: Room = {
      id: roomId,
      hostId: data.playerId,
      scriptId: data.scriptId,
      maxPlayers: data.maxPlayers,
      players: [],
      status: 'waiting',
      createdAt: Date.now()
    };

    this.rooms.set(roomId, room);

    const player: Player = {
      id: data.playerId,
      name: data.playerName,
      isHost: true,
      status: 'online',
      joinedAt: Date.now()
    };

    room.players.push(player);
    this.players.set(data.playerId, { ...player, roomId });

    ws.roomId = roomId;
    ws.playerId = data.playerId;

    console.log(`Room created: ${roomId}, Host: ${data.playerName}`);

    this.send(ws, {
      type: 'room:created',
      data: { roomId, room }
    });

    this.broadcastToRoom(roomId, {
      type: 'room:playerJoined',
      data: { player }
    }, ws);
  }

  private handleJoinRoom(ws: ExtendedWebSocket, data: any) {
    const { roomId, playerName, playerId } = data;
    const room = this.rooms.get(roomId);

    if (!room) {
      return this.sendError(ws, 'Room not found');
    }

    if (room.players.length >= room.maxPlayers) {
      return this.sendError(ws, 'Room is full');
    }

    if (room.status !== 'waiting') {
      return this.sendError(ws, 'Game already started');
    }

    const player: Player = {
      id: playerId,
      name: playerName,
      isHost: false,
      status: 'online',
      joinedAt: Date.now()
    };

    room.players.push(player);
    this.players.set(playerId, { ...player, roomId });

    ws.roomId = roomId;
    ws.playerId = playerId;

    console.log(`Player joined: ${playerName} -> ${roomId}`);

    this.send(ws, {
      type: 'room:joined',
      data: { room, player }
    });

    this.broadcastToRoom(roomId, {
      type: 'room:playerJoined',
      data: { player }
    }, ws);
  }

  private handleGameStart(ws: ExtendedWebSocket, _data: any) {
    const { roomId } = ws;
    if (!roomId) return;
    
    const room = this.rooms.get(roomId);
    if (!room) return this.sendError(ws, 'Room not found');

    if (room.hostId !== ws.playerId) {
      return this.sendError(ws, 'Only host can start the game');
    }

    room.status = 'playing';
    room.gameStartedAt = Date.now();

    console.log(`Game started: ${roomId}`);

    this.broadcastToRoom(roomId, {
      type: 'game:started',
      data: { room }
    });
  }

  private handlePhaseUpdate(ws: ExtendedWebSocket, data: any) {
    const { roomId } = ws;
    if (!roomId) return;

    console.log(`Phase update: ${roomId} -> ${data.phase}`);

    this.broadcastToRoom(roomId, {
      type: 'game:phaseChanged',
      data: { phase: data.phase, playerId: ws.playerId }
    });
  }

  private handleClueFound(ws: ExtendedWebSocket, data: any) {
    const { roomId } = ws;
    if (!roomId) return;

    console.log(`Clue found: ${roomId} -> ${data.clueId}`);

    this.broadcastToRoom(roomId, {
      type: 'game:clueDiscovered',
      data: { clueId: data.clueId, playerId: ws.playerId }
    });
  }

  private handleChatMessage(ws: ExtendedWebSocket, data: any) {
    const { roomId } = ws;
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === ws.playerId);
    if (!player) return;

    this.broadcastToRoom(roomId, {
      type: 'chat:message',
      data: {
        playerId: ws.playerId,
        playerName: player.name,
        message: data.message,
        timestamp: Date.now()
      }
    });
  }

  private handlePlayerLeave(ws: ExtendedWebSocket) {
    const { roomId, playerId } = ws;
    if (!roomId || !playerId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    const player = room.players[playerIndex];
    room.players.splice(playerIndex, 1);
    this.players.delete(playerId);

    console.log(`Player left: ${player.name} <- ${roomId}`);

    if (player.isHost) {
      if (room.players.length > 0) {
        room.players[0].isHost = true;
        room.hostId = room.players[0].id;
        this.broadcastToRoom(roomId, {
          type: 'room:hostChanged',
          data: { newHostId: room.players[0].id }
        });
      } else {
        this.rooms.delete(roomId);
        return;
      }
    }

    this.broadcastToRoom(roomId, {
      type: 'room:playerLeft',
      data: { playerId, playerName: player.name }
    });

    ws.roomId = undefined;
    ws.playerId = undefined;
  }

  private broadcastToRoom(roomId: string, message: any, excludeWs?: ExtendedWebSocket) {
    const messageStr = JSON.stringify(message);
    this.wss.clients.forEach((client: WebSocket) => {
      const extClient = client as ExtendedWebSocket;
      if (extClient.readyState === WebSocket.OPEN &&
          extClient.roomId === roomId &&
          extClient !== excludeWs) {
        extClient.send(messageStr);
      }
    });
  }

  private send(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, message: string) {
    this.send(ws, {
      type: 'error',
      message
    });
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
