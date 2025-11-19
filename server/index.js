const { WebSocketServer, WebSocket } = require('ws');
const { createServer } = require('http');

const server = createServer();
const wss = new WebSocketServer({ server });

const PORT = 8080;

// In-memory room storage for demo purposes
const rooms = {};

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    try {
      const raw = message.toString();
      const { id, event, data } = JSON.parse(raw);

      console.log(`Received [${event}]:`, data);

      let responseData = {};

      switch (event) {
        case 'room:create': {
          const roomId = 'ROOM_' + Math.floor(Math.random() * 10000);
          rooms[roomId] = { id: roomId, players: [ws], state: {} };
          responseData = { roomId };
          break;
        }
        case 'room:join': {
          const room = rooms[data.roomId];
          if (room) {
            room.players.push(ws);
            responseData = { success: true };
            // Broadcast to others in the room that a player joined
            broadcast(room, 'playerJoined', { name: data.playerName }, ws);
          } else {
            throw new Error('Room not found');
          }
          break;
        }
        case 'game:start':
        case 'game:phaseUpdate':
        case 'game:clueFound': {
          // For demo, just acknowledge success.
          responseData = { success: true };
          break;
        }
        default:
          console.warn('Unknown event:', event);
      }

      // Send response back matching the request ID
      ws.send(
        JSON.stringify({
          id,
          data: responseData,
        })
      );
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

function broadcast(room, event, data, exclude) {
  room.players.forEach((client) => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ event, data }));
    }
  });
}

server.listen(PORT, () => {
  console.log(`WebSocket Server started on ws://localhost:${PORT}`);
});

