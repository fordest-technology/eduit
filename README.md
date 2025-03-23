# EduIT - School Management System

EduIT is a comprehensive school management system built with Next.js, Tailwind CSS, and Neon PostgreSQL. It provides a complete solution for educational institutions to manage students, teachers, classes, subjects, attendance, and academic results.

## Features

- **User Management & Authentication**

  - JWT-based secure authentication
  - Role-based access control (RBAC) for Super Admin, School Admin, Teachers, Students, and Parents
  - User registration and management

- **School & Academic Management**

  - Create and manage schools, classes, and subjects
  - Assign teachers to classes and subjects
  - Manage academic sessions

- **Results Management**

  - Record and calculate student grades
  - Principal review and approval workflow
  - Generate and download digital report cards

- **Parent & Student Portals**

  - Personalized dashboards for students and parents
  - View academic records, results, and attendance

- **Email Notifications**
  - Automated welcome emails with login credentials
  - Configurable email providers (SMTP, SendGrid, Resend)
  - Debug tools for email troubleshooting

## Tech Stack

- **Frontend**: Next.js 14 with App Router, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Node.js
- **Database**: Neon PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **State Management**: React Hooks
- **Email**: Nodemailer with multiple provider options

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- Neon PostgreSQL database (or any PostgreSQL database)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/eduit.git
   cd eduit
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Copy the environment variables file and configure it:

   ```bash
   cp .env.example .env.local
   ```

4. Update the `.env.local` file with your database connection string and other required variables.

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### Email Configuration

EduIT supports multiple email providers for sending notifications:

1. **SMTP Configuration** (Default):

   ```
   SMTP_HOST="smtp.yourprovider.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@example.com"
   SMTP_PASS="your-password"
   EMAIL_FROM="noreply@yourdomain.com"
   ```

2. **SendGrid Configuration**:

   ```
   SENDGRID_API_KEY="your-sendgrid-api-key"
   EMAIL_FROM="noreply@yourdomain.com"
   ```

3. **Resend.com Configuration**:
   ```
   RESEND_API_KEY="your-resend-api-key"
   EMAIL_FROM="noreply@yourdomain.com"
   ```

### Email Debugging

In development mode, EduIT provides comprehensive email debugging tools:

1. **Admin Dashboard**: Navigate to `/dashboard/debug` to access the email debugging dashboard.

2. **Debug Email Files**: All emails are saved as HTML files in the `.email-debug` directory for inspection.

3. **API Call Logs**: The debug dashboard displays a history of recent email API calls with detailed error information.

If you're experiencing issues with email delivery:

- Check your email provider configuration in `.env.local`
- Review the debug dashboard for detailed error information
- Inspect the HTML email files in the `.email-debug` directory
