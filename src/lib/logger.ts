// Simple logger utility for Transmilenio CLI

import pc from 'picocolors';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO;
  private quiet = false;

  setLevel(level: LogLevel) {
    this.level = level;
  }

  setQuiet(quiet: boolean) {
    this.quiet = quiet;
  }

  debug(...args: unknown[]) {
    if (this.quiet || this.level > LogLevel.DEBUG) return;
    console.error(pc.gray('[DEBUG]'), ...args);
  }

  info(...args: unknown[]) {
    if (this.quiet || this.level > LogLevel.INFO) return;
    console.error(pc.blue('[INFO]'), ...args);
  }

  success(...args: unknown[]) {
    if (this.quiet) return;
    console.error(pc.green('✓'), ...args);
  }

  warn(...args: unknown[]) {
    if (this.quiet || this.level > LogLevel.WARN) return;
    console.warn(pc.yellow('[WARN]'), ...args);
  }

  error(...args: unknown[]) {
    if (this.level > LogLevel.ERROR) return;
    console.error(pc.red('[ERROR]'), ...args);
  }
}

export const logger = new Logger();
