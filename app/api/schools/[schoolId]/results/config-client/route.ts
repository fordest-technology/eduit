import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  ResultConfiguration,
} from "@/app/dashboard/results/types";

// Helper function for error handling
async function handleApiError(fn: () => Promise<NextResponse>) {
  try {
    return await fn();
  } catch (error) {
    console.error("[API_CONFIG_CLIENT_ERROR]", error);
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return new NextResponse(
      JSON.stringify({ message: errorMessage, error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Default configuration template
const getDefaultConfig = (schoolId: string, sessionName: string): ResultConfiguration => ({
  id: "",
  schoolId,
  academicYear: sessionName,
  periods: [
    { id: "1", name: "First Term", weight: 1 },
    { id: "2", name: "Second Term", weight: 1 },
    { id: "3", name: "Third Term", weight: 1 },
  ],
  assessmentComponents: [
    { id: "1", name: "First CA", key: "ca1", maxScore: 10 },
    { id: "2", name: "Second CA", key: "ca2", maxScore: 10 },
    { id: "3", name: "Assignment", key: "assignment", maxScore: 10 },
    { id: "4", name: "Project", key: "project", maxScore: 10 },
    { id: "5", name: "Exam", key: "exam", maxScore: 60 },
  ],
  gradingScale: [
    { id: "1", minScore: 70, maxScore: 100, grade: "A", remark: "Excellent" },
    { id: "2", minScore: 60, maxScore: 69, grade: "B", remark: "Very Good" },
    { id: "3", minScore: 50, maxScore: 59, grade: "C", remark: "Good" },
    { id: "4", minScore: 45, maxScore: 49, grade: "D", remark: "Fair" },
    { id: "5", minScore: 40, maxScore: 44, grade: "E", remark: "Pass" },
    { id: "6", minScore: 0, maxScore: 39, grade: "F", remark: "Fail" },
  ],
  cumulativeEnabled: true,
  cumulativeMethod: "progressive_average",
  showCumulativePerTerm: true,
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const { schoolId } = await params;
  return handleApiError(async () => {
    const session = await getSession();

    if (!session) {
      return new NextResponse(
        JSON.stringify({ message: "Unauthorized: No active session" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify access to this school's data
    if (session.role === "PARENT") {
      const parent = await prisma.parent.findUnique({
        where: { userId: session.id },
        select: {
          children: {
            select: {
              student: {
                select: {
                  user: {
                    select: {
                      schoolId: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!parent) {
        return new NextResponse(
          JSON.stringify({ message: "Parent profile not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      const hasAccessToSchool = parent.children.some(
        (child) => child.student.user.schoolId === schoolId
      );

      if (!hasAccessToSchool) {
        return new NextResponse(
          JSON.stringify({ message: "Forbidden: Access denied for this school" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    } else if (session.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.id },
        select: {
          user: {
            select: {
              schoolId: true,
            },
          },
        },
      });

      if (!student || student.user.schoolId !== schoolId) {
        return new NextResponse(
          JSON.stringify({ message: "Forbidden: Access denied for this school" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    } else if (
      session.role !== "SUPER_ADMIN" &&
      session.schoolId !== schoolId
    ) {
      return new NextResponse(
        JSON.stringify({ message: "Forbidden: Access denied for this school" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[CONFIG_CLIENT] Fetching config for schoolId:", schoolId);

    // Get sessionId from query params if provided
    const url = new URL(request.url);
    const sessionIdParam = url.searchParams.get("sessionId");

    // 1. Get the academic session
    let currentAcademicSession;

    if (sessionIdParam) {
      // If sessionId is provided, use it
      currentAcademicSession = await prisma.academicSession.findUnique({
        where: { id: sessionIdParam },
        select: {
          id: true,
          name: true,
        },
      });
    } else {
      // Otherwise, get the current active session
      currentAcademicSession = await prisma.academicSession.findFirst({
        where: {
          schoolId: schoolId,
          isCurrent: true,
        },
        select: {
          id: true,
          name: true,
        },
      });
    }

    console.log("[CONFIG_CLIENT] Academic session:", currentAcademicSession);

    // If no current session, try to get the most recent one
    if (!currentAcademicSession) {
      console.log("[CONFIG_CLIENT] No current session found, getting most recent...");
      currentAcademicSession = await prisma.academicSession.findFirst({
        where: {
          schoolId: schoolId,
        },
        orderBy: {
          startDate: "desc",
        },
        select: {
          id: true,
          name: true,
        },
      });
      console.log("[CONFIG_CLIENT] Most recent session:", currentAcademicSession);
    }

    // If still no session, return default config with placeholder
    if (!currentAcademicSession) {
      const defaultConfig = getDefaultConfig(schoolId, "2024/2025");
      return NextResponse.json({
        ...defaultConfig,
        isNew: true,
        message: "No academic session found. Please create one first.",
      }, { status: 200 });
    }

    // 2. Fetch the result configuration for that school and current session
    const existingConfig = await prisma.resultConfiguration.findFirst({
      where: {
        schoolId: schoolId,
        sessionId: currentAcademicSession.id,
      },
      include: {
        periods: true,
        assessmentComponents: true,
        gradingScale: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // If no config exists, return default template
    if (!existingConfig) {
      const defaultConfig = getDefaultConfig(schoolId, currentAcademicSession.name);
      return NextResponse.json({
        ...defaultConfig,
        isNew: true,
        sessionId: currentAcademicSession.id,
      }, { status: 200 });
    }

    // 3. Format the data to match ResultConfiguration type
    const formattedConfig: ResultConfiguration & { isNew?: boolean } = {
      id: existingConfig.id,
      schoolId: existingConfig.schoolId,
      academicYear: currentAcademicSession.name,
      periods: existingConfig.periods.map((p) => ({
        ...p,
        weight: Number(p.weight),
      })),
      assessmentComponents: existingConfig.assessmentComponents.map((ac) => ({
        ...ac,
        maxScore: Number(ac.maxScore),
      })),
      gradingScale: existingConfig.gradingScale.map((gs) => ({
        ...gs,
        minScore: Number(gs.minScore),
        maxScore: Number(gs.maxScore),
      })),
      cumulativeEnabled: existingConfig.cumulativeEnabled,
      cumulativeMethod: existingConfig.cumulativeMethod as string,
      showCumulativePerTerm: existingConfig.showCumulativePerTerm,
      isNew: false,
    };

    return NextResponse.json(formattedConfig, { status: 200 });
  });
}

