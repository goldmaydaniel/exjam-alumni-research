# ExJAM Alumni - Complete Deployment Guide

This guide covers all deployment options for the ExJAM Alumni platform, from simple Vercel deployment to full containerized production setups.

## 📋 Table of Contents

1. [Quick Deployment (Vercel)](#quick-deployment-vercel)
2. [Docker Deployment](#docker-deployment)
3. [Manual Server Deployment](#manual-server-deployment)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

## 🚀 Quick Deployment (Vercel)

### Prerequisites
- GitHub account with this repository
- Vercel account
- Supabase project set up

### Steps

1. **Deploy to Vercel**
   ```bash
   # Clone and deploy
   git clone https://github.com/your-username/exjam-alumni.git
   cd exjam-alumni
   
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel
   ```

2. **Configure Environment Variables**
   
   In your Vercel dashboard, add these environment variables:
   
   ```bash
   # Database
   DATABASE_URL="your-supabase-db-url"
   DIRECT_URL="your-supabase-direct-url"
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   
   # Auth
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="your-vercel-url"
   ```

3. **Setup Database**
   ```bash
   # Run migrations
   npx prisma migrate deploy
   
   # Apply performance indexes
   psql "$DATABASE_URL" -f prisma/migrations/add_performance_indexes.sql
   ```

## 🐳 Docker Deployment

### Prerequisites
- Docker and Docker Compose installed
- Domain name (optional but recommended)
- SSL certificates (for HTTPS)

### Development Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/exjam-alumni.git
   cd exjam-alumni
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.production.example .env.production.local
   
   # Edit with your values
   nano .env.production.local
   ```

3. **Start Services**
   ```bash
   # Start all services
   docker-compose up -d
   
   # View logs
   docker-compose logs -f app
   
   # Stop services
   docker-compose down
   ```

### Production Setup

1. **Prepare Environment**
   ```bash
   # Create production environment file
   cp .env.production.example .env.production
   
   # Generate strong secrets
   openssl rand -base64 32  # For NEXTAUTH_SECRET
   openssl rand -base64 32  # For JWT_SECRET
   ```

2. **SSL Configuration**
   ```bash
   # Create SSL directory
   mkdir -p nginx/ssl
   
   # Add your SSL certificates
   cp your-domain.crt nginx/ssl/
   cp your-domain.key nginx/ssl/
   ```

3. **Deploy with Monitoring**
   ```bash
   # Start with monitoring stack
   docker-compose --profile monitoring up -d
   
   # Check service health
   docker-compose ps
   ```

## 🖥️ Manual Server Deployment

### Prerequisites
- Ubuntu 20.04+ or similar Linux server
- Node.js 18+
- PostgreSQL 15+
- Nginx
- PM2 (for process management)

### Server Setup

1. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib
   
   # Install Nginx
   sudo apt install nginx
   
   # Install PM2
   sudo npm install -g pm2
   ```

2. **Database Setup**
   ```bash
   # Create database user
   sudo -u postgres createuser --interactive
   
   # Create database
   sudo -u postgres createdb exjam_alumni
   ```

3. **Application Deployment**
   ```bash
   # Clone repository
   cd /opt
   sudo git clone https://github.com/your-username/exjam-alumni.git
   cd exjam-alumni
   
   # Install dependencies
   npm ci --production
   
   # Configure environment
   sudo cp .env.production.example .env.production
   sudo nano .env.production
   
   # Run deployment setup
   chmod +x scripts/deploy-setup.sh
   ./scripts/deploy-setup.sh
   
   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 startup
   pm2 save
   ```

4. **Nginx Configuration**
   ```bash
   # Copy nginx config
   sudo cp nginx/nginx.conf /etc/nginx/sites-available/exjam-alumni
   sudo ln -s /etc/nginx/sites-available/exjam-alumni /etc/nginx/sites-enabled/
   
   # Test and reload
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## 🔧 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ0eXAiOiJKV1QiLCJ...` |
| `NEXTAUTH_SECRET` | Authentication secret | `your-secret-key` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level | `info` |
| `RATE_LIMIT_MAX` | Rate limit max requests | `100` |
| `CACHE_TTL` | Cache TTL in seconds | `3600` |

### Security Best Practices

- **Use strong, unique secrets** for all authentication keys
- **Enable HTTPS** in production
- **Restrict database access** to application servers only
- **Use environment-specific configurations**
- **Regularly rotate secrets**

## 🗄️ Database Setup

### Supabase Setup (Recommended)

1. **Create Supabase Project**
   - Visit [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and API keys

2. **Configure Database**
   ```sql
   -- Enable necessary extensions
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";
   ```

3. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   psql "$DATABASE_URL" -f prisma/migrations/add_performance_indexes.sql
   ```

### Self-Hosted PostgreSQL

1. **Install PostgreSQL**
   ```bash
   sudo apt install postgresql postgresql-contrib
   ```

2. **Create Database**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE exjam_alumni;
   CREATE USER exjam_user WITH ENCRYPTED PASSWORD 'your-password';
   GRANT ALL PRIVILEGES ON DATABASE exjam_alumni TO exjam_user;
   \\q
   ```

3. **Configure Connection**
   ```bash
   DATABASE_URL="postgresql://exjam_user:your-password@localhost:5432/exjam_alumni"
   ```

## 📊 Monitoring & Maintenance

### Health Checks

The application provides several health check endpoints:

- `GET /api/health` - Basic health check
- `GET /api/admin/monitoring` - System metrics (admin only)
- `GET /api/admin/database?action=health` - Database health

### Performance Monitoring

1. **Built-in Monitoring**
   ```bash
   # Check performance metrics
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
        http://localhost:3000/api/admin/monitoring?type=full
   ```

2. **External Monitoring**
   - Use Vercel Analytics for web vitals
   - Configure Sentry for error tracking
   - Set up Grafana for detailed metrics

### Database Maintenance

1. **Automated Cleanup**
   ```bash
   # Cleanup old data
   curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"action": "full_maintenance", "days": 90}' \
        http://localhost:3000/api/admin/database
   ```

2. **Manual Maintenance**
   ```bash
   # Run performance analysis
   psql "$DATABASE_URL" -c "ANALYZE;"
   
   # Check index usage
   psql "$DATABASE_URL" -f scripts/check-indexes.sql
   ```

### Backup Strategy

1. **Database Backups**
   ```bash
   # Automated backup (in docker-compose)
   docker-compose --profile backup up -d backup
   
   # Manual backup
   pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql
   ```

2. **Application Backups**
   ```bash
   # Backup uploaded files
   tar -czf uploads_$(date +%Y%m%d).tar.gz public/uploads/
   ```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check database connectivity
   npx prisma db execute --stdin <<< "SELECT 1;"
   
   # Verify environment variables
   echo $DATABASE_URL
   ```

2. **Build Failures**
   ```bash
   # Clear cache and rebuild
   rm -rf .next node_modules
   npm install
   npm run build
   ```

3. **Performance Issues**
   ```bash
   # Check system resources
   docker stats
   
   # Monitor application logs
   docker-compose logs -f app
   ```

### Debug Mode

Enable debug logging in development:

```bash
DEBUG=true LOG_LEVEL=debug npm run dev
```

### Getting Help

- **Documentation**: Check the `/docs` folder
- **Issues**: Create GitHub issues for bugs
- **Performance**: Use the built-in monitoring dashboard
- **Database**: Check Prisma logs for query issues

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load Balancer Setup**
   ```nginx
   upstream app_servers {
       server app1:3000;
       server app2:3000;
       server app3:3000;
   }
   ```

2. **Database Scaling**
   - Use read replicas for read operations
   - Implement connection pooling
   - Consider database sharding for large datasets

3. **Caching Strategy**
   - Implement Redis for session storage
   - Use CDN for static assets
   - Cache API responses where appropriate

### Performance Optimization

1. **Application Level**
   - Enable Next.js optimizations
   - Implement proper caching headers
   - Optimize database queries

2. **Infrastructure Level**
   - Use SSD storage
   - Implement proper monitoring
   - Set up automated scaling

## 🎯 Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Monitoring setup complete

### Post-Deployment

- [ ] Health checks passing
- [ ] SSL certificate working
- [ ] Email delivery tested
- [ ] Payment integration tested
- [ ] Admin access confirmed
- [ ] Backup strategy implemented

### Security Checklist

- [ ] All secrets properly configured
- [ ] HTTPS enforced
- [ ] Security headers implemented
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] CORS properly configured

---

**🎉 Congratulations!** Your ExJAM Alumni platform is now ready for production use.

For additional support or questions, please refer to the project documentation or create an issue in the GitHub repository.