import { DatabaseManager } from '../database/connection.ts';

export interface Context {
    kv: Deno.Kv;
    userId?: string;
    roomId?: string;
}

export function createContext(): Context {
    const kv = DatabaseManager.getKv();
    return { kv };
}
