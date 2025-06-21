import { DatabaseManager } from '../database/connection.ts';

export interface Context {
    kv: Deno.Kv;
    userId?: string;
    roomId?: string;
}

export async function createContext(): Promise<Context> {
    const kv = DatabaseManager.getKv();
    return { kv };
}
