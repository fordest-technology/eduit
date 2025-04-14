import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

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

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export { prisma };

// Error handling wrapper function
export async function withErrorHandling<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Handle connection errors
    if (error?.code === "P1017" || error?.code === "P2021") {
      await prisma.$disconnect();
      await prisma.$connect();
      return await operation();
    }
    throw error;
  } finally {
    // Ensure connection is properly managed
    if (process.env.NODE_ENV === "production") {
      await prisma.$disconnect();
    }
  }
}
