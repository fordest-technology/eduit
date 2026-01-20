import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req, [UserRole.TEACHER]);

        if (!auth.authenticated || !auth.authorized || !auth.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { user } = auth;

        // Get teacher record
        const teacher = await prisma.teacher.findUnique({
            where: { userId: user.id },
            select: { id: true },
        });

        if (!teacher) {
            return NextResponse.json(
                { error: "Teacher profile not found" },
                { status: 404 }
            );
        }

        // Get current academic session
        const currentSession = await prisma.academicSession.findFirst({
            where: {
                schoolId: user.schoolId!,
                isCurrent: true,
            },
            select: {
                id: true,
                name: true,
            },
        });

        if (!currentSession) {
            return NextResponse.json(
                { error: "No active academic session found" },
                { status: 404 }
            );
        }

        // Get all classes taught by this teacher
        const teacherClasses = await prisma.class.findMany({
            where: {
                teacherId: teacher.id,
                schoolId: user.schoolId!,
            },
            select: {
                id: true,
                name: true,
                section: true,
            },
        });

        const classIds = teacherClasses.map((c) => c.id);

        if (classIds.length === 0) {
            return NextResponse.json({
                students: [],
                classes: [],
                stats: {
                    total: 0,
                    male: 0,
                    female: 0,
                    activeClasses: 0,
                },
            });
        }

        // Get all students in these classes
        const studentClasses = await prisma.studentClass.findMany({
            where: {
                classId: { in: classIds },
                sessionId: currentSession.id,
                status: "ACTIVE",
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                        section: true,
                        level: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                student: {
                    user: {
                        name: "asc",
                    },
                },
            },
        });

        // Get attendance data for students
        const studentIds = studentClasses.map((sc) => sc.studentId);

        const attendanceData = await prisma.attendance.groupBy({
            by: ["studentId", "status"],
            where: {
                studentId: { in: studentIds },
                sessionId: currentSession.id,
            },
            _count: {
                id: true,
            },
        });

        // Calculate attendance percentage for each student
        const attendanceMap = new Map<string, { present: number; total: number }>();

        attendanceData.forEach((record) => {
            const current = attendanceMap.get(record.studentId) || { present: 0, total: 0 };
            current.total += record._count.id;
            if (record.status === "PRESENT") {
                current.present += record._count.id;
            }
            attendanceMap.set(record.studentId, current);
        });

        // Get performance data
        const currentPeriod = await prisma.resultPeriod.findFirst({
            where: {
                configuration: {
                    sessionId: currentSession.id,
                    schoolId: user.schoolId!,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
            },
        });

        let performanceMap = new Map<string, number>();

        if (currentPeriod) {
            const results = await prisma.result.groupBy({
                by: ["studentId"],
                where: {
                    studentId: { in: studentIds },
                    periodId: currentPeriod.id,
                    sessionId: currentSession.id,
                },
                _avg: {
                    total: true,
                },
            });

            results.forEach((result) => {
                if (result._avg.total) {
                    performanceMap.set(result.studentId, Math.round(result._avg.total * 10) / 10);
                }
            });
        }

        // Format student data
        const students = studentClasses.map((sc) => {
            const attendance = attendanceMap.get(sc.studentId);
            const attendancePercentage = attendance
                ? Math.round((attendance.present / attendance.total) * 100)
                : 0;

            return {
                id: sc.student.id,
                userId: sc.student.user.id,
                name: sc.student.user.name,
                email: sc.student.user.email,
                profileImage: sc.student.user.profileImage,
                gender: sc.student.gender,
                dateOfBirth: sc.student.dateOfBirth,
                rollNumber: sc.rollNumber,
                class: {
                    id: sc.class.id,
                    name: sc.class.name,
                    section: sc.class.section,
                    level: sc.class.level.name,
                },
                attendance: {
                    percentage: attendancePercentage,
                    present: attendance?.present || 0,
                    total: attendance?.total || 0,
                },
                performance: {
                    average: performanceMap.get(sc.studentId) || 0,
                },
            };
        });

        // Calculate stats
        const stats = {
            total: students.length,
            male: students.filter((s) => s.gender === "MALE").length,
            female: students.filter((s) => s.gender === "FEMALE").length,
            activeClasses: teacherClasses.length,
        };

        return NextResponse.json({
            students,
            classes: teacherClasses,
            stats,
        });
    } catch (error) {
        console.error("[TEACHER_STUDENTS_GET]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
