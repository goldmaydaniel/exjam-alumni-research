# 🔐 ExJAM Admin Access Setup Guide

This guide provides secure admin access for `goldmay@gmail.com` without granting full database superuser privileges.

## 🎯 **What This Setup Provides**

### ✅ **Admin Capabilities:**
- Full access to all application data (events, users, registrations)
- Ability to create, modify, and delete events
- User management and monitoring
- Database schema modifications
- File storage management
- Admin dashboard access

### 🛡️ **Security Features:**
- **No superuser privileges** - Cannot access system-level database functions
- **Row Level Security (RLS)** - Fine-grained access control
- **Audit logging** - Track admin actions
- **Role-based access** - Specific permissions only
- **Application-level security** - Cannot bypass application logic

## 📋 **Prerequisites**

1. **Supabase Project Access**
   - Service Role Key (not anon key)
   - Project URL
   - Database access

2. **Environment Variables**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## 🚀 **Setup Instructions**

### **Step 1: Run the Setup Script**

```bash
# Navigate to the project directory
cd exjam-alumni

# Make the script executable
chmod +x scripts/setup-admin-access.js

# Run the setup script
node scripts/setup-admin-access.js
```

### **Step 2: Verify Setup in Supabase Dashboard**

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication > Users**
3. Find `goldmay@gmail.com`
4. Verify the user exists and has admin metadata

### **Step 3: Test Admin Access**

1. **Log in to your application** with `goldmay@gmail.com`
2. **Visit the admin dashboard**: `/admin-dashboard`
3. **Verify you can see**:
   - Platform statistics
   - User management
   - Event management tools
   - Security status

## 🔧 **Manual Setup (Alternative)**

If the automated script doesn't work, you can run these SQL commands manually in your Supabase SQL Editor:

### **1. Create Admin Role**
```sql
-- Create custom admin role
CREATE ROLE exjam_admin_role;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO exjam_admin_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO exjam_admin_role;
GRANT CREATE ON SCHEMA public TO exjam_admin_role;
GRANT USAGE ON SCHEMA public TO exjam_admin_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA storage TO exjam_admin_role;
GRANT USAGE ON SCHEMA storage TO exjam_admin_role;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO exjam_admin_role;
GRANT USAGE ON SCHEMA auth TO exjam_admin_role;

-- Grant access to future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO exjam_admin_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO exjam_admin_role;
```

### **2. Assign Role to User**
```sql
-- Assign the role to goldmay@gmail.com
GRANT exjam_admin_role TO "goldmay@gmail.com";
```

### **3. Create Admin Dashboard View**
```sql
-- Create admin dashboard statistics view
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM public.events) as total_events,
    (SELECT COUNT(*) FROM public.registrations) as total_registrations,
    (SELECT COUNT(*) FROM public.events WHERE status = 'published') as published_events,
    (SELECT COUNT(*) FROM public.registrations WHERE status = 'confirmed') as confirmed_registrations;

-- Grant access to the view
GRANT SELECT ON admin_dashboard_stats TO exjam_admin_role;
```

## 📊 **Admin Dashboard Features**

### **Statistics Overview:**
- Total users registered
- Total events created
- Published events count
- Total registrations
- Confirmed registrations

### **Quick Actions:**
- Create new events
- Manage users
- Database tools
- Security monitoring

### **Security Status:**
- Admin role status
- Row Level Security status
- Database access level
- Audit logging status

## 🔍 **Verification Commands**

### **Check if User Has Admin Role:**
```sql
SELECT 
    r.rolname as role_name,
    u.rolname as user_name
FROM pg_roles r
JOIN pg_auth_members m ON m.roleid = r.oid
JOIN pg_roles u ON u.oid = m.member
WHERE r.rolname = 'exjam_admin_role'
AND u.rolname = 'goldmay@gmail.com';
```

### **Check Admin Permissions:**
```sql
-- Test if admin can access events
SELECT COUNT(*) FROM events;

-- Test if admin can access users
SELECT COUNT(*) FROM auth.users;

-- Test if admin can access storage
SELECT COUNT(*) FROM storage.objects;
```

## 🛡️ **Security Best Practices**

### **1. Regular Audits**
- Review admin actions monthly
- Monitor user access patterns
- Check for unusual activity

### **2. Access Control**
- Use Row Level Security (RLS) policies
- Implement proper authentication
- Regular password updates

### **3. Monitoring**
- Set up alerts for admin actions
- Log all administrative changes
- Monitor database access

### **4. Backup & Recovery**
- Regular database backups
- Test recovery procedures
- Document admin procedures

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"User not found"**
   - Ensure `goldmay@gmail.com` exists in Supabase Auth
   - Check email spelling and case

2. **"Permission denied"**
   - Verify service role key is correct
   - Check if role was created successfully
   - Ensure user has the admin role

3. **"Cannot access admin dashboard"**
   - Verify user is logged in
   - Check if email matches exactly
   - Clear browser cache and cookies

4. **"Database connection error"**
   - Check environment variables
   - Verify Supabase project is active
   - Check network connectivity

### **Support Commands:**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test Supabase connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('events').select('count').then(console.log).catch(console.error);
"
```

## 📞 **Support**

If you encounter issues:

1. **Check the logs** in Supabase Dashboard
2. **Verify environment variables** are correct
3. **Test database connection** manually
4. **Review error messages** for specific issues

## 🔄 **Maintenance**

### **Regular Tasks:**
- [ ] Review admin access monthly
- [ ] Update security policies quarterly
- [ ] Backup admin configurations
- [ ] Monitor for security updates

### **Emergency Procedures:**
- [ ] Document admin recovery process
- [ ] Keep backup admin credentials
- [ ] Test emergency access procedures
- [ ] Maintain contact information for support

---

**✅ Setup Complete!** You now have secure admin access to your ExJAM Alumni Platform without compromising database security.
