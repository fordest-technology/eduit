const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
};

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = env.NODE_ENV === "development";
  private isProduction = env.NODE_ENV === "production";

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;

    // In production, only log warn and error by default
    if (this.isProduction) {
      return level === "warn" || level === "error";
    }

    return true;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog("debug")) {
      console.debug(this.formatMessage("debug", message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog("info")) {
      console.info(this.formatMessage("info", message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, context));
    }
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    if (this.shouldLog("error")) {
      const errorContext = {
        ...context,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
      };
      console.error(this.formatMessage("error", message, errorContext));
    }
  }

  // Special method for API performance logging
  api(operation: string, duration: number, context?: LogContext): void {
    if (this.shouldLog("info")) {
      const performanceContext = {
        ...context,
        duration: `${duration}ms`,
        performance:
          duration > 1000 ? "SLOW" : duration > 500 ? "MEDIUM" : "FAST",
      };
      console.info(
        this.formatMessage("info", `API ${operation}`, performanceContext)
      );
    }
  }

  // Special method for database query logging
  query(operation: string, duration: number, context?: LogContext): void {
    if (this.shouldLog("debug")) {
      const queryContext = {
        ...context,
        duration: `${duration}ms`,
        performance:
          duration > 100 ? "SLOW" : duration > 50 ? "MEDIUM" : "FAST",
      };
      console.debug(
        this.formatMessage("debug", `DB Query ${operation}`, queryContext)
      );
    }
  }
}

export const logger = new Logger();
