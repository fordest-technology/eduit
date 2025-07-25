# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EduIT is a comprehensive school management system built with Next.js 15, React 19, TypeScript, Prisma ORM, and PostgreSQL. It provides multi-tenant architecture through subdomain-based school isolation and supports multiple user roles (Super Admin, School Admin, Teacher, Student, Parent).

## Tech Stack

- **Framework**: Next.js 15.2.4 (App Router)
- **Runtime**: Node.js 18+
- **Database**: PostgreSQL with Prisma ORM 6.5.0
- **Authentication**: Custom JWT-based auth (jose library)
- **Styling**: Tailwind CSS with Shadcn UI components
- **State Management**: Zustand for school context
- **Testing**: Jest with React Testing Library
- **Deployment**: Multi-tenant via subdomains

## Architecture Key Points

### Multi-Tenant Structure
- **Subdomain-based isolation**: Each school gets `schoolname.localhost:3000` in dev or `schoolname.eduit.com` in prod
- **School context middleware**: Automatically injects `x-school-id` header based on subdomain
- **Database isolation**: All records include `schoolId` foreign key for tenant separation

### Core Models (Prisma Schema)
- **User**: Base model with role-based polymorphic relations to Student/Teacher/Parent/Admin
- **School**: Central tenant model with branding (colors, logo, subdomain)
- **AcademicSession**: School-specific academic years/terms
- **Class**: School classes with teacher assignments
- **Subject**: Academic subjects with teacher assignments
- **Result**: Student performance tracking with configurable grading
- **Student/Teacher/Parent**: Role-specific user extensions

### Authentication Flow
- **JWT tokens**: 7-day expiration, stored in httpOnly cookies
- **Middleware protection**: `/dashboard/*` requires auth, `/login` redirects if authenticated
- **Role-based access**: Different dashboard views per user role
- **School scoping**: All queries filtered by user's school association

## Development Commands

### Setup & Installation
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with DATABASE_URL, JWT_SECRET, etc.

# Database setup
npx prisma migrate dev
npm run seed  # Optional seed data
```

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- results-config-api.test.ts
```

### Database Operations
```bash
# Generate migration from schema changes
npx prisma migrate dev --name add-feature

# Reset database (destructive)
npx prisma migrate reset

# Seed database with sample data
npm run seed

# Open Prisma Studio
npx prisma studio
```

### Code Quality
```bash
# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

## Key File Structure

```
├── app/                      # Next.js App Router
│   ├── api/                 # API routes (RESTful)
│   ├── dashboard/           # Role-based dashboard pages
│   ├── admin/              # Super admin interface
│   └── auth/               # Authentication pages
├── components/              # Reusable UI components
├── lib/                    # Core utilities & configurations
│   ├── auth-server.ts      # JWT authentication
│   ├── prisma.ts          # Prisma client singleton
│   ├── subdomain.ts       # Multi-tenant utilities
│   └── utils.ts           # General utilities
├── prisma/                # Database schema & migrations
└── __tests__/             # Test files
```

## Environment Variables

Required in `.env`:
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/eduit"
JWT_SECRET="your-jwt-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Development Workflow

1. **Start development**: `npm run dev` (runs on localhost:3000)
2. **Access multi-tenant**: Use `schoolname.localhost:3000` for specific schools
3. **Test authentication**: Default super admin created during seed
4. **Database changes**: Run `npx prisma migrate dev` after schema updates
5. **Add new API route**: Create `app/api/route-name/route.ts` with GET/POST handlers

## Testing Patterns

- **Unit tests**: Located in `__tests__/unit/`
- **Mock setup**: `__mocks__/prisma.ts` for database mocking
- **Component tests**: Use React Testing Library
- **API tests**: Test route handlers directly
- **Coverage target**: 70% threshold for all metrics

## Deployment Notes

- **Subdomain routing**: Configure wildcard DNS for multi-tenant support
- **Database**: Ensure PostgreSQL with proper connection pooling
- **Environment**: Set production JWT_SECRET and database URL
- **Build**: `npm run build` then `npm start` for production