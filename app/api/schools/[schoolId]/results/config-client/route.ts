import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth"; // Assuming getSession can be used in route handlers
import {
  ResultConfiguration,
  Period,
  AssessmentComponent,
  GradeScale,
} from "@/app/dashboard/results/types"; // Adjust path as needed

// Helper function to simulate withErrorHandling if not directly usable here
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const { schoolId } = await params;
  return handleApiError(async () => {
    const session = await getSession(); // Get user session

    if (!session) {
      return new NextResponse(
        JSON.stringify({ message: "Unauthorized: No active session" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate if the logged-in user's schoolId matches the request, if applicable
    // This depends on how your session object stores schoolId and your security model.
    // For instance, if session.schoolId should match params.schoolId for non-super-admins:
    if (
      session.role !== "SUPER_ADMIN" &&
      session.schoolId !== schoolId
    ) {
      return new NextResponse(
        JSON.stringify({ message: "Forbidden: Access denied for this school" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }


    // 1. Get the current active academic session for the school
    const currentAcademicSession = await prisma.academicSession.findFirst({
      where: {
        schoolId: schoolId,
        isCurrent: true, // Assuming 'isCurrent' field exists on AcademicSession
      },
      select: {
        id: true,
        name: true, // For academicYear field in ResultConfiguration
      },
    });

    if (!currentAcademicSession) {
      return new NextResponse(
        JSON.stringify({
          message: "No active academic session found for this school.",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch the result configuration for that school and current session
    const existingConfig = await prisma.resultConfiguration.findFirst({
      where: {
        schoolId: schoolId,
        sessionId: currentAcademicSession.id, // Link configuration to the current session
      },
      include: {
        periods: true,
        assessmentComponents: true,
        gradingScale: true,
      },
      orderBy: {
        createdAt: "desc", // Get the latest one if multiple exist (though ideally should be unique per session)
      },
    });

    if (!existingConfig) {
      // Return a default or empty structure if no config exists, or a 404
      // For now, let's return 404 if no config is explicitly set up for the current session.
      return new NextResponse(
        JSON.stringify({
          message:
            "No result configuration found for the current academic session.",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Format the data to match ResultConfiguration type
    const formattedConfig: ResultConfiguration = {
      id: existingConfig.id,
      schoolId: existingConfig.schoolId,
      academicYear: currentAcademicSession.name, // Use session name as academic year
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
      cumulativeMethod: existingConfig.cumulativeMethod as string, // Add type assertion if necessary
      showCumulativePerTerm: existingConfig.showCumulativePerTerm,
      // sessionId: existingConfig.sessionId, // Optional: if you need to return it
    };

    return NextResponse.json(formattedConfig, { status: 200 });
  });
}
