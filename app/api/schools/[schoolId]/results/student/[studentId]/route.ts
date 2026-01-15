import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET handler to fetch a specific student's results
export async function GET(
  request: Request,
  { params }: { params: Promise<{ schoolId: string; studentId: string }> }
) {
  try {
    const { schoolId, studentId } = await params;
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this school
    if (session.role !== "SUPER_ADMIN" && session.schoolId !== schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const periodId = url.searchParams.get("periodId");
    const sessionId = url.searchParams.get("sessionId");

    if (!periodId || !sessionId) {
      return NextResponse.json(
        { error: "Missing required parameters: periodId and sessionId" },
        { status: 400 }
      );
    }

    // Fetch student info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        classes: {
          where: {
            sessionId: sessionId,
            status: "ACTIVE",
          },
          include: {
            class: {
              select: {
                id: true,
                name: true,
                section: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Fetch results for this student
    const results = await prisma.result.findMany({
      where: {
        studentId,
        periodId,
        sessionId,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        componentScores: {
          include: {
            component: true,
          },
        },
        period: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        subject: {
          name: "asc",
        },
      },
    });

    // Fetch school info for PDF header
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        name: true,
        logo: true,
        address: true,
        phone: true,
        email: true,
      },
    });

    // Fetch academic session info
    const academicSession = await prisma.academicSession.findUnique({
      where: { id: sessionId },
      select: {
        name: true,
        startDate: true,
        endDate: true,
      },
    });

    // Fetch period info
    const period = await prisma.resultPeriod.findUnique({
      where: { id: periodId },
      select: {
        name: true,
      },
    });

    // Calculate summary statistics
    const totalScore = results.reduce((sum, r) => sum + (r.total || 0), 0);
    const totalSubjects = results.length;
    const average = totalSubjects > 0 ? totalScore / totalSubjects : 0;

    // Get current class
    const currentClass = student.classes[0]?.class || null;

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        rollNumber: student.classes[0]?.rollNumber || null,
        admissionDate: student.admissionDate,
      },
      class: currentClass,
      school,
      session: academicSession,
      period,
      results: results.map((r) => ({
        id: r.id,
        subject: r.subject,
        componentScores: r.componentScores.map((cs) => ({
          name: cs.component.name,
          key: cs.component.key,
          score: cs.score,
          maxScore: cs.component.maxScore,
        })),
        total: r.total,
        grade: r.grade,
        remark: r.remark,
        teacherComment: r.teacherComment,
      })),
      summary: {
        totalScore,
        totalSubjects,
        average: average.toFixed(2),
        overallGrade: calculateOverallGrade(average),
      },
    });
  } catch (error) {
    console.error("Error fetching student result:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch student result",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate overall grade
function calculateOverallGrade(average: number): string {
  if (average >= 70) return "A";
  if (average >= 60) return "B";
  if (average >= 50) return "C";
  if (average >= 40) return "D";
  return "F";
}
