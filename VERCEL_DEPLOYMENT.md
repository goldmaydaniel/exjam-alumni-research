# 🚀 ExJAM Alumni Registration - Vercel Deployment Guide

## Quick Deploy (2 Minutes)

### Option 1: Automatic Deployment Script
```bash
./deploy-vercel.sh
```

### Option 2: Manual Deployment
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## 📋 Pre-Deployment Checklist

✅ **Files Ready:**
- `index.html` - Main registration page
- `styles.css` - Professional styling
- `script.js` - Interactive features
- `vercel.json` - Vercel configuration
- `package.json` - Project metadata

## 🎯 Deployment Steps

### 1. First-Time Setup
```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login
```

### 2. Deploy Your Site
```bash
# Navigate to project directory
cd /Users/goldmay/exjam-alumni-research

# Deploy (follow prompts)
vercel
```

When prompted:
- **Setup and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No (first time) / Yes (updates)
- **Project name?** → exjam-alumni-registration (or custom)
- **Directory?** → ./ (current directory)
- **Override settings?** → No

## 🌐 Your Live URLs

After deployment, you'll get:
- **Preview URL:** `https://exjam-alumni-registration-[hash].vercel.app`
- **Production URL:** `https://exjam-alumni-registration.vercel.app`

## 🎨 Custom Domain Setup

### Add Your Domain
```bash
# Add custom domain
vercel domains add alumni.exjam.org

# Or use Vercel Dashboard
# https://vercel.com/dashboard
```

### DNS Configuration
Add these records to your domain:
- **Type:** A
- **Name:** @
- **Value:** 76.76.21.21

Or for subdomain:
- **Type:** CNAME
- **Name:** register
- **Value:** cname.vercel-dns.com

## 🔧 Environment Variables (Optional)

```bash
# Add environment variable
vercel env add FORM_ID

# List all env vars
vercel env ls
```

## 📊 Useful Commands

```bash
# View deployments
vercel list

# View logs
vercel logs

# Remove deployment
vercel remove [deployment-url]

# Get deployment info
vercel inspect [deployment-url]

# Redeploy
vercel --prod
```

## 🚀 Continuous Deployment

### Connect to GitHub (Recommended)
1. Push code to GitHub
2. Import project in Vercel Dashboard
3. Auto-deploy on every push

```bash
# Initialize git (if needed)
git init
git add .
git commit -m "Initial ExJAM registration site"
git remote add origin https://github.com/[your-username]/exjam-registration
git push -u origin main
```

## 📱 Features Included

✅ **Free Hosting** - No cost for personal/hobby use
✅ **SSL Certificate** - Automatic HTTPS
✅ **Global CDN** - Fast worldwide access
✅ **Auto-scaling** - Handles traffic spikes
✅ **Analytics** - Built-in visitor tracking
✅ **Preview Deployments** - Test before production

## 🆘 Troubleshooting

### Issue: Command not found
```bash
npm install -g vercel
```

### Issue: Authentication failed
```bash
vercel logout
vercel login
```

### Issue: Build failed
Check `vercel.json` configuration is correct

### Issue: 404 errors
Ensure all files are in the root directory

## 📞 Support

- **Vercel Docs:** https://vercel.com/docs
- **Status Page:** https://vercel-status.com
- **Community:** https://github.com/vercel/vercel/discussions

## 🎉 Success Checklist

After deployment, verify:
- [ ] Site loads at deployment URL
- [ ] Google Form embeds correctly
- [ ] Mobile responsive design works
- [ ] All links function properly
- [ ] Images and styles load
- [ ] Form submissions work

## 🔄 Updating Your Site

```bash
# Make changes to files
# Then redeploy:
vercel --prod

# Or use npm script:
npm run deploy
```

---

**Need help?** The deployment script handles everything automatically:
```bash
./deploy-vercel.sh
```

Your ExJAM Alumni Registration site will be live in under 2 minutes! 🚀