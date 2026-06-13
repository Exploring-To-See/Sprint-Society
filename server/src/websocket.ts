import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import db from './database/pg';
import { config } from './config';

interface AuthenticatedSocket extends WebSocket {
  userId?: number;
  userName?: string;
  communityId?: number;
}

const communities = new Map<number, Set<AuthenticatedSocket>>();
const userSockets = new Map<number, Set<AuthenticatedSocket>>();

export function pushToUser(userId: number, event: { type: string; [key: string]: any }) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  const msg = JSON.stringify(event);
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

export function initWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', async (ws: AuthenticatedSocket, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const communityId = parseInt(url.searchParams.get('community') || '0');

    if (!token) {
      ws.close(4001, 'Missing token');
      return;
    }

    try {
      const secret = config.jwtSecret;
      const decoded = jwt.verify(token, secret) as any;
      ws.userId = decoded.userId || decoded.id;
      ws.communityId = communityId;

      const user = await db.queryOne('SELECT name FROM users WHERE id = $1', [ws.userId]);
      ws.userName = user?.name || 'Anonymous';
    } catch {
      ws.close(4003, 'Invalid token');
      return;
    }

    // Register for push notifications (all authenticated connections)
    if (ws.userId) {
      if (!userSockets.has(ws.userId)) userSockets.set(ws.userId, new Set());
      userSockets.get(ws.userId)!.add(ws);
    }

    // If no community specified, this is a notification-only connection
    if (!communityId) {
      ws.on('close', () => {
        if (ws.userId) {
          userSockets.get(ws.userId)?.delete(ws);
          if (userSockets.get(ws.userId)?.size === 0) userSockets.delete(ws.userId);
        }
      });
      return;
    }

    const isMember = await db.queryOne(
      'SELECT 1 FROM community_members WHERE community_id = $1 AND user_id = $2',
      [communityId, ws.userId]
    );

    if (!isMember) {
      ws.close(4004, 'Not a member');
      return;
    }

    if (!communities.has(communityId)) {
      communities.set(communityId, new Set());
    }
    communities.get(communityId)!.add(ws);

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'chat') {
          const body = msg.body?.trim();
          if (!body || body.length > 1000) return;

          const result = await db.queryOne(
            'INSERT INTO community_chat_messages (community_id, user_id, body) VALUES ($1, $2, $3) RETURNING id',
            [communityId, ws.userId, body]
          );

          const broadcast = JSON.stringify({
            type: 'chat',
            id: result?.id,
            user_id: ws.userId,
            user_name: ws.userName,
            body,
            created_at: new Date().toISOString(),
          });

          communities.get(communityId)?.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcast);
            }
          });
        }

        if (msg.type === 'typing') {
          const broadcast = JSON.stringify({
            type: 'typing',
            user_id: ws.userId,
            user_name: ws.userName,
          });

          communities.get(communityId)?.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(broadcast);
            }
          });
        }
      } catch (err: any) {
        console.error(`[WebSocket] Message handling error (user=${ws.userId}, community=${communityId}):`, err.message || err);
      }
    });

    ws.on('close', () => {
      communities.get(communityId)?.delete(ws);
      if (communities.get(communityId)?.size === 0) {
        communities.delete(communityId);
      }
      if (ws.userId) {
        userSockets.get(ws.userId)?.delete(ws);
        if (userSockets.get(ws.userId)?.size === 0) userSockets.delete(ws.userId);
      }
    });
  });

  return wss;
}
