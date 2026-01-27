import { WebSocketServer, WebSocket as WsSocket } from 'ws';
import type { IncomingMessage } from 'http';

let wss: WebSocketServer;

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

  wss.on('connection', (socket: WsSocket, req) => {
    const ip = req.socket.remoteAddress;
    console.log('New client connected:', ip);

    socket.on('message', (data) => {
      const message = data.toString();
      console.log('Received:', message);

      wss.clients.forEach((client) => {
        if (client.readyState === WsSocket.OPEN) {
          client.send(message);
        }
      });
    });

    socket.on('close', () => {
      console.log('Client disconnected:', ip);
    });
  });
};
