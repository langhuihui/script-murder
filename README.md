# Jubensha SDK (剧本杀 SDK)

这是一个用于快速开发多人在线剧本杀游戏（Jubensha）的 TypeScript SDK。它提供了房间管理、游戏流程控制和状态同步的核心功能。

## 特性

*   **房间管理**: 创建、加入、离开房间。
*   **游戏流程控制**: 管理游戏阶段（阅读、搜证、投票等）。
*   **状态同步**: 基于事件的实时状态更新。
*   **TypeScript 支持**: 完整的类型定义。
*   **模拟网络层**: 内置 Mock 网络层，方便本地开发调试。

## 安装

使用 pnpm 安装：

```bash
pnpm install jubensha-sdk
```

*(注意：本项目目前为本地开发包，尚未发布到 npm registry)*

## 快速开始

### 1. 初始化客户端

```typescript
import { JubenshaClient } from 'jubensha-sdk';

const client = new JubenshaClient({
  serverUrl: 'ws://localhost:8080', // 游戏服务器地址
  debug: true
});

// 连接服务器
await client.connect();
```

### 2. 房间管理

**创建房间**

```typescript
// 创建一个容纳 6 人的房间，使用剧本 'script_001'
const roomId = await client.room.createRoom('script_001', 6);
console.log(`Room created: ${roomId}`);
```

**加入房间**

```typescript
await client.room.joinRoom(roomId, 'PlayerName');
```

**监听房间事件**

```typescript
client.room.on('left', () => {
  console.log('Left the room');
});
```

### 3. 游戏流程控制

**开始游戏**

```typescript
await client.game.startGame();
```

**监听游戏阶段变化**

```typescript
import { GamePhase } from 'jubensha-sdk';

client.game.on('phaseChange', (phase: GamePhase) => {
  switch (phase) {
    case GamePhase.READING:
      console.log('进入阅读阶段');
      break;
    case GamePhase.SEARCH:
      console.log('进入搜证阶段');
      break;
    case GamePhase.VOTE:
      console.log('进入投票阶段');
      break;
  }
});
```

**推进游戏阶段**

```typescript
// 进入下一个阶段
await client.game.nextPhase();
```

### 4. 游戏操作

**提交线索**

```typescript
// 发现线索 'clue_123'
await client.game.submitClue('clue_123');
```

**监听状态更新**

```typescript
client.game.on('stateUpdate', (state) => {
  console.log('当前已发现线索:', state.cluesFound);
  console.log('当前回合:', state.round);
});
```

## API 参考

### `JubenshaClient`

*   `connect()`: 连接服务器。
*   `disconnect()`: 断开连接。
*   `room`: `RoomManager` 实例。
*   `game`: `GameManager` 实例。

### `RoomManager`

*   `createRoom(scriptId: string, maxPlayers: number)`: 创建房间。
*   `joinRoom(roomId: string, playerName: string)`: 加入房间。
*   `leaveRoom()`: 离开房间。

### `GameManager`

*   `startGame()`: 开始游戏。
*   `nextPhase()`: 进入下一阶段。
*   `submitClue(clueId: string)`: 提交线索。
*   `state`: 当前 `GameState` 对象。

## 开发

**构建**

```bash
pnpm run build
```

**开发模式 (监听文件变化)**

```bash
pnpm run dev
```
