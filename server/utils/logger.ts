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

    private log(level: LogLevel, message: string, meta?: any) {
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

    debug(message: string, meta?: any) {
        this.log(LogLevel.DEBUG, message, meta);
    }

    info(message: string, meta?: any) {
        this.log(LogLevel.INFO, message, meta);
    }

    warn(message: string, meta?: any) {
        this.log(LogLevel.WARN, message, meta);
    }

    error(message: string, error?: Error, meta?: any) {
        this.log(LogLevel.ERROR, message, {
            error: error?.message,
            stack: error?.stack,
            ...meta,
        });
    }
}

export const logger = new Logger(Deno.env.get('LOG_LEVEL') || 'info');
