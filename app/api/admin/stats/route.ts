import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== "SUPER_ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Get all the counts in parallel for better performance
    const [
      schoolsCount,
      teachersCount,
      studentsCount,
      parentsCount,
      subjectsCount,
      activeUsersCount,
    ] = await Promise.all([
      // Count total schools
      prisma.school.count(),

      // Count teachers
      prisma.user.count({
        where: {
          role: UserRole.TEACHER,
        },
      }),

      // Count students
      prisma.user.count({
        where: {
          role: UserRole.STUDENT,
        },
      }),

      // Count parents
      prisma.user.count({
        where: {
          role: UserRole.PARENT,
        },
      }),

      // Count subjects across all schools
      prisma.subject.count(),

      // Count active users in the last 24 hours
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    return NextResponse.json({
      totalSchools: schoolsCount,
      totalTeachers: teachersCount,
      totalStudents: studentsCount,
      totalParents: parentsCount,
      totalSubjects: subjectsCount,
      activeUsers: activeUsersCount,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
