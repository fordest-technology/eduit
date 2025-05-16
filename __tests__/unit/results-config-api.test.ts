import { NextResponse } from "next/server";
import {
  GET,
  POST,
  PUT,
} from "@/app/api/schools/[schoolId]/results/config/route";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    academicSession: {
      findFirst: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  },
}));

jest.mock("@/lib/auth", () => ({
  getSession: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

describe("Results Configuration API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("should return 401 if not authenticated", async () => {
      // Arrange
      (getSession as jest.Mock).mockResolvedValue(null);
      (NextResponse.json as jest.Mock).mockReturnValue({ status: 401 });

      // Act
      await GET({} as Request, { params: { schoolId: "test-school" } });

      // Assert
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Unauthorized" },
        { status: 401 }
      );
    });

    it("should return configurations for a school", async () => {
      // Arrange
      (getSession as jest.Mock).mockResolvedValue({
        user: { id: "test-user" },
      });

      const mockConfigs = [
        { id: "config1", schoolId: "test-school", academicYear: "2023/2024" },
      ];

      const mockPeriods = [{ id: "period1", name: "Term 1", weight: 1 }];

      const mockComponents = [
        { id: "comp1", name: "CA", key: "ca", maxScore: 40 },
      ];

      const mockGrades = [
        {
          id: "grade1",
          minScore: 70,
          maxScore: 100,
          grade: "A",
          remark: "Excellent",
        },
      ];

      (prisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce(mockConfigs)
        .mockResolvedValueOnce(mockPeriods)
        .mockResolvedValueOnce(mockComponents)
        .mockResolvedValueOnce(mockGrades);

      // Act
      await GET({} as Request, { params: { schoolId: "test-school" } });

      // Assert
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(4);
      expect(NextResponse.json).toHaveBeenCalledWith([
        {
          ...mockConfigs[0],
          periods: mockPeriods,
          assessmentComponents: mockComponents,
          gradingScale: mockGrades,
        },
      ]);
    });
  });

  describe("POST", () => {
    it("should create a new configuration", async () => {
      // Arrange
      (getSession as jest.Mock).mockResolvedValue({
        user: { id: "test-user" },
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          academicYear: "2023/2024",
          periods: [{ name: "Term 1", weight: 1 }],
          assessmentComponents: [{ name: "CA", key: "ca", maxScore: 40 }],
          gradingScale: [
            { minScore: 70, maxScore: 100, grade: "A", remark: "Excellent" },
          ],
          cumulativeEnabled: true,
          cumulativeMethod: "progressive_average",
          showCumulativePerTerm: true,
        }),
      };

      (prisma.academicSession.findFirst as jest.Mock).mockResolvedValue({
        id: "session1",
      });

      (prisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([{ id: "config1" }])
        .mockResolvedValueOnce([{ id: "config1", schoolId: "test-school" }])
        .mockResolvedValueOnce([{ id: "period1", name: "Term 1", weight: 1 }])
        .mockResolvedValueOnce([
          { id: "comp1", name: "CA", key: "ca", maxScore: 40 },
        ])
        .mockResolvedValueOnce([
          {
            id: "grade1",
            minScore: 70,
            maxScore: 100,
            grade: "A",
            remark: "Excellent",
          },
        ]);

      // Act
      await POST(mockRequest as Request, {
        params: { schoolId: "test-school" },
      });

      // Assert
      expect(prisma.academicSession.findFirst).toHaveBeenCalled();
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(5);
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(3);
      expect(NextResponse.json).toHaveBeenCalled();
    });
  });

  describe("PUT", () => {
    it("should update an existing configuration", async () => {
      // Arrange
      (getSession as jest.Mock).mockResolvedValue({
        user: { id: "test-user" },
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          id: "config1",
          academicYear: "2023/2024",
          periods: [{ name: "Term 1", weight: 1 }],
          assessmentComponents: [{ name: "CA", key: "ca", maxScore: 40 }],
          gradingScale: [
            { minScore: 70, maxScore: 100, grade: "A", remark: "Excellent" },
          ],
          cumulativeEnabled: true,
          cumulativeMethod: "progressive_average",
          showCumulativePerTerm: true,
        }),
      };

      (prisma.academicSession.findFirst as jest.Mock).mockResolvedValue({
        id: "session1",
      });

      (prisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([
          { id: "config1", schoolId: "test-school", academicYear: "2023/2024" },
        ])
        .mockResolvedValueOnce([{ id: "period1", name: "Term 1", weight: 1 }])
        .mockResolvedValueOnce([
          { id: "comp1", name: "CA", key: "ca", maxScore: 40 },
        ])
        .mockResolvedValueOnce([
          {
            id: "grade1",
            minScore: 70,
            maxScore: 100,
            grade: "A",
            remark: "Excellent",
          },
        ]);

      // Act
      await PUT(mockRequest as Request, {
        params: { schoolId: "test-school" },
      });

      // Assert
      expect(prisma.academicSession.findFirst).toHaveBeenCalled();
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(4);
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(7); // 1 update + 3 deletes + 3 inserts
      expect(NextResponse.json).toHaveBeenCalled();
    });
  });
});
