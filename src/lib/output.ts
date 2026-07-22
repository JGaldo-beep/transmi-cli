// Output handling utilities for dual mode (human/JSON)

import type { GlobalOptions, JsonOutput, OutputMode } from '@types/cli.js';
import { colors } from './colors.js';
import { TransmiError } from './errors.js';
import { logger } from './logger.js';

const VERSION = '1.0.0';

/**
 * Detect output mode based on options and TTY
 */
export function detectMode(options: GlobalOptions): OutputMode {
  if (options.json) return 'json';
  if (!process.stdout.isTTY) return 'json'; // Auto-JSON when piped
  return 'human';
}

/**
 * Emit output in the appropriate format
 */
export function emit<T>(
  value: T,
  options: GlobalOptions,
  humanRenderer?: (value: T) => void
): void {
  const mode = detectMode(options);

  if (mode === 'json') {
    const output: JsonOutput<T> = {
      success: true,
      data: value,
      meta: {
        timestamp: new Date().toISOString(),
        version: VERSION,
        cached: false, // TODO: track cache status
      },
    };
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  } else if (humanRenderer) {
    humanRenderer(value);
  } else {
    // Fallback to pretty JSON if no human renderer provided
    process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
  }
}

/**
 * Emit an error in the appropriate format
 */
export function emitError(error: Error | TransmiError, options: GlobalOptions): void {
  const mode = detectMode(options);

  if (mode === 'json') {
    const output: JsonOutput<never> = {
      success: false,
      error: {
        code: error instanceof TransmiError ? error.code : 'UNKNOWN_ERROR',
        message: error.message,
        details: error instanceof TransmiError ? error.details : undefined,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: VERSION,
        cached: false,
      },
    };
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  } else {
    if (error instanceof TransmiError) {
      logger.error(colors.error(`✗ ${error.message}`));
      if (error.details && !options.quiet) {
        console.error(colors.muted(JSON.stringify(error.details, null, 2)));
      }
    } else {
      logger.error(colors.error(`✗ ${error.message}`));
    }
  }
}

/**
 * Write to stderr (for debug/info messages that shouldn't pollute JSON output)
 */
export function writeStderr(message: string): void {
  process.stderr.write(`${message}\n`);
}
