import { jest } from "@jest/globals";

// Mock Prisma client
export const prisma = {
  academicSession: {
    findFirst: jest.fn(),
  },
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
};

// Mock error handling wrapper
export const withErrorHandling = jest.fn((fn: () => Promise<any>) => fn());

// Mock Jest
// This allows TypeScript to work with Jest mocks in a Node environment
declare global {
  namespace jest {
    interface Mock<T = any, Y extends any[] = any[]> {
      mockResolvedValue: (value: T) => this;
      mockResolvedValueOnce: (value: T) => this;
      mockImplementation: (fn: (...args: Y) => T) => this;
      mockReturnValue: (value: T) => this;
    }
    function fn<T = any, Y extends any[] = any[]>(): Mock<T, Y>;
    function clearAllMocks(): void;
    function mock(path: string, factory?: () => any): void;
  }
}
