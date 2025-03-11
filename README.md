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

## Tech Stack

- **Frontend**: Next.js 14 with App Router, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Node.js
- **Database**: Neon PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **State Management**: React Hooks

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

