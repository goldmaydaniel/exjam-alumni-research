# 🛡️ ExJAM Alumni Admin Module Guide

## Overview

The ExJAM Alumni Admin Module provides comprehensive management capabilities for administrators and organizers to manage users, events, registrations, and site configuration.

## 🚀 Quick Start

### 1. Create Admin User

```bash
node create-admin-user-supabase.js
```

Follow the prompts to create your admin account.

### 2. Access Admin Panel

Navigate to: `http://localhost:3000/admin`

Login with your admin credentials.

## 📊 Admin Features

### Dashboard Overview

- **Real-time Statistics**: View user counts, event metrics, and revenue
- **Recent Activity**: Monitor recent registrations and user activity
- **Visual Analytics**: Charts for user growth, registration trends, and event performance

### User Management (`/admin/users`)

- **Search & Filter**: Find users by name, email, role, or status
- **Role Management**: Assign roles (Admin, Organizer, Member, Guest)
- **Email Verification**: Manually verify user emails
- **Bulk Actions**: Export user data, send mass emails
- **User Details**: View registration history and payment records

### Event Management (`/admin/events`)

- **Create Events**: Add new events with full details
- **Edit Events**: Modify event information and settings
- **Registration Management**: View and manage event registrations
- **Capacity Tracking**: Monitor registration vs capacity
- **Event Analytics**: Track performance metrics

### Contact Messages (`/admin/messages`)

- **Message Inbox**: View all contact form submissions
- **Status Tracking**: Mark messages as read/replied
- **Reply System**: Send email replies directly
- **Filter Options**: Sort by status or search content

### Site Configuration (`/admin/site-config`)

- **General Settings**: Site name, contact info, about text
- **Appearance**: Upload logos, set brand colors
- **Features**: Toggle registration, events, payments
- **Email Config**: SMTP settings for notifications
- **Social Links**: Add social media profiles

### Additional Modules

- **Check-In System**: QR code scanning for events
- **Payment Tracking**: Monitor payment transactions
- **Waitlist Management**: Handle event waitlists
- **Audit Logs**: Track all admin actions
- **Storage Management**: Manage uploaded files

## 🔐 Security & Permissions

### Role-Based Access Control (RBAC)

| Role            | Dashboard | Users | Events | Messages | Config |
| --------------- | --------- | ----- | ------ | -------- | ------ |
| ADMIN           | ✅        | ✅    | ✅     | ✅       | ✅     |
| ORGANIZER       | ✅        | View  | ✅     | ✅       | View   |
| VERIFIED_MEMBER | ❌        | ❌    | ❌     | ❌       | ❌     |
| GUEST_MEMBER    | ❌        | ❌    | ❌     | ❌       | ❌     |

### Supabase RLS Policies

All admin tables are protected with Row Level Security:

```sql
-- Example: Only admins can view contact messages
CREATE POLICY "Admins can view all contact messages" ON "ContactMessage"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()::text
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );
```

## 🗄️ Database Tables

### ContactMessage

Stores contact form submissions

- `id`: Unique identifier
- `name`: Sender name
- `email`: Sender email
- `subject`: Message subject
- `message`: Message content
- `status`: pending/read/replied
- `createdAt`: Timestamp

### SiteConfig

Global site configuration (single row)

- `id`: Always 1 (enforced by constraint)
- `site_name`: Website name
- `logos`: Main, footer, favicon URLs
- `colors`: Primary and secondary
- `features`: Enable/disable flags
- `smtp`: Email configuration

### AuditLog

Tracks all admin actions

- `userId`: Admin who performed action
- `action`: Type of action
- `entity`: Affected entity type
- `entityId`: Affected entity ID
- `metadata`: Additional data
- `createdAt`: Timestamp

## 🛠️ Development

### Testing Admin Features

```bash
# Test all admin functionality
node test-admin-supabase.js

# Check database tables
npx prisma studio

# View Supabase logs
supabase db logs
```

### Adding New Admin Features

1. Create the UI component in `/app/(dashboard)/admin/`
2. Add API endpoint in `/app/api/admin/`
3. Update sidebar navigation in `/app/(dashboard)/admin/layout.tsx`
4. Add RLS policies if creating new tables

### API Endpoints

```typescript
// User management
GET    /api/admin/users
PATCH  /api/admin/users/[id]
DELETE /api/admin/users/[id]
POST   /api/admin/users/[id]/verify

// Messages
GET    /api/admin/messages
POST   /api/admin/messages/[id]/read
POST   /api/admin/messages/[id]/reply
DELETE /api/admin/messages/[id]

// Site config
GET    /api/admin/site-config
PUT    /api/admin/site-config
POST   /api/admin/upload-logo

// Export
GET    /api/admin/export/users
GET    /api/admin/export/events
```

## 🚨 Troubleshooting

### Cannot Access Admin Panel

1. Verify user role is ADMIN or ORGANIZER
2. Check authentication token
3. Ensure RLS policies are applied

### Database Connection Issues

```bash
# Test connection
node test-admin-supabase.js

# Reset database
npx prisma db push --force-reset
```

### Missing Tables

```bash
# Apply admin tables
psql $DATABASE_URL -f setup-admin-tables.sql
```

### Permission Denied Errors

```bash
# Fix RLS policies
psql $DATABASE_URL -f fix-admin-tables.sql
```

## 📱 Mobile Responsiveness

The admin panel is fully responsive:

- **Desktop**: Full sidebar + content
- **Tablet**: Collapsible sidebar
- **Mobile**: Bottom navigation

## 🎨 Customization

### Modify Admin Theme

Edit `/app/(dashboard)/admin/layout.tsx`:

```typescript
const sidebarItems = [
  {
    title: "Your Feature",
    icon: YourIcon,
    href: "/admin/your-feature",
  },
  // Add more items
];
```

### Add Custom Statistics

Edit dashboard queries in `/app/(dashboard)/admin/page.tsx`

### Extend User Roles

Add new roles in `prisma/schema.prisma`:

```prisma
enum UserRole {
  GUEST_MEMBER
  VERIFIED_MEMBER
  SPEAKER
  ORGANIZER
  ADMIN
  SUPER_ADMIN // New role
}
```

## 📈 Performance Optimization

- **Pagination**: All lists support pagination
- **Caching**: Dashboard stats cached for 5 minutes
- **Lazy Loading**: Charts load on demand
- **Optimistic Updates**: UI updates before server confirmation

## 🔄 Backup & Recovery

### Export Data

```bash
# Export all users
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/export/users > users.csv

# Backup database
pg_dump $DATABASE_URL > backup.sql
```

### Restore Data

```bash
# Restore from backup
psql $DATABASE_URL < backup.sql
```

## 📞 Support

For issues or questions:

1. Check this guide
2. Review error logs: `npx supabase db logs`
3. Contact: info@exjam.org.ng

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintained By**: ExJAM Technical Team
