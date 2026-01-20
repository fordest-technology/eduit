import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: classId } = await params;
        const auth = await requireAuth(req);

        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { user } = auth;

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

        // Get class details
        const classData = await prisma.class.findUnique({
            where: {
                id: classId,
                schoolId: user.schoolId!,
            },
            include: {
                level: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                teacher: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                name: true,
                                email: true,
                                profileImage: true,
                            },
                        },
                    },
                },
            },
        });

        if (!classData) {
            return NextResponse.json({ error: "Class not found" }, { status: 404 });
        }

        // If user is a teacher, verify they are assigned to this class
        if (user.role === UserRole.TEACHER) {
            const teacher = await prisma.teacher.findUnique({
                where: { userId: user.id },
                select: { id: true },
            });

            if (!teacher || classData.teacherId !== teacher.id) {
                return NextResponse.json(
                    { error: "You are not assigned to this class" },
                    { status: 403 }
                );
            }
        }

        // Get students in this class
        const students = await prisma.studentClass.findMany({
            where: {
                classId: classId,
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
            },
            orderBy: {
                student: {
                    user: {
                        name: "asc",
                    },
                },
            },
        });

        // Get class subjects
        const subjects = await prisma.classSubject.findMany({
            where: {
                classId: classId,
            },
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                teacher: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        // Get attendance summary for this class
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const studentIds = students.map((s) => s.studentId);

        const attendanceToday = await prisma.attendance.findMany({
            where: {
                studentId: { in: studentIds },
                date: {
                    gte: today,
                },
                sessionId: currentSession.id,
            },
            select: {
                status: true,
            },
        });

        const attendanceSummary = {
            total: students.length,
            present: attendanceToday.filter((a) => a.status === "PRESENT").length,
            absent: attendanceToday.filter((a) => a.status === "ABSENT").length,
            late: attendanceToday.filter((a) => a.status === "LATE").length,
            notMarked: students.length - attendanceToday.length,
        };

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
                name: true,
            },
        });

        let performanceData = {
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
            totalResults: 0,
        };

        if (currentPeriod && studentIds.length > 0) {
            const results = await prisma.result.findMany({
                where: {
                    studentId: { in: studentIds },
                    periodId: currentPeriod.id,
                    sessionId: currentSession.id,
                },
                select: {
                    total: true,
                },
            });

            if (results.length > 0) {
                const scores = results.map((r) => r.total);
                const sum = scores.reduce((a, b) => a + b, 0);
                performanceData = {
                    averageScore: Math.round((sum / scores.length) * 10) / 10,
                    highestScore: Math.max(...scores),
                    lowestScore: Math.min(...scores),
                    totalResults: results.length,
                };
            }
        }

        // Format response
        const response = {
            id: classData.id,
            name: classData.name,
            section: classData.section,
            level: classData.level,
            teacher: classData.teacher,
            currentSession,
            students: students.map((sc) => ({
                id: sc.student.id,
                userId: sc.student.user.id,
                name: sc.student.user.name,
                email: sc.student.user.email,
                profileImage: sc.student.user.profileImage,
                rollNumber: sc.rollNumber,
                gender: sc.student.gender,
                dateOfBirth: sc.student.dateOfBirth,
            })),
            subjects: subjects.map((cs) => ({
                id: cs.subject.id,
                name: cs.subject.name,
                code: cs.subject.code,
                teacher: cs.teacher,
            })),
            stats: {
                totalStudents: students.length,
                totalSubjects: subjects.length,
                attendance: attendanceSummary,
                performance: performanceData,
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("[CLASS_DETAIL_GET]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
