import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export async function withErrorHandling<T>(operation: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Retry on connection/timeout issues
      const isRetryable = 
        error.code === 'P1001' || // Can't reach database server
        error.code === 'P1008' || // Operations timeout
        error.code === 'P2024' || // Connection timeout
        error.code === 'P2028' || // Transaction API error: Unable to start a transaction in the given time
        error.message?.includes('closed') ||
        error.message?.includes('timeout') ||
        error.message?.includes('connection');

      if (!isRetryable || i === retries - 1) {
        break;
      }
      
      console.warn(`Database operation failed (attempt ${i + 1}/${retries}), retrying...`, error.message);
      // Brief delay before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  console.error("Prisma Operation Error after retries:", lastError);
  throw lastError;
}

export { prisma };

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export default prisma;
