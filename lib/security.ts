/**
 * Security utilities for the EduIT platform
 */

/**
 * Escapes HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitizes an input string or object by stripping common XSS vectors
 */
export function sanitizeInput<T>(input: T): T {
  if (typeof input === 'string') {
    // Remove script tags and their content
    let sanitized = input.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
    // Remove on* event handlers
    sanitized = sanitized.replace(/on\w+="[^"]*"/gim, "");
    sanitized = sanitized.replace(/on\w+='[^']*'/gim, "");
    // Remove javascript: pseudo-protocol
    sanitized = sanitized.replace(/javascript:/gim, "");
    return sanitized as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item)) as unknown as T;
  }

  if (typeof input === 'object' && input !== null) {
    const sanitizedObj: any = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        sanitizedObj[key] = sanitizeInput((input as any)[key]);
      }
    }
    return sanitizedObj as T;
  }

  return input;
}

/**
 * Sanitize metadata for logging to remove sensitive fields
 * @param metadata The metadata object to sanitize
 */
export function sanitizeForLogging(metadata: any): any {
    if (!metadata) return metadata;
    
    const sensitiveFields = ['password', 'token', 'secret', 'creditCard', 'cvv', 'card', 'pin', 'resetCode', 'auth'];
    const sanitized = { ...metadata };
    
    for (const key in sanitized) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
            sanitized[key] = sanitizeForLogging(sanitized[key]);
        }
    }
    
    return sanitized;
}

/**
 * Standard Security Headers for Next.js responses
 */
export const SECURITY_HEADERS = {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://res.cloudinary.com https://eduit.app https://fordestech.com; connect-src 'self' https://vitals.vercel-insights.com;",
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
};
