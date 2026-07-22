// Output formatting utilities for Transmilenio CLI

import { colors } from './colors.js';

/**
 * Format a box around text
 */
export function formatBox(content: string, title?: string): string {
  const lines = content.split('\n');
  const maxLength = Math.max(...lines.map((l) => l.length), title?.length || 0);
  const width = maxLength + 4;

  let output = '';

  // Top border
  if (title) {
    const padding = Math.max(0, width - title.length - 4);
    const leftPad = Math.floor(padding / 2);
    const rightPad = Math.ceil(padding / 2);
    output += `┌─${' '.repeat(leftPad)}${title}${' '.repeat(rightPad)}─┐\n`;
  } else {
    output += `┌${'─'.repeat(width - 2)}┐\n`;
  }

  // Content
  for (const line of lines) {
    const padding = width - line.length - 4;
    output += `│ ${line}${' '.repeat(padding)} │\n`;
  }

  // Bottom border
  output += `└${'─'.repeat(width - 2)}┘`;

  return output;
}

/**
 * Format a simple table
 */
export function formatTable(
  data: Array<Record<string, string | number>>,
  columns?: string[]
): string {
  if (data.length === 0) return '';

  const cols = columns || Object.keys(data[0]);
  const widths = cols.map((col) => {
    const values = data.map((row) => String(row[col] || ''));
    return Math.max(col.length, ...values.map((v) => v.length));
  });

  let output = '';

  // Header
  output += '┌';
  output += widths.map((w) => '─'.repeat(w + 2)).join('┬');
  output += '┐\n';

  output += '│';
  output += cols.map((col, i) => ` ${col.padEnd(widths[i])} `).join('│');
  output += '│\n';

  // Separator
  output += '├';
  output += widths.map((w) => '─'.repeat(w + 2)).join('┼');
  output += '┤\n';

  // Rows
  for (const row of data) {
    output += '│';
    output += cols.map((col, i) => ` ${String(row[col] || '').padEnd(widths[i])} `).join('│');
    output += '│\n';
  }

  // Bottom
  output += '└';
  output += widths.map((w) => '─'.repeat(w + 2)).join('┴');
  output += '┘';

  return output;
}

/**
 * Format a bulleted list
 */
export function formatList(items: string[], numbered = false): string {
  return items
    .map((item, i) => {
      const prefix = numbered ? `${i + 1}.` : '•';
      return `${prefix} ${item}`;
    })
    .join('\n');
}

/**
 * Format money in COP
 */
export function formatMoney(amount: number, currency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

/**
 * Format distance in kilometers
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Create a progress bar
 */
export function progressBar(current: number, total: number, width = 20): string {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  const filled = Math.round((width * percentage) / 100);
  const empty = width - filled;

  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `${bar} ${percentage.toFixed(0)}%`;
}
