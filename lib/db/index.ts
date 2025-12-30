import { prisma } from "../prisma";
import { withErrorHandling } from "../prisma";

export class Database {
  static async query<T>(operation: () => Promise<T>): Promise<T> {
    return withErrorHandling(operation);
  }
}

export { prisma };
export default prisma;
