import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

const server = createServer();
const wss = new WebSocketServer({ server });

const PORT = 8080;

interface Room {
  id: string;
  players: WebSocket[];
  state: any;
}

const rooms: Record<string, Room> = {};

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    try {
      const raw = message.toString();
      const { id, event, data } = JSON.parse(raw);
      
      console.log(`Received [${event}]:`, data);

      let responseData = {};

      switch (event) {
        case 'room:create':
          const roomId = 'ROOM_' + Math.floor(Math.random() * 10000);
          rooms[roomId] = { id: roomId, players: [ws], state: {} };
          responseData = { roomId };
          break;

        case 'room:join':
          if (rooms[data.roomId]) {
            rooms[data.roomId].players.push(ws);
            responseData = { success: true };
            // Broadcast to others
            broadcast(rooms[data.roomId], 'playerJoined', { name: data.playerName }, ws);
          } else {
            throw new Error('Room not found');
          }
          break;

        case 'game:start':
        case 'game:phaseUpdate':
        case 'game:clueFound':
          // Simple echo/broadcast for game events
          // In a real app, you'd validate and update server state here
          responseData = { success: true };
          // Broadcast to all in room (assuming we track room per socket, skipping for simplicity here)
          // For demo, we just respond success. 
          // To properly broadcast, we need to know which room this socket belongs to.
          break;
          
        default:
          console.warn('Unknown event:', event);
      }

      // Send response back matching the request ID
      ws.send(JSON.stringify({
        id,
        data: responseData
      }));

    } catch (error: any) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

function broadcast(room: Room, event: string, data: any, exclude?: WebSocket) {
  room.players.forEach(client => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ event, data }));
    }
  });
}

server.listen(PORT, () => {
  console.log(`WebSocket Server started on ws://localhost:${PORT}`);
});