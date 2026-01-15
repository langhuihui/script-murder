import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export interface ScriptModule {
  getScript: (id: string) => any;
  getScriptSummaries: () => any[];
}

export interface GameServerOptions {
  server?: Server;
  port?: number;
  path?: string;
  scripts?: ScriptModule;
}

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  status: string;
  joinedAt: number;
  roomId?: string;
  isReady?: boolean;
  characterId?: string; // 分配的角色ID
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
  private scriptsModule: ScriptModule | null = null;

  constructor(options: GameServerOptions) {
    this.wss = new WebSocketServer({
      server: options.server,
      port: options.port,
      path: options.path || '/ws'
    });

    if (options.scripts) {
      this.scriptsModule = options.scripts;
    }

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
      'script:list': this.handleScriptList.bind(this),
      'script:get': this.handleScriptGet.bind(this),
      'room:create': this.handleCreateRoom.bind(this),
      'room:join': this.handleJoinRoom.bind(this),
      'room:leave': this.handlePlayerLeave.bind(this),
      'room:setReady': this.handleSetReady.bind(this),
      'game:start': this.handleGameStart.bind(this),
      'game:phaseUpdate': this.handlePhaseUpdate.bind(this),
      'game:clueFound': this.handleClueFound.bind(this),
      'chat:message': this.handleChatMessage.bind(this)
    };

    // Support both 'type' and 'event' field for message type (client uses 'event')
    const messageType = data.type || data.event || '';
    const messageId = data.id; // For request-response pattern
    const handler = handlers[messageType];

    if (handler) {
      // Pass the message ID for response
      const messageData = data.data || data;
      messageData._requestId = messageId;
      handler(ws, messageData);
    } else {
      console.warn('Unknown message type:', messageType);
    }
  }

  /**
   * 加载脚本模块
   */
  private loadScriptModule(): ScriptModule {
    if (this.scriptsModule) {
      return this.scriptsModule;
    }
    // Fallback for development: dynamic require
    const path = require('path');
    const scriptPath = path.join(__dirname, '../../scripts/index');
    return require(scriptPath);
  }

  private handleScriptList(ws: ExtendedWebSocket, data: any) {
    const requestId = data._requestId;
    try {
      const { getScriptSummaries } = this.loadScriptModule();
      const summaries = getScriptSummaries();
      this.sendResponse(ws, { scripts: summaries }, requestId, 'script:list');
    } catch (error: any) {
      console.error('Error loading scripts:', error);
      this.sendError(ws, 'Failed to load scripts', requestId);
    }
  }

  private handleScriptGet(ws: ExtendedWebSocket, data: any) {
    const requestId = data._requestId;
    const scriptId = data.scriptId;
    
    if (!scriptId) {
      return this.sendError(ws, 'Script ID is required', requestId);
    }

    try {
      const { getScript } = this.loadScriptModule();
      const script = getScript(scriptId);
      
      if (!script) {
        return this.sendError(ws, 'Script not found', requestId);
      }

      this.sendResponse(ws, { script }, requestId, 'script:get');
    } catch (error: any) {
      console.error('Error loading script:', error);
      this.sendError(ws, 'Failed to load script', requestId);
    }
  }

  /**
   * 创建玩家对象
   */
  private createPlayer(playerId: string, playerName: string, isHost: boolean): Player {
    return {
      id: playerId,
      name: playerName,
      isHost,
      status: 'online',
      joinedAt: Date.now()
    };
  }

  /**
   * 将玩家添加到房间
   */
  private addPlayerToRoom(ws: ExtendedWebSocket, room: Room, player: Player): void {
    room.players.push(player);
    this.players.set(player.id, { ...player, roomId: room.id });
    ws.roomId = room.id;
    ws.playerId = player.id;
  }

  private handleCreateRoom(ws: ExtendedWebSocket, data: any) {
    const roomId = this.generateRoomId();
    const playerId = data.playerId || `player_${Date.now()}`;
    const playerName = data.playerName || '房主';

    const room: Room = {
      id: roomId,
      hostId: playerId,
      scriptId: data.scriptId,
      maxPlayers: data.maxPlayers || 6,
      players: [],
      status: 'waiting',
      createdAt: Date.now()
    };

    this.rooms.set(roomId, room);

    const player = this.createPlayer(playerId, playerName, true);
    this.addPlayerToRoom(ws, room, player);

    console.log(`Room created: ${roomId}, Host: ${playerName}`);

    const requestId = data._requestId;
    this.sendResponse(ws, { roomId, room, player }, requestId, 'room:created');

    // 创建房间时不需要广播给房主自己，因为房主已经收到响应了
    // 只有当有其他玩家加入时才需要广播
  }

  private handleJoinRoom(ws: ExtendedWebSocket, data: any) {
    const roomId = data.roomId;
    const playerName = data.playerName || '玩家';
    const newPlayerId = data.playerId || `player_${Date.now()}`;
    const room = this.rooms.get(roomId);
    const requestId = data._requestId;

    if (!room) {
      return this.sendError(ws, 'Room not found', requestId);
    }

    if (room.players.length >= room.maxPlayers) {
      return this.sendError(ws, 'Room is full', requestId);
    }

    if (room.status !== 'waiting') {
      return this.sendError(ws, 'Game already started', requestId);
    }

    const player = this.createPlayer(newPlayerId, playerName, false);
    this.addPlayerToRoom(ws, room, player);

    console.log(`Player joined: ${playerName} -> ${roomId}`);
    console.log(`Room now has ${room.players.length} players:`, room.players.map(p => p.name).join(', '));
    console.log(`Room players details:`, room.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost })));

    this.sendResponse(ws, { room, player }, requestId, 'room:joined');

    // 广播给房间内所有其他玩家（包括房主），发送完整的房间信息
    // 注意：excludeWs 参数会排除新加入的玩家，所以房主和其他玩家都能收到广播
    console.log(`Broadcasting room:playerJoined to room ${roomId} (excluding new player)`);
    this.broadcastToRoom(roomId, {
      type: 'room:playerJoined',
      data: { player, room }
    }, ws);
  }

  private handleGameStart(ws: ExtendedWebSocket, _data: any) {
    const { roomId } = ws;
    const requestId = _data._requestId;
    
    if (!roomId) {
      return this.sendError(ws, 'Not in a room', requestId);
    }
    
    const room = this.rooms.get(roomId);
    if (!room) {
      return this.sendError(ws, 'Room not found', requestId);
    }

    if (room.hostId !== ws.playerId) {
      return this.sendError(ws, 'Only host can start the game', requestId);
    }

    // 分配角色给玩家
    this.assignCharacters(room);

    room.status = 'playing';
    room.gameStartedAt = Date.now();

    console.log(`Game started: ${roomId}`);
    console.log(`Characters assigned:`, room.players.map(p => ({ name: p.name, characterId: p.characterId })));

    this.sendResponse(ws, { success: true, room }, requestId);

    // Broadcast to all players in the room
    this.broadcastToRoom(roomId, {
      type: 'game:started',
      data: { room }
    });
  }

  /**
   * 为玩家分配角色
   */
  private assignCharacters(room: Room): void {
    try {
      const { getScript } = this.loadScriptModule();
      const script = getScript(room.scriptId);
      
      if (!script || !script.characters || script.characters.length === 0) {
        console.warn(`No characters found in script ${room.scriptId}`);
        return;
      }

      // 获取非房主玩家
      const players = room.players.filter(p => !p.isHost);
      
      if (players.length === 0) {
        console.warn('No players to assign characters to');
        return;
      }

      // 获取可用角色（排除已分配的角色）
      const availableCharacters = [...script.characters];
      
      // 随机打乱角色顺序
      for (let i = availableCharacters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableCharacters[i], availableCharacters[j]] = [availableCharacters[j], availableCharacters[i]];
      }

      // 为每个玩家分配角色
      players.forEach((player, index) => {
        if (index < availableCharacters.length) {
          player.characterId = availableCharacters[index].id;
          // 更新 players Map 中的信息
          const playerData = this.players.get(player.id);
          if (playerData) {
            playerData.characterId = availableCharacters[index].id;
          }
          console.log(`Assigned character ${availableCharacters[index].name} to player ${player.name}`);
        }
      });
    } catch (error: any) {
      console.error('Error assigning characters:', error);
    }
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

  private handleSetReady(ws: ExtendedWebSocket, data: any) {
    const { roomId, playerId } = ws;
    const requestId = data._requestId;
    const ready = data.ready;

    if (!roomId || !playerId) {
      return this.sendError(ws, 'Not in a room', requestId);
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      return this.sendError(ws, 'Room not found', requestId);
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      return this.sendError(ws, 'Player not found', requestId);
    }

    // Update player ready status
    player.isReady = ready;

    console.log(`Player ${player.name} is now ${ready ? 'ready' : 'not ready'} in room ${roomId}`);

    this.sendResponse(ws, { success: true, isReady: ready }, requestId);

    // Broadcast to all players in the room
    this.broadcastToRoom(roomId, {
      type: 'room:playerReady',
      data: {
        playerId: playerId,
        playerName: player.name,
        isReady: ready,
        room: room
      }
    });
  }

  private handleChatMessage(ws: ExtendedWebSocket, data: any) {
    const { roomId } = ws;
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === ws.playerId);
    if (!player) return;

    const requestId = data._requestId;

    this.sendResponse(ws, { success: true }, requestId);

    // Broadcast to all players in the room (including sender)
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
          data: { newHostId: room.players[0].id, room }
        });
      } else {
        this.rooms.delete(roomId);
        return;
      }
    }

    this.broadcastToRoom(roomId, {
      type: 'room:playerLeft',
      data: { playerId, playerName: player.name, room }
    });

    ws.roomId = undefined;
    ws.playerId = undefined;
  }

  private broadcastToRoom(roomId: string, message: any, excludeWs?: ExtendedWebSocket) {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;
    const targetClients: string[] = [];
    const excludePlayerId = excludeWs ? (excludeWs as ExtendedWebSocket).playerId : 'none';
    
    console.log(`[Broadcast] Preparing to broadcast "${message.type}" to room ${roomId}`);
    console.log(`[Broadcast] Excluding player: ${excludePlayerId}`);
    console.log(`[Broadcast] Total WebSocket clients: ${this.wss.clients.size}`);
    
    this.wss.clients.forEach((client: WebSocket) => {
      const extClient = client as ExtendedWebSocket;
      const clientRoomId = extClient.roomId || 'none';
      const clientPlayerId = extClient.playerId || 'none';
      const isExcluded = extClient === excludeWs;
      const isSameRoom = clientRoomId === roomId;
      const isReady = extClient.readyState === WebSocket.OPEN;
      
      if (isReady && isSameRoom && !isExcluded) {
        extClient.send(messageStr);
        sentCount++;
        targetClients.push(clientPlayerId);
        console.log(`  ✓ Sent to client: playerId=${clientPlayerId}, roomId=${clientRoomId}`);
      } else {
        if (isSameRoom) {
          console.log(`  ✗ Skipped client: playerId=${clientPlayerId}, ready=${isReady}, excluded=${isExcluded}`);
        }
      }
    });
    
    if (sentCount > 0) {
      console.log(`[Broadcast] ✓ Successfully sent "${message.type}" to ${sentCount} client(s): ${targetClients.join(', ')}`);
    } else {
      console.warn(`[Broadcast] ⚠ No clients received "${message.type}" in room ${roomId}`);
    }
  }

  private send(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * 发送响应消息（支持请求-响应模式或事件模式）
   */
  private sendResponse(ws: WebSocket, data: any, requestId?: string, eventType?: string) {
    if (requestId) {
      this.send(ws, {
        id: requestId,
        data
      });
    } else if (eventType) {
      this.send(ws, {
        type: eventType,
        data
      });
    } else {
      this.send(ws, data);
    }
  }

  private sendError(ws: WebSocket, message: string, requestId?: string) {
    if (requestId) {
      this.send(ws, {
        id: requestId,
        error: message
      });
    } else {
      this.send(ws, {
        type: 'error',
        message
      });
    }
  }

  private generateRoomId(): string {
    // 生成6位纯数字房间号
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
