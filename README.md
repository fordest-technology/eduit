# EduIT - School Management System

## Overview

EduIT is a comprehensive school management system built with Next.js, React, TypeScript, Prisma, and PostgreSQL. It provides features for managing academic sessions, results, students, teachers, and more.

## Features

- Academic session management
- Results configuration and management
- Student and teacher profiles
- Attendance tracking
- Payment processing
- Event management
- And more...

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Testing**: Jest, React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/eduit.git
cd eduit
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL="postgresql://username:password@localhost:5432/eduit"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

4. Run database migrations:

```bash
npx prisma migrate dev
```

5. Seed the database (optional):

```bash
npm run seed
```

6. Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:3000.

## Testing

To run the tests:

```bash
npm test
```

To run tests with coverage:

```bash
npm run test:coverage
```

To run tests in watch mode:

```bash
npm run test:watch
```

## Project Structure

```
eduit/
├── app/                  # Next.js app directory
│   ├── api/              # API routes
│   ├── dashboard/        # Dashboard pages
│   └── ...               # Other app directories
├── components/           # Reusable components
├── lib/                  # Utility functions and libraries
├── prisma/               # Prisma schema and migrations
├── public/               # Static assets
└── __tests__/            # Test files
```

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
