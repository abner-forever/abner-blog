import { ConsoleLogger } from '@nestjs/common';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { inspect } from 'util';

export class RootFileLogger extends ConsoleLogger {
  private readonly appLogPath: string;
  private readonly errorLogPath: string;

  constructor() {
    super();
    const logsDir = join(__dirname, '..', '..', '..', '..', 'logs');

    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }

    const currentDate = new Date().toISOString().slice(0, 10);
    this.appLogPath = join(logsDir, `server-${currentDate}.log`);
    this.errorLogPath = join(logsDir, `server-error-${currentDate}.log`);
  }

  private writeToFile(filePath: string, level: string, message: unknown) {
    const logMessage = this.toLogMessage(message);
    appendFileSync(
      filePath,
      `[${new Date().toISOString()}] [${level}] ${logMessage}\n`,
      'utf8',
    );
  }

  private toLogMessage(message: unknown): string {
    if (typeof message === 'string') {
      return message;
    }
    return inspect(message, { depth: null, breakLength: Infinity });
  }

  log(message: unknown, context?: string) {
    super.log(message, context);
    this.writeToFile(this.appLogPath, 'LOG', message);
  }

  error(message: unknown, trace?: string, context?: string) {
    super.error(message, trace, context);
    this.writeToFile(this.appLogPath, 'ERROR', message);
    this.writeToFile(
      this.errorLogPath,
      'ERROR',
      trace ? `${this.toLogMessage(message)}\n${trace}` : message,
    );
  }

  warn(message: unknown, context?: string) {
    super.warn(message, context);
    this.writeToFile(this.appLogPath, 'WARN', message);
  }

  debug(message: unknown, context?: string) {
    super.debug(message, context);
    this.writeToFile(this.appLogPath, 'DEBUG', message);
  }
}
