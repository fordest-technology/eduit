import prisma from "@/lib/db";

export async function getDashboardStats(schoolId: string) {
  try {
    // Count total students
    const totalStudents = await prisma.student.count({
      where: {
        user: {
          schoolId: schoolId,
        },
      },
    });

    // Count total teachers
    const totalTeachers = await prisma.teacher.count({
      where: {
        user: {
          schoolId: schoolId,
        },
      },
    });

    // Count total classes
    const totalClasses = await prisma.class.count({
      where: {
        schoolId: schoolId,
      },
    });

    // Count total subjects
    const totalSubjects = await prisma.subject.count({
      where: {
        schoolId: schoolId,
      },
    });

    // Calculate attendance rate (optional)
    const totalAttendanceRecords = await prisma.attendance.count({
      where: {
        student: {
          user: {
            schoolId: schoolId,
          },
        },
      },
    });

    const presentAttendanceRecords = await prisma.attendance.count({
      where: {
        student: {
          user: {
            schoolId: schoolId,
          },
        },
        status: "PRESENT",
      },
    });

    const attendanceRate =
      totalAttendanceRecords > 0
        ? (presentAttendanceRecords / totalAttendanceRecords) * 100
        : 0;

    // Calculate average score (optional)
    const averageScoreResult = await prisma.result.aggregate({
      where: {
        student: {
          user: {
            schoolId: schoolId,
          },
        },
      },
      _avg: {
        marks: true,
      },
    });

    return {
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      attendanceRate: Number(attendanceRate.toFixed(2)),
      averageScore: Number(averageScoreResult._avg.marks?.toFixed(2) || 0),
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
}
