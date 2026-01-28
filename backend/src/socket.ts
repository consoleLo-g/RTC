import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { ChatMessage } from './types';

interface ClientMeta {
  socket: WebSocket;
  user: string;
}

let wss: WebSocketServer;
const clients = new Map<WebSocket, ClientMeta>();

export const setupWebSocket = (server: any) => {
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request: IncomingMessage, socket: any, head: Buffer) => {
    // Only accept websocket upgrades on a path
    if (request.url === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (!ws.isAlive) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('connection', (socket: WebSocket, req) => {
    const ip = req.socket.remoteAddress;
    console.log('New client connected:', ip);

    (socket as any).isAlive = true;
    socket.on('pong', () => ((socket as any).isAlive = true));
    socket.on('message', (raw) => {
      let payload: ChatMessage;

      try {
        payload = JSON.parse(raw.toString());
      } catch {
        console.warn('Invalid JSON received');
        return;
      }

      // First message must be JOIN
      if (payload.type === 'join') {
        clients.set(socket, {
          socket,
          user: payload.user,
        });

        broadcast({
          type: 'join',
          user: payload.user,
          timestamp: Date.now(),
        });

        return;
      }

      const client = clients.get(socket);
      if (!client) return;

      if (payload.type === 'message') {
        broadcast({
          type: 'message',
          user: client.user,
          text: payload.text,
          timestamp: Date.now(),
        });
      }
    });

    socket.on('close', () => {
      const client = clients.get(socket);
      if (!client) return;

      clients.delete(socket);

      broadcast({
        type: 'leave',
        user: client.user,
        timestamp: Date.now(),
      });

      console.log('Client disconnected:', client.user);
    });
  });
};

// 🔁 Broadcast helper
function broadcast(message: ChatMessage) {
  const data = JSON.stringify(message);

  for (const { socket } of clients.values()) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(data);
    }
  }
}
