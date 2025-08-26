# 🚀 Vercel + Supabase Deployment Guide

## Pre-deployment Setup

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Link Project (First Time)

```bash
vercel link
```

## Environment Variables Setup

### Required Production Environment Variables:

```bash
# Set these in Vercel Dashboard or via CLI:

# Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Database
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production

# Authentication
vercel env add JWT_SECRET production

# Email Service
vercel env add RESEND_API_KEY production
vercel env add RESEND_FROM_EMAIL production

# Payment Gateway
vercel env add PAYSTACK_SECRET_KEY production
vercel env add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY production

# Organization Details
vercel env add NEXT_PUBLIC_ORG_NAME production
vercel env add NEXT_PUBLIC_ORG_EMAIL production
vercel env add NEXT_PUBLIC_ORG_PHONE production

# Banking Details
vercel env add NEXT_PUBLIC_BANK_NAME production
vercel env add NEXT_PUBLIC_ACCOUNT_NAME production
vercel env add NEXT_PUBLIC_ACCOUNT_NUMBER production

# Application URLs
vercel env add NEXT_PUBLIC_URL production
vercel env add NEXT_PUBLIC_APP_URL production

# Optional: Cron Jobs
vercel env add CRON_SECRET production
```

## Deployment Commands

### Deploy to Preview

```bash
vercel
```

### Deploy to Production

```bash
vercel --prod
```

### Deploy with Environment Variables

```bash
vercel --prod -e NODE_ENV=production
```

## Post-deployment Verification

### 1. Health Check

```bash
curl https://your-domain.vercel.app/api/health
```

### 2. Test Database Connection

```bash
curl https://your-domain.vercel.app/api/events
```

### 3. Monitor Logs

```bash
vercel logs your-deployment-url
```

## Configuration Files

- ✅ `vercel.json` - Deployment configuration
- ✅ `next.config.js` - Next.js optimization
- ✅ `middleware.ts` - Authentication & routing
- ✅ Health endpoints at `/api/health`
- ✅ Cron cleanup at `/api/admin/cleanup`

## Domain Setup

### Custom Domain

```bash
vercel domains add your-domain.com
vercel domains verify your-domain.com
```

### SSL Certificate

Vercel automatically provisions SSL certificates for all domains.

## Performance Optimizations Enabled

- **Edge regions**: `cle1`, `iad1`
- **Function timeouts**: 30s (60s for admin)
- **Static asset caching**: 1 year
- **API response caching**: 59s stale-while-revalidate
- **Image optimization**: Next.js built-in
- **Analytics**: Vercel Analytics + Speed Insights

## Monitoring

- Health endpoint: `/healthz` → `/api/health`
- Cron cleanup: Daily at 2 AM UTC
- Performance tracking: Vercel Analytics
- Error tracking: Built-in Next.js error boundaries

## Troubleshooting

### Build Failures

```bash
# Local build test
npm run build

# Debug build
vercel --debug
```

### Environment Issues

```bash
# List environment variables
vercel env ls

# Pull environment to local
vercel env pull .env.local
```

### Database Issues

- Ensure `DATABASE_URL` uses direct connection (not pooler)
- Verify Supabase project is accessible from Vercel
- Check RLS policies for API access

## Security Checklist

- ✅ Environment variables secured in Vercel
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ HTTPS enforced
- ✅ Authentication middleware active
- ✅ Database RLS policies active
