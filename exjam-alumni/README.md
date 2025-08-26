# ExJAM Alumni Event System

A comprehensive event management and alumni registration system built with Next.js 15, TypeScript, and Supabase.

## Features

- 🎫 **Event Management**: Create and manage alumni events with registration
- 👤 **User Authentication**: Secure registration and login system
- 💳 **Payment Processing**: Integrated Paystack payment gateway
- 📧 **Email Notifications**: Automated email system using Resend
- 📱 **Responsive Design**: Mobile-first responsive interface
- 🔐 **Role-based Access**: Admin and user role management
- 📊 **Analytics Dashboard**: Event and registration analytics
- 🎭 **Photo Capture**: Intelligent face capture for profiles

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: Supabase Auth + Custom JWT
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Paystack integration
- **Email**: Resend API
- **State Management**: Zustand

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Supabase project (optional, for enhanced auth)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd exjam-alumni
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables (see Environment Variables section below).

4. **Database Setup**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Required variables (see `.env.example` for details):

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token signing (32+ characters)
- `PAYSTACK_SECRET_KEY` & `PAYSTACK_PUBLIC_KEY`: Payment gateway keys
- `RESEND_API_KEY`: Email service API key
- `NEXT_PUBLIC_APP_URL`: Application URL

Optional Supabase variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Project Structure

```
exjam-alumni/
├── app/                        # Next.js 13+ App Router
│   ├── (auth)/                 # Authentication pages
│   ├── (dashboard)/            # Protected dashboard pages
│   ├── (public)/               # Public pages
│   └── api/                    # API routes
├── components/                 # Reusable components
│   ├── ui/                     # shadcn/ui components
│   └── layouts/                # Layout components
├── lib/                        # Utility libraries
│   ├── store/                  # State management
│   └── supabase/               # Supabase utilities
├── prisma/                     # Database schema and migrations
└── public/                     # Static assets
```

## Key Features

### Authentication System

- Consolidated authentication using Supabase + Custom JWT
- Role-based access control (Admin/User)
- Protected routes with auth guards

### Event Management

- Create and manage events
- Registration system with payment integration
- QR code ticket generation
- Check-in functionality

### Payment Processing

- Paystack integration for online payments
- Bank transfer option
- Payment verification and tracking
- Automated receipt generation

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npx prisma studio`: Open database GUI

### Code Quality

The project uses:

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting (via ESLint)
- Husky for pre-commit hooks (if configured)

## Deployment

### Vercel Deployment (Recommended)

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The app is containerizable and can be deployed on:

- Railway
- Render
- DigitalOcean App Platform
- AWS/GCP/Azure

### Production Checklist

- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Use production Paystack keys (`sk_live_...`, `pk_live_...`)
- [ ] Set strong `JWT_SECRET` (different from development)
- [ ] Configure production database with connection pooling
- [ ] Set up email domain in Resend
- [ ] Enable error monitoring (Sentry recommended)
- [ ] Set up database backups
- [ ] Configure CDN for static assets

## API Routes

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Events

- `GET /api/events` - List events
- `POST /api/events` - Create event (admin only)
- `GET /api/events/[id]` - Get event details

### Payments

- `POST /api/payment/initialize` - Initialize payment
- `POST /api/payment/verify` - Verify payment status

### Registrations

- `POST /api/registrations` - Register for event
- `GET /api/registrations` - User's registrations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is proprietary software for The ExJAM Association.

## Support

For support, please contact the development team or create an issue in the repository.
