import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();
export const prisma = db;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export default db;