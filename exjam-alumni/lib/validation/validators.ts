/**
 * Comprehensive Input Validation System
 * Provides sanitization and validation for all user inputs
 */

import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import { logger } from '@/lib/logging/logger'

/**
 * Custom Zod validators for security
 */

// Safe string validator (prevents XSS)
export const safeString = (maxLength: number = 255) => 
  z.string()
    .max(maxLength)
    .transform(val => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] }))

// Email validator with additional security checks
export const secureEmail = z.string()
  .email('Invalid email format')
  .max(320) // RFC 5321 limit
  .toLowerCase()
  .refine(email => {
    // Block potentially malicious patterns
    const maliciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /<script/i,
      /\0/g // null bytes
    ]
    return !maliciousPatterns.some(pattern => pattern.test(email))
  }, 'Email contains invalid characters')

// Password validator with strength requirements
export const strongPassword = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .refine(password => {
    // At least one uppercase, one lowercase, one digit, one special char
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
  }, 'Password must contain uppercase, lowercase, number, and special character')
  .refine(password => {
    // Check for common weak patterns
    const weakPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /(.)\1{3,}/, // 4+ repeated characters
      /^(.{1,2})\1+$/ // repeated short patterns
    ]
    return !weakPatterns.some(pattern => pattern.test(password))
  }, 'Password is too weak - avoid common patterns')

// URL validator with security checks
export const secureUrl = z.string()
  .url('Invalid URL format')
  .max(2048) // Common URL length limit
  .refine(url => {
    try {
      const parsed = new URL(url)
      // Only allow http and https
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false
      }
      // Block localhost/private IPs in production
      if (process.env.NODE_ENV === 'production') {
        const hostname = parsed.hostname.toLowerCase()
        if (
          hostname === 'localhost' ||
          hostname.startsWith('127.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('192.168.') ||
          hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
        ) {
          return false
        }
      }
      return true
    } catch {
      return false
    }
  }, 'URL is not allowed')

// Phone number validator
export const phoneNumber = z.string()
  .regex(/^\+?[\d\s\-\(\)\.]+$/, 'Invalid phone number format')
  .min(10, 'Phone number too short')
  .max(20, 'Phone number too long')
  .transform(phone => phone.replace(/[\s\-\(\)\.]/g, '')) // Remove formatting

// SQL injection prevention for search terms
export const searchTerm = z.string()
  .max(100)
  .transform(term => 
    DOMPurify.sanitize(term.trim(), { ALLOWED_TAGS: [] })
  )
  .refine(term => {
    // Block SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /['"`;\\]/,
      /--/,
      /\/\*/,
      /\*\//,
      /\bOR\s+\d+\s*=\s*\d+/i,
      /\bAND\s+\d+\s*=\s*\d+/i
    ]
    return !sqlPatterns.some(pattern => pattern.test(term))
  }, 'Search term contains invalid characters')

// File name validator
export const fileName = z.string()
  .max(255)
  .refine(name => {
    // Block dangerous file extensions
    const dangerousExts = [
      '.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js', '.jar',
      '.com', '.scf', '.lnk', '.inf', '.reg', '.php', '.asp', '.jsp'
    ]
    const lowerName = name.toLowerCase()
    return !dangerousExts.some(ext => lowerName.endsWith(ext))
  }, 'File type not allowed')
  .refine(name => {
    // Block path traversal
    return !name.includes('..') && !name.includes('/')
  }, 'Invalid file name')

// HTML content validator (for rich text)
export const richText = (maxLength: number = 10000) =>
  z.string()
    .max(maxLength)
    .transform(html => {
      // Allow safe HTML tags only
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'a'
        ],
        ALLOWED_ATTR: ['href', 'title'],
        ALLOWED_URI_REGEXP: /^https?:\/\//
      })
    })

// ID validator (UUIDs, numeric IDs)
export const validId = z.string()
  .refine(id => {
    // UUID v4 format or numeric ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const numericRegex = /^\d+$/
    return uuidRegex.test(id) || numericRegex.test(id)
  }, 'Invalid ID format')

/**
 * Common validation schemas
 */

// User registration schema
export const userRegistrationSchema = z.object({
  firstName: safeString(50).min(1, 'First name is required'),
  lastName: safeString(50).min(1, 'Last name is required'),
  email: secureEmail,
  password: strongPassword,
  confirmPassword: z.string(),
  graduationYear: z.coerce.number()
    .int()
    .min(1980, 'Invalid graduation year')
    .max(new Date().getFullYear() + 10, 'Invalid graduation year')
    .optional(),
  squadron: z.enum(['GREEN', 'RED', 'PURPLE', 'YELLOW', 'DORNIER', 'PUMA']).optional(),
  phoneNumber: phoneNumber.optional(),
  termsAccepted: z.boolean().refine(val => val === true, 'Terms must be accepted')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

// Contact form schema
export const contactFormSchema = z.object({
  name: safeString(100).min(1, 'Name is required'),
  email: secureEmail,
  subject: safeString(200).min(1, 'Subject is required'),
  message: safeString(2000).min(10, 'Message must be at least 10 characters'),
  honeypot: z.string().max(0) // Bot trap field
})

// Event creation schema
export const eventSchema = z.object({
  title: safeString(200).min(1, 'Title is required'),
  description: richText(5000).optional(),
  shortDescription: safeString(500).optional(),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  venue: safeString(200).min(1, 'Venue is required'),
  address: safeString(500).optional(),
  capacity: z.coerce.number().int().positive('Capacity must be positive'),
  price: z.coerce.number().nonnegative('Price cannot be negative'),
  imageUrl: secureUrl.optional(),
  tags: z.array(safeString(50)).max(10, 'Maximum 10 tags allowed').default([])
}).refine(data => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return start < end
}, {
  message: 'End date must be after start date',
  path: ['endDate']
})

// Profile update schema
export const profileUpdateSchema = z.object({
  firstName: safeString(50).optional(),
  lastName: safeString(50).optional(),
  bio: safeString(1000).optional(),
  company: safeString(100).optional(),
  jobTitle: safeString(100).optional(),
  location: safeString(100).optional(),
  linkedinUrl: secureUrl.optional(),
  websiteUrl: secureUrl.optional(),
  phoneNumber: phoneNumber.optional(),
  skills: z.array(safeString(50)).max(20, 'Maximum 20 skills allowed').default([]),
  interests: z.array(safeString(50)).max(20, 'Maximum 20 interests allowed').default([])
})

/**
 * Validation middleware
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const validData = schema.parse(data)
    return { success: true, data: validData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Log validation failure for security monitoring
      logger.security('Input validation failed', {
        errors: error.flatten(),
        inputKeys: typeof data === 'object' && data ? Object.keys(data) : []
      })
      
      return { success: false, errors: error }
    }
    throw error
  }
}

/**
 * Sanitization utilities
 */
export const sanitize = {
  // Remove all HTML tags
  stripHtml: (input: string): string => 
    DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }),
  
  // Keep only safe HTML
  html: (input: string): string =>
    DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a'],
      ALLOWED_ATTR: ['href']
    }),
  
  // SQL-safe string (for raw queries, though Prisma should handle this)
  sql: (input: string): string =>
    input.replace(/['"`;\\]/g, '').replace(/--/g, '').replace(/\/\*/g, ''),
  
  // Filename safe
  filename: (input: string): string =>
    input.replace(/[^a-zA-Z0-9._-]/g, '').substring(0, 255),
  
  // URL-safe slug
  slug: (input: string): string =>
    input
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')
}

/**
 * Content Security Policy helpers
 */
export const CSP = {
  // Generate nonce for inline scripts
  generateNonce: (): string => {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    return Buffer.from(bytes).toString('base64')
  },
  
  // Build CSP header
  buildHeader: (nonce?: string): string => {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.vercel-insights.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'"
    ]
    
    if (nonce) {
      directives[1] = `script-src 'self' 'nonce-${nonce}' https://cdn.vercel-insights.com https://va.vercel-scripts.com`
    }
    
    return directives.join('; ')
  }
}

export default {
  safeString,
  secureEmail,
  strongPassword,
  secureUrl,
  phoneNumber,
  searchTerm,
  fileName,
  richText,
  validId,
  userRegistrationSchema,
  contactFormSchema,
  eventSchema,
  profileUpdateSchema,
  validateInput,
  sanitize,
  CSP
}