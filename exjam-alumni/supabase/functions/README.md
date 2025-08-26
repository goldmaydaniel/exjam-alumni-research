# Supabase Edge Functions

This directory contains Supabase Edge Functions for the EXJAM Alumni application. These functions provide server-side functionality that runs on Supabase's global edge network.

## Available Functions

### 1. send-notification

**Purpose**: Send notifications (email, SMS, push) to users
**Endpoint**: `/functions/v1/send-notification`
**Methods**: POST
**Features**:

- Email notifications with HTML templates
- Template variable substitution
- Support for multiple notification types
- Integration with Resend API

**Example Usage**:

```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    type: "email",
    recipient: "user@example.com",
    template: "registration-confirmation",
    data: {
      firstName: "John",
      lastName: "Doe",
      ticketId: "EXJAM2025-12345",
      amount: "50000",
    },
  }),
});
```

### 2. generate-badge

**Purpose**: Generate event badges with QR codes
**Endpoint**: `/functions/v1/generate-badge`
**Methods**: POST
**Features**:

- SVG badge generation
- QR code integration
- Participant information display
- Event-specific branding

**Example Usage**:

```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-badge`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    registrationId: "reg-12345",
  }),
});
```

### 3. check-in

**Purpose**: Handle event check-ins via QR code or manual entry
**Endpoint**: `/functions/v1/check-in`
**Methods**: GET, POST
**Features**:

- QR code validation
- Manual check-in support
- Payment status verification
- Check-in logging

**Example Usage**:

```javascript
// Check-in with QR code
const response = await fetch(`${SUPABASE_URL}/functions/v1/check-in`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    qrData: '{"registrationId":"reg-12345","userId":"user-123"}',
    location: "Main Entrance",
    adminId: "admin-456",
  }),
});
```

### 4. analytics

**Purpose**: Generate analytics and reports
**Endpoint**: `/functions/v1/analytics`
**Methods**: GET, POST
**Features**:

- Registration statistics
- Payment analytics
- Daily registration trends
- Event-specific metrics

**Example Usage**:

```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/analytics?eventId=event-123`, {
  headers: {
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  },
});
```

### 5. payment-webhook

**Purpose**: Handle payment provider webhooks (Paystack)
**Endpoint**: `/functions/v1/payment-webhook`
**Methods**: POST
**Features**:

- Webhook signature verification
- Payment status updates
- Automatic confirmation emails
- Error handling

**Example Usage**:

```javascript
// This is typically called by Paystack
const response = await fetch(`${SUPABASE_URL}/functions/v1/payment-webhook`, {
  method: "POST",
  headers: {
    "x-paystack-signature": "webhook-signature",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    event: "charge.success",
    data: {
      reference: "payment-ref-123",
      amount: 5000000,
      status: "success",
    },
  }),
});
```

### 6. sync-user-data

**Purpose**: Synchronize user data between auth and application tables
**Endpoint**: `/functions/v1/sync-user-data`
**Methods**: GET, POST
**Features**:

- User creation and updates
- Auth user synchronization
- Batch processing
- Sync status reporting

**Example Usage**:

```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/sync-user-data`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    action: "create",
    userData: {
      email: "user@example.com",
      first_name: "John",
      last_name: "Doe",
    },
  }),
});
```

## Setup and Deployment

### Prerequisites

1. Supabase CLI installed (`npm install -g supabase`)
2. Project configured with `supabase init`
3. Environment variables set in `.env.local`

### Environment Variables Required

```env
RESEND_API_KEY=your_resend_api_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Deployment Commands

```bash
# Deploy all functions
npm run functions:deploy

# Test functions
npm run functions:test

# Deploy individual function
supabase functions deploy send-notification

# View function logs
supabase functions logs send-notification
```

### Setting Secrets

In production, set these secrets via Supabase dashboard or CLI:

```bash
supabase secrets set RESEND_API_KEY="your_key"
supabase secrets set PAYSTACK_SECRET_KEY="your_key"
supabase secrets set SUPABASE_URL="your_url"
supabase secrets set SUPABASE_ANON_KEY="your_key"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_key"
```

## Testing

Run the test suite to verify all functions are working:

```bash
npm run functions:test
```

This will test:

- Function availability
- Basic functionality
- Error handling
- Authentication

## Security Notes

1. **Authentication**: Most functions require authentication via Bearer token
2. **Service Role**: Admin functions use service role key for elevated permissions
3. **Webhook Security**: Payment webhooks verify signatures to prevent tampering
4. **CORS**: All functions include proper CORS headers
5. **Input Validation**: Functions validate input data and return appropriate errors

## Troubleshooting

### Common Issues

1. **Function not found**: Ensure function is deployed correctly
2. **Authentication failed**: Check if correct API key is being used
3. **CORS errors**: Verify CORS headers are properly set
4. **Timeout**: Check function logs for performance issues

### Debugging

```bash
# View function logs
supabase functions logs function-name --follow

# Test locally (requires Docker)
supabase functions serve

# Debug with local development
supabase start
```

## File Structure

```
supabase/functions/
├── _shared/
│   ├── cors.ts          # CORS headers
│   ├── supabase.ts      # Supabase client utilities
│   └── utils.ts         # Common utilities
├── send-notification/
│   └── index.ts
├── generate-badge/
│   └── index.ts
├── check-in/
│   └── index.ts
├── analytics/
│   └── index.ts
├── payment-webhook/
│   └── index.ts
└── sync-user-data/
    └── index.ts
```

## Contributing

When adding new functions:

1. Create a new directory under `supabase/functions/`
2. Add `index.ts` file with proper imports from `_shared/`
3. Include proper error handling and logging
4. Update this README with documentation
5. Add test cases to `scripts/test-edge-functions.js`
6. Test locally before deployment
