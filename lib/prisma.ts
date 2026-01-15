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

// Enhanced error handling wrapper function with retries
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  retries = 2
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < retries + 1; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Common connection-related error codes
      // P1001: Can't reach database server
      // P1008: Operations timed out
      // P1017: Server has closed the connection
      // P2021: Table does not exist in the current database
      const connectionErrorCodes = ["P1001", "P1003", "P1008", "P1017", "P2021"];
      const isConnectionError = connectionErrorCodes.includes(error?.code) || 
                               error?.message?.includes("Can't reach database server");

      if (isConnectionError && i < retries) {
        console.warn(`[Database] Connection error ${error?.code}. Retrying (${i + 1}/${retries})...`);
        try {
          await prisma.$disconnect();
          await prisma.$connect();
        } catch (connErr) {
          console.error("[Database] Failed to reconnect:", connErr);
        }
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
}
