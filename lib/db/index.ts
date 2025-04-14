import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/lib/prisma";

// Create a new PrismaClient instance
const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Create a wrapper for database operations
export class Database {
  static async query<T>(operation: () => Promise<T>): Promise<T> {
    return withErrorHandling(operation);
  }
}

export { prisma };
export default prisma;
