import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a connection pool
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

// Ensure we only create one instance of PrismaClient
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// In development, store the PrismaClient instance in the global object
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Add error handling middleware
prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error: any) {
    // Handle connection errors
    if (error?.code === "P1017" || error?.code === "P2021") {
      // Reconnect on connection errors
      await prisma.$disconnect();
      await prisma.$connect();
      return await next(params);
    }
    throw error;
  }
});

// Ensure proper cleanup on process exit
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
