import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import db from './database/db';
import { config } from './config';

interface AuthenticatedSocket extends WebSocket {
  userId?: number;
  userName?: string;
  communityId?: number;
}

const communities = new Map<number, Set<AuthenticatedSocket>>();

export function initWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: AuthenticatedSocket, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const communityId = parseInt(url.searchParams.get('community') || '0');

    if (!token || !communityId) {
      ws.close(4001, 'Missing token or community');
      return;
    }

    try {
      const secret = config.jwtSecret;
      const decoded = jwt.verify(token, secret) as any;
      ws.userId = decoded.userId || decoded.id;
      ws.communityId = communityId;

      const user = db.prepare('SELECT name FROM users WHERE id = ?').get(ws.userId) as any;
      ws.userName = user?.name || 'Anonymous';
    } catch {
      ws.close(4003, 'Invalid token');
      return;
    }

    const isMember = db.prepare(
      'SELECT 1 FROM community_members WHERE community_id = ? AND user_id = ?'
    ).get(communityId, ws.userId);

    if (!isMember) {
      ws.close(4004, 'Not a member');
      return;
    }

    if (!communities.has(communityId)) {
      communities.set(communityId, new Set());
    }
    communities.get(communityId)!.add(ws);

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'chat') {
          const body = msg.body?.trim();
          if (!body || body.length > 1000) return;

          const result = db.prepare(
            'INSERT INTO community_chat_messages (community_id, user_id, body) VALUES (?, ?, ?)'
          ).run(communityId, ws.userId, body);

          const broadcast = JSON.stringify({
            type: 'chat',
            id: result.lastInsertRowid,
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
    });
  });

  return wss;
}
