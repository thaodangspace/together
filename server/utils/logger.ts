export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

export class Logger {
    private level: LogLevel;

    constructor(level: string = 'info') {
        this.level = LogLevel[level.toUpperCase() as keyof typeof LogLevel] || LogLevel.INFO;
    }

    private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
        if (level < this.level) return;

        const timestamp = new Date().toISOString();
        const levelName = LogLevel[level];

        const logEntry = {
            timestamp,
            level: levelName,
            message,
            ...meta,
        };

        console.log(JSON.stringify(logEntry));
    }

    debug(message: string, meta?: Record<string, unknown>) {
        this.log(LogLevel.DEBUG, message, meta);
    }

    info(message: string, meta?: Record<string, unknown>) {
        this.log(LogLevel.INFO, message, meta);
    }

    warn(message: string, meta?: Record<string, unknown>) {
        this.log(LogLevel.WARN, message, meta);
    }

    error(message: string, error?: Error, meta?: Record<string, unknown>) {
        this.log(LogLevel.ERROR, message, {
            error: error?.message,
            stack: error?.stack,
            ...meta,
        });
    }
}

// deno-lint-ignore no-explicit-any
const denoEnv = (globalThis as any).Deno?.env;
export const logger = new Logger(denoEnv?.get('LOG_LEVEL') || 'info');
