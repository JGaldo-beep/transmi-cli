// Cache manager with TTL support for Transmilenio CLI

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { CACHE_DIR, CACHE_TTL } from '@config/constants.js';
import { CacheError } from '@lib/errors.js';
import { logger } from '@lib/logger.js';

export type CacheKey = keyof typeof CACHE_TTL;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // in milliseconds
}

export class CacheManager {
  private cacheDir: string;

  constructor(baseDir?: string) {
    this.cacheDir = baseDir || CACHE_DIR;
    this.ensureCacheDir();
  }

  /**
   * Ensure cache directory exists
   */
  private ensureCacheDir(): void {
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
      logger.debug(`Created cache directory: ${this.cacheDir}`);
    }
  }

  /**
   * Get cache file path for a key
   */
  private getCachePath(key: string): string {
    // Sanitize key to be filesystem-safe
    const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '_');
    return join(this.cacheDir, `${safeKey}.json`);
  }

  /**
   * Check if a cache entry exists and is valid
   */
  async has(key: string): Promise<boolean> {
    const path = this.getCachePath(key);

    if (!existsSync(path)) {
      return false;
    }

    try {
      const entry = this.readEntry(path);
      return this.isValid(entry);
    } catch {
      return false;
    }
  }

  /**
   * Get value from cache if exists and valid
   */
  async get<T>(key: string): Promise<T | null> {
    const path = this.getCachePath(key);

    if (!existsSync(path)) {
      logger.debug(`Cache miss: ${key}`);
      return null;
    }

    try {
      const entry = this.readEntry<T>(path);

      if (!this.isValid(entry)) {
        logger.debug(`Cache expired: ${key}`);
        await this.delete(key);
        return null;
      }

      logger.debug(`Cache hit: ${key}`);
      return entry.data;
    } catch (error) {
      logger.error(`Error reading cache for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttlMinutes?: number): Promise<void> {
    const path = this.getCachePath(key);

    const ttl = ttlMinutes !== undefined ? ttlMinutes * 60 * 1000 : this.getDefaultTTL(key);

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
    };

    try {
      this.writeEntry(path, entry);
      logger.debug(`Cache set: ${key} (TTL: ${ttl / 1000 / 60} minutes)`);
    } catch (error) {
      throw new CacheError('CACHE_WRITE_ERROR', `Failed to write cache for ${key}`, error);
    }
  }

  /**
   * Delete a cache entry
   */
  async delete(key: string): Promise<void> {
    const path = this.getCachePath(key);

    if (existsSync(path)) {
      try {
        unlinkSync(path);
        logger.debug(`Cache deleted: ${key}`);
      } catch (error) {
        throw new CacheError('CACHE_DELETE_ERROR', `Failed to delete cache for ${key}`, error);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      const files = readdirSync(this.cacheDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          unlinkSync(join(this.cacheDir, file));
        }
      }

      logger.info('Cache cleared');
    } catch (error) {
      throw new CacheError('CACHE_CLEAR_ERROR', 'Failed to clear cache', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    totalSize: number;
  }> {
    const files = readdirSync(this.cacheDir).filter((f) => f.endsWith('.json'));

    let validEntries = 0;
    let expiredEntries = 0;
    let totalSize = 0;

    for (const file of files) {
      const path = join(this.cacheDir, file);
      try {
        const stats = Bun.file(path);
        totalSize += stats.size;

        const entry = this.readEntry(path);
        if (this.isValid(entry)) {
          validEntries++;
        } else {
          expiredEntries++;
        }
      } catch {
        expiredEntries++;
      }
    }

    return {
      totalEntries: files.length,
      validEntries,
      expiredEntries,
      totalSize,
    };
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<number> {
    const files = readdirSync(this.cacheDir).filter((f) => f.endsWith('.json'));
    let cleaned = 0;

    for (const file of files) {
      const path = join(this.cacheDir, file);
      try {
        const entry = this.readEntry(path);
        if (!this.isValid(entry)) {
          unlinkSync(path);
          cleaned++;
        }
      } catch {
        // If we can't read it, delete it
        unlinkSync(path);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} expired cache entries`);
    }

    return cleaned;
  }

  /**
   * Read cache entry from file
   */
  private readEntry<T>(path: string): CacheEntry<T> {
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Write cache entry to file
   */
  private writeEntry<T>(path: string, entry: CacheEntry<T>): void {
    writeFileSync(path, JSON.stringify(entry, null, 2), 'utf-8');
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    const age = Date.now() - entry.timestamp;
    return age < entry.ttl;
  }

  /**
   * Get default TTL for a cache key
   */
  private getDefaultTTL(key: string): number {
    // Try to match key to CACHE_TTL configuration
    for (const [cacheKey, ttlMinutes] of Object.entries(CACHE_TTL)) {
      if (key.includes(cacheKey)) {
        return ttlMinutes * 60 * 1000; // Convert to milliseconds
      }
    }

    // Default to 1 hour if no match
    return 60 * 60 * 1000;
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
