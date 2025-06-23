import { DatabaseManager } from '../database/connection.ts';
import type { Context as OakContext } from 'oak';

export interface Context {
  db: typeof DatabaseManager;
  ip: string;
  userId?: string;
  roomId?: string;
}

export function createContext(ctx: OakContext): Context {
  return {
    db: DatabaseManager,
    ip: ctx.request.ip,
  };
}
