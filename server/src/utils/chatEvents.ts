import type { Response } from 'express';

type Stream = { userId: string; res: Response };
const streams = new Map<string, Set<Response>>();

export function addChatStream(userId: string, res: Response) {
  let set = streams.get(userId);
  if (!set) {
    set = new Set<Response>();
    streams.set(userId, set);
  }
  set.add(res);
  const cleanup = () => {
    set?.delete(res);
    if (set && set.size === 0) streams.delete(userId);
  };
  res.on('close', cleanup);
  return cleanup;
}

export function publishChatEvent(userIds: string[], event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const userId of userIds) {
    const set = streams.get(userId);
    if (!set) continue;
    for (const res of Array.from(set)) {
      try {
        res.write(payload);
      } catch {
        set.delete(res);
      }
    }
  }
}

export function heartbeatChatStreams() {
  for (const set of streams.values()) {
    for (const res of Array.from(set)) {
      try { res.write(': heartbeat\n\n'); } catch { /* closed response is cleaned up by close */ }
    }
  }
}
