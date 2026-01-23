import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer;

export const setupWebSocket = (server: any) => {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New client connected');

    ws.on('message', (data) => {
      const msg = data.toString();
      console.log('Received:', msg);

      // Broadcast to all clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      });
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
};
