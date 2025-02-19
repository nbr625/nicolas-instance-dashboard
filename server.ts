import { createServer, IncomingMessage } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';

const isDev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev: isDev });
const nextHandler = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || '', true);
    nextHandler(req, res, parsedUrl);
  });

  server.listen(3000, (err?: Error) => {
    if (err) throw err;
    console.log('> Next.js server running on http://localhost:3000');
  });

  const wsServer = new WebSocketServer({ port: 3001 });
  console.log('> WebSocket server running on ws://localhost:3001');

  wsServer.on('connection', (socket: WebSocket, req: IncomingMessage) => {
    const { instanceId } = parse(req.url || '', true).query;
    if (!instanceId) {
      console.warn('WebSocket connected without instanceId; closing connection.');
      socket.close(1000, 'Missing instanceId');
      return;
    }
    console.log(`WebSocket connected for Instance: ${instanceId}`);

    const timers: NodeJS.Timeout[] = [];

    const sendPayload = (payload: any) => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify(payload));
        } catch (error) {
          console.error('Error sending payload:', error);
        }
      }
    };

    timers.push(
      setInterval(() => {
        const payload = {
          metric: 'cpu',
          value: parseFloat((Math.random() * 100).toFixed(2)),
          timestamp: Date.now(),
        };
        sendPayload(payload);
      }, 1000)
    );

    timers.push(
      setInterval(() => {
        const payload = {
          metric: 'gpu',
          value: parseFloat((Math.random() * 100).toFixed(2)),
          timestamp: Date.now(),
        };
        sendPayload(payload);
      }, 100)
    );

    timers.push(
      setInterval(() => {
        const payload = {
          metric: 'memory',
          value: parseFloat((Math.random() * 64).toFixed(2)),
          timestamp: Date.now(),
        };
        sendPayload(payload);
      }, 10000)
    );

    timers.push(
      setInterval(() => {
        const usedSpace = parseFloat((Math.random() * 20).toFixed(2));
        const payload = {
          metric: 'disk',
          used: usedSpace,
          free: parseFloat((20 - usedSpace).toFixed(2)),
          timestamp: Date.now(),
        };
        sendPayload(payload);
      }, 15000)
    );

    socket.on('close', () => {
      timers.forEach(timer => clearInterval(timer));
      console.log(`WebSocket disconnected for Instance: ${instanceId}`);
    });
  });
});
