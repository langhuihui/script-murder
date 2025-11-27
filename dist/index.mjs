var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.js
var require_eventemitter3 = __commonJS({
  "node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.js"(exports, module) {
    "use strict";
    var has = Object.prototype.hasOwnProperty;
    var prefix = "~";
    function Events() {
    }
    if (Object.create) {
      Events.prototype = /* @__PURE__ */ Object.create(null);
      if (!new Events().__proto__) prefix = false;
    }
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== "function") {
        throw new TypeError("The listener must be a function");
      }
      var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
      if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
      else emitter._events[evt] = [emitter._events[evt], listener];
      return emitter;
    }
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0) emitter._events = new Events();
      else delete emitter._events[evt];
    }
    function EventEmitter2() {
      this._events = new Events();
      this._eventsCount = 0;
    }
    EventEmitter2.prototype.eventNames = function eventNames() {
      var names = [], events, name;
      if (this._eventsCount === 0) return names;
      for (name in events = this._events) {
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
      }
      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }
      return names;
    };
    EventEmitter2.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event, handlers = this._events[evt];
      if (!handlers) return [];
      if (handlers.fn) return [handlers.fn];
      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }
      return ee;
    };
    EventEmitter2.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event, listeners = this._events[evt];
      if (!listeners) return 0;
      if (listeners.fn) return 1;
      return listeners.length;
    };
    EventEmitter2.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return false;
      var listeners = this._events[evt], len = arguments.length, args, i;
      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
        switch (len) {
          case 1:
            return listeners.fn.call(listeners.context), true;
          case 2:
            return listeners.fn.call(listeners.context, a1), true;
          case 3:
            return listeners.fn.call(listeners.context, a1, a2), true;
          case 4:
            return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }
        for (i = 1, args = new Array(len - 1); i < len; i++) {
          args[i - 1] = arguments[i];
        }
        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length, j;
        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, void 0, true);
          switch (len) {
            case 1:
              listeners[i].fn.call(listeners[i].context);
              break;
            case 2:
              listeners[i].fn.call(listeners[i].context, a1);
              break;
            case 3:
              listeners[i].fn.call(listeners[i].context, a1, a2);
              break;
            case 4:
              listeners[i].fn.call(listeners[i].context, a1, a2, a3);
              break;
            default:
              if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) {
                args[j - 1] = arguments[j];
              }
              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }
      return true;
    };
    EventEmitter2.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };
    EventEmitter2.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };
    EventEmitter2.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }
      var listeners = this._events[evt];
      if (listeners.fn) {
        if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
            events.push(listeners[i]);
          }
        }
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
      }
      return this;
    };
    EventEmitter2.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;
      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }
      return this;
    };
    EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;
    EventEmitter2.prototype.addListener = EventEmitter2.prototype.on;
    EventEmitter2.prefixed = prefix;
    EventEmitter2.EventEmitter = EventEmitter2;
    if ("undefined" !== typeof module) {
      module.exports = EventEmitter2;
    }
  }
});

// src/types/index.ts
var GamePhase = /* @__PURE__ */ ((GamePhase2) => {
  GamePhase2["IDLE"] = "IDLE";
  GamePhase2["READING"] = "READING";
  GamePhase2["SEARCH"] = "SEARCH";
  GamePhase2["DISCUSSION"] = "DISCUSSION";
  GamePhase2["VOTE"] = "VOTE";
  GamePhase2["REVEAL"] = "REVEAL";
  return GamePhase2;
})(GamePhase || {});

// node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.mjs
var import_index = __toESM(require_eventemitter3(), 1);
var eventemitter3_default = import_index.default;

// node_modules/.pnpm/isomorphic-ws@5.0.0_ws@8.18.3/node_modules/isomorphic-ws/browser.js
var ws = null;
if (typeof WebSocket !== "undefined") {
  ws = WebSocket;
} else if (typeof MozWebSocket !== "undefined") {
  ws = MozWebSocket;
} else if (typeof global !== "undefined") {
  ws = global.WebSocket || global.MozWebSocket;
} else if (typeof window !== "undefined") {
  ws = window.WebSocket || window.MozWebSocket;
} else if (typeof self !== "undefined") {
  ws = self.WebSocket || self.MozWebSocket;
}
var browser_default = ws;

// src/core/network.ts
var NetworkClient = class extends eventemitter3_default {
  constructor(serverUrl) {
    super();
    this.ws = null;
    this.connected = false;
    this.pendingRequests = /* @__PURE__ */ new Map();
    this.serverUrl = serverUrl;
  }
  async connect() {
    console.log(`[Network] Connecting to ${this.serverUrl}...`);
    return new Promise((resolve, reject) => {
      this.ws = new browser_default(this.serverUrl);
      this.ws.onopen = () => {
        this.connected = true;
        console.log("[Network] Connected.");
        this.emit("connect");
        resolve();
      };
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data.toString());
        if (message.id && this.pendingRequests.has(message.id)) {
          const resolveReq = this.pendingRequests.get(message.id);
          if (resolveReq) resolveReq(message.data);
          this.pendingRequests.delete(message.id);
          return;
        }
        const eventType = message.event || message.type;
        if (eventType) {
          this.emit(eventType, message.data);
        }
      };
      this.ws.onerror = (err) => {
        console.error("[Network] Error:", err);
        reject(err);
      };
      this.ws.onclose = () => {
        this.connected = false;
        this.emit("disconnect");
        console.log("[Network] Disconnected.");
      };
    });
  }
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.emit("disconnect");
  }
  async send(event, data) {
    if (!this.connected || !this.ws) throw new Error("Network not connected");
    const requestId = Math.random().toString(36).substring(7);
    const payload = JSON.stringify({ id: requestId, event, data });
    console.log(`[Network] Sending [${event}]:`, data);
    this.ws.send(payload);
    return new Promise((resolve) => {
      this.pendingRequests.set(requestId, resolve);
    });
  }
};

// src/managers/room-manager.ts
var RoomManager = class extends eventemitter3_default {
  constructor(network) {
    super();
    this.currentRoom = null;
    this.currentPlayer = null;
    this.network = network;
    this.setupNetworkListeners();
  }
  setupNetworkListeners() {
    this.network.on("room:playerJoined", (data) => {
      console.log("[RoomManager] Player joined:", data.player);
      if (this.currentRoom && data.player) {
        const exists = this.currentRoom.players.some((p) => p.id === data.player.id);
        if (!exists) {
          this.currentRoom.players.push(data.player);
        }
        this.emit("playerJoined", data.player);
        this.emit("roomUpdated", this.currentRoom);
      }
    });
    this.network.on("room:playerLeft", (data) => {
      console.log("[RoomManager] Player left:", data.playerId);
      if (this.currentRoom) {
        this.currentRoom.players = this.currentRoom.players.filter((p) => p.id !== data.playerId);
        this.emit("playerLeft", data.playerId);
        this.emit("roomUpdated", this.currentRoom);
      }
    });
    this.network.on("room:updated", (data) => {
      console.log("[RoomManager] Room updated:", data.room);
      if (data.room) {
        this.currentRoom = data.room;
        this.emit("roomUpdated", this.currentRoom);
      }
    });
    this.network.on("room:playerReady", (data) => {
      console.log("[RoomManager] Player ready status changed:", data);
      if (this.currentRoom) {
        const player = this.currentRoom.players.find((p) => p.id === data.playerId);
        if (player) {
          player.isReady = data.isReady;
        }
        if (data.room) {
          this.currentRoom = data.room;
        }
        this.emit("playerReady", { playerId: data.playerId, isReady: data.isReady });
        this.emit("roomUpdated", this.currentRoom);
      }
    });
    this.network.on("chat:message", (data) => {
      console.log("[RoomManager] Chat message received:", data);
      this.emit("chatMessage", data);
    });
  }
  async createRoom(scriptId, maxPlayers, playerName) {
    const res = await this.network.send("room:create", { scriptId, maxPlayers, playerName });
    const room = res.room || {
      id: res.roomId,
      hostId: res.player?.id || "LOCAL_USER",
      players: res.room?.players || [res.player].filter(Boolean),
      maxPlayers,
      scriptId
    };
    this.currentRoom = room;
    this.currentPlayer = res.player || null;
    this.emit("roomCreated", { room: this.currentRoom, player: this.currentPlayer });
    return {
      roomId: res.roomId,
      room,
      player: this.currentPlayer
    };
  }
  async joinRoom(roomId, playerName) {
    const res = await this.network.send("room:join", { roomId, playerName });
    this.currentRoom = res.room || null;
    this.currentPlayer = res.player || null;
    console.log(`Joined room ${roomId} as ${playerName}`, res);
    this.emit("roomJoined", { room: this.currentRoom, player: this.currentPlayer });
    return {
      room: this.currentRoom,
      player: this.currentPlayer
    };
  }
  leaveRoom() {
    this.currentRoom = null;
    this.currentPlayer = null;
    this.emit("left");
  }
  async setReady(ready) {
    const res = await this.network.send("room:setReady", { ready });
    if (this.currentPlayer) {
      this.currentPlayer.isReady = ready;
    }
    return res;
  }
  async sendMessage(message) {
    const res = await this.network.send("chat:message", { message });
    return res;
  }
};

// src/managers/game-manager.ts
var DEFAULT_PHASES = [
  "IDLE" /* IDLE */,
  "READING" /* READING */,
  "SEARCH" /* SEARCH */,
  "DISCUSSION" /* DISCUSSION */,
  "VOTE" /* VOTE */,
  "REVEAL" /* REVEAL */
];
var GameManager = class extends eventemitter3_default {
  constructor(network, phases) {
    super();
    this.network = network;
    this.phases = phases && phases.length > 0 ? phases : DEFAULT_PHASES;
    this.state = {
      phase: this.phases[0],
      round: 0,
      cluesFound: [],
      votes: {}
    };
  }
  async startGame(initialPhase) {
    await this.network.send("game:start", {});
    const nextPhase = initialPhase ?? this.getNextPhase();
    this.updatePhase(nextPhase);
  }
  async nextPhase(targetPhase) {
    const nextPhase = targetPhase ?? this.getNextPhase();
    await this.network.send("game:phaseUpdate", { phase: nextPhase });
    this.updatePhase(nextPhase);
  }
  async submitClue(clueId) {
    if (this.state.cluesFound.includes(clueId)) return;
    await this.network.send("game:clueFound", { clueId });
    this.state.cluesFound.push(clueId);
    this.emit("stateUpdate", this.state);
  }
  getNextPhase(current = this.state.phase) {
    const index = this.phases.indexOf(current);
    if (index === -1) {
      return this.phases[0];
    }
    const nextIndex = (index + 1) % this.phases.length;
    return this.phases[nextIndex];
  }
  // 内部更新状态并通知外部
  updatePhase(phase) {
    this.state.phase = phase;
    console.log(`[GameManager] Phase changed to: ${phase}`);
    this.emit("phaseChange", phase);
    this.emit("stateUpdate", this.state);
  }
};

// src/core/client.ts
var JubenshaClient = class {
  constructor(config) {
    this.network = new NetworkClient(config.serverUrl);
    this.room = new RoomManager(this.network);
    this.game = new GameManager(this.network, config.gamePhases);
  }
  async connect() {
    await this.network.connect();
  }
  disconnect() {
    this.network.disconnect();
  }
};
export {
  GameManager,
  GamePhase,
  JubenshaClient,
  RoomManager
};
