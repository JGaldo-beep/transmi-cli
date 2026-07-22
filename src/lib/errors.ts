// Custom error classes for Transmilenio CLI

export class TransmiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'TransmiError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class NetworkError extends TransmiError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, details);
    this.name = 'NetworkError';
  }
}

export class ScrapingError extends TransmiError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, details);
    this.name = 'ScrapingError';
  }
}

export class ValidationError extends TransmiError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends TransmiError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, details);
    this.name = 'NotFoundError';
  }
}

export class CacheError extends TransmiError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, details);
    this.name = 'CacheError';
  }
}
