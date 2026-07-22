// Color utilities wrapper around picocolors

import pc from 'picocolors';

export const colors = {
  // Basic colors
  reset: pc.reset,
  bold: pc.bold,
  dim: pc.dim,
  italic: pc.italic,
  underline: pc.underline,

  // Text colors
  black: pc.black,
  red: pc.red,
  green: pc.green,
  yellow: pc.yellow,
  blue: pc.blue,
  magenta: pc.magenta,
  cyan: pc.cyan,
  white: pc.white,
  gray: pc.gray,

  // Background colors
  bgBlack: pc.bgBlack,
  bgRed: pc.bgRed,
  bgGreen: pc.bgGreen,
  bgYellow: pc.bgYellow,
  bgBlue: pc.bgBlue,
  bgMagenta: pc.bgMagenta,
  bgCyan: pc.bgCyan,
  bgWhite: pc.bgWhite,

  // Custom helpers
  success: (text: string) => pc.green(text),
  error: (text: string) => pc.red(text),
  warning: (text: string) => pc.yellow(text),
  info: (text: string) => pc.blue(text),
  highlight: (text: string) => pc.cyan(text),
  muted: (text: string) => pc.gray(text),

  // Route type colors
  troncal: (text: string) => pc.red(text),
  alimentador: (text: string) => pc.green(text),
  complementario: (text: string) => pc.blue(text),
  especial: (text: string) => pc.yellow(text),
};

// Helper to disable colors
export function disableColors() {
  pc.createColors({ useColor: false });
}

// Helper to check if stdout supports colors
export function supportsColor(): boolean {
  return process.stdout.isTTY ?? false;
}
