# 🚀 ExJAM Alumni - Deployment Guide

## ✅ **Current Status**
- ✅ **GitHub Repository**: https://github.com/goldmaydaniel/exjam-alumni-research
- ✅ **Vercel Production**: https://exjam-alumni-e3i1zlcmd-gms-projects-06b0f5db.vercel.app
- ✅ **GitHub Actions**: Configured for automatic deployment

## 🔧 **Automatic Deployment Pipeline**

### **How it works:**
1. **Push to GitHub** → Automatically triggers deployment
2. **GitHub Actions** → Runs tests and builds the app
3. **Vercel** → Deploys the updated version

### **Current Pipeline:**
- **Trigger**: Push to `main` branch
- **Tests**: Runs `npm test`
- **Build**: Runs `npm run build`
- **Deploy**: Automatically deploys to Vercel

## 🌐 **Environment Variables Setup**

### **Required Environment Variables:**
You need to add these to your Vercel project:

1. **Go to**: https://vercel.com/dashboard
2. **Select your project**: `exjam-alumni`
3. **Go to**: Settings → Environment Variables
4. **Add these variables**:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://yzrzjagkkycmdwuhrvww.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Configuration
DATABASE_URL=postgresql://postgres:A7NT3Or3rANhdeqz@db.yzrzjagkkycmdwuhrvww.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:A7NT3Or3rANhdeqz@db.yzrzjagkkycmdwuhrvww.supabase.co:5432/postgres
PRISMA_ACCELERATE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=...

# Payment Configuration
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_eb74eed370c595cef1eefeae04c2777992108707
PAYSTACK_SECRET_KEY=sk_test_eb74eed370c595cef1eefeae04c2777992108707

# Email Configuration
RESEND_API_KEY=re_iL2VeusW_9bnfECzUTDvGziwRqYFmAzkg
RESEND_FROM_EMAIL=onboarding@resend.dev

# Security
JWT_SECRET=exjam-alumni-super-secret-jwt-key-2025-production-ready-secure-token
```

## 🗄️ **Database Setup**

### **Step 1: Create Database Tables**
1. **Go to**: https://supabase.com/dashboard
2. **Select your project**: `yzrzjagkkycmdwuhrvww`
3. **Go to**: SQL Editor
4. **Run this SQL**:

```sql
-- Create Event table
CREATE TABLE IF NOT EXISTS "Event" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "shortDescription" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "venue" TEXT NOT NULL,
  "address" TEXT,
  "capacity" INTEGER NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "earlyBirdPrice" DECIMAL(10,2),
  "earlyBirdDeadline" TIMESTAMP(3),
  "imageUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "organizerId" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- Create PG Conference Event
INSERT INTO "Event" (
  "id", "title", "description", "shortDescription", "startDate", "endDate", 
  "venue", "address", "capacity", "price", "imageUrl", "status", "tags"
) VALUES (
  'pg-conference-2025',
  'President General''s Conference - Maiden Flight',
  'This groundbreaking event marks a new milestone in the history of the ExJAM Association.',
  'A historic gathering of ExJAM alumni, leaders, and stakeholders',
  '2025-11-28 09:00:00+00',
  '2025-11-30 18:00:00+00',
  'NAF Conference Centre, FCT, ABUJA',
  'Nigerian Air Force Conference Centre, Abuja, Federal Capital Territory, Nigeria',
  1000,
  20000.00,
  'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop&crop=center',
  'PUBLISHED',
  ARRAY['conference', 'alumni', 'networking', 'leadership']
) ON CONFLICT ("id") DO NOTHING;
```

## 🔄 **How to Deploy Updates**

### **Automatic Deployment (Recommended):**
1. **Make changes** to your code
2. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
3. **GitHub Actions** will automatically deploy to Vercel

### **Manual Deployment:**
```bash
cd exjam-alumni
vercel --prod
```

## 📊 **Monitoring & Analytics**

### **Vercel Dashboard:**
- **URL**: https://vercel.com/dashboard
- **Features**: Deployment history, performance metrics, logs

### **GitHub Actions:**
- **URL**: https://github.com/goldmaydaniel/exjam-alumni-research/actions
- **Features**: Build logs, test results, deployment status

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Build Fails**:
   - Check GitHub Actions logs
   - Verify environment variables are set
   - Ensure all dependencies are installed

2. **Database Connection Issues**:
   - Verify Supabase credentials
   - Check if database tables exist
   - Test connection in Supabase dashboard

3. **Environment Variables Missing**:
   - Go to Vercel dashboard
   - Add missing variables
   - Redeploy the project

## 📞 **Support**

If you encounter issues:
1. **Check the logs** in Vercel dashboard
2. **Review GitHub Actions** for build errors
3. **Verify environment variables** are correctly set
4. **Test database connection** in Supabase

## 🎉 **Success!**

Your ExJAM Alumni platform is now:
- ✅ **Automatically deployed** from GitHub
- ✅ **Production ready** on Vercel
- ✅ **Monitored** with GitHub Actions
- ✅ **Scalable** and **secure**

**Live URL**: https://exjam-alumni-e3i1zlcmd-gms-projects-06b0f5db.vercel.app
