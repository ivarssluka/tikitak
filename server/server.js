import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { nanoid } from 'nanoid';
import RoomManager from './roomManager.js';

const PORT = process.env.PORT || 3001;
const app = express();
const roomManager = new RoomManager();
const authRegistry = new Map();

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'tikitak-online-service',
    message: 'Service is up. Use /api/v1/auth/guest or /api/v1/rooms.',
    version: 'v1'
  });
});

app.post('/api/v1/auth/guest', (req, res) => {
  const nicknameRaw = typeof req.body?.nickname === 'string' ? req.body.nickname : '';
  const nickname = nicknameRaw.trim().slice(0, 16) || `Guest-${Math.floor(Math.random() * 1000)}`;
  const playerId = nanoid(10);
  const token = nanoid(24);
  authRegistry.set(playerId, { token, nickname });
  res.json({ playerId, nickname, token });
});

app.get('/api/v1/rooms', (req, res) => {
  res.json({ rooms: roomManager.listPublicRooms() });
});

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

function sendError(ws, message) {
  if (ws.readyState === ws.OPEN || ws.readyState === 1) {
    ws.send(JSON.stringify({ type: 'error', data: { message } }));
  }
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const roomId = url.searchParams.get('roomId');
  const playerId = url.searchParams.get('playerId');
  const role = url.searchParams.get('role') || 'player';
  const token = url.searchParams.get('token');
  const isTournament = url.searchParams.get('tournament') === 'true';

  if (!roomId || !playerId || !token) {
    sendError(ws, 'Missing connection parameters.');
    ws.close();
    return;
  }

  const auth = authRegistry.get(playerId);
  if (!auth || auth.token !== token) {
    sendError(ws, 'Unauthorized.');
    ws.close();
    return;
  }

  try {
    roomManager.joinRoom({
      roomId,
      playerId,
      nickname: auth.nickname,
      role,
      socket: ws,
      isTournament
    });

    ws.on('message', (message) => {
      try {
        const payload = JSON.parse(message.toString());
        if (!payload?.type) {
          throw new Error('Unknown message format');
        }
        if (payload.type === 'game:move') {
          const cellIndex = Number(payload.data?.cellIndex);
          if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex > 8) {
            throw new Error('Invalid move index');
          }
          roomManager.applyMove({ roomId, playerId, cellIndex });
        } else if (payload.type === 'chat:message') {
          if (typeof payload.data?.text !== 'string' || !payload.data.text.trim()) {
            throw new Error('Empty message');
          }
          roomManager.handleChat({ roomId, playerId, text: payload.data.text });
        } else {
          throw new Error('Unsupported message type');
        }
      } catch (error) {
        console.error('WS message error', error);
        sendError(ws, error.message || 'Unknown error');
      }
    });

    ws.on('close', () => {
      roomManager.removeConnection({ roomId, playerId });
    });
  } catch (error) {
    console.error('Connection error', error);
    sendError(ws, error.message || 'Unable to join room');
    ws.close();
  }
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
