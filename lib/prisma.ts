import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error("❌ DATABASE_URL is not defined in environment variables.");
  } else {
    // Log masked URL to verify loading
    const masked = url.replace(/:([^@]+)@/, ":****@");
    console.log(`[Database] Initializing with: ${masked.substring(0, 40)}...`);
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: url,
      },
    },
  });
};

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export { prisma };
export { prisma as db };

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
