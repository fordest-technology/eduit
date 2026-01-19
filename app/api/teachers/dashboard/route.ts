import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET Teacher Dashboard Stats
 * Returns accurate counts for:
 * - Total students taught (across all subjects)
 * - Total classes taught
 * - Total subjects taught
 * - Class teacher info
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session || session.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get teacher record
        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id },
            include: {
                user: {
                    select: { schoolId: true, name: true },
                },
            },
        });

        if (!teacher) {
            return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
        }

        // Get current academic session
        const currentSession = await prisma.academicSession.findFirst({
            where: {
                schoolId: teacher.user.schoolId || "",
                isCurrent: true,
            },
        });

        if (!currentSession) {
            return NextResponse.json(
                { error: "No active academic session" },
                { status: 404 }
            );
        }

        // Get classes where this teacher is the class teacher
        const classTeacherClasses = await prisma.class.findMany({
            where: {
                teacherId: teacher.id,
            },
            include: {
                level: true,
                students: {
                    where: {
                        sessionId: currentSession.id,
                        status: "ACTIVE",
                    },
                },
            },
        });

        // Get subjects this teacher teaches
        const teacherSubjects = await prisma.subjectTeacher.findMany({
            where: {
                teacherId: teacher.id,
            },
            include: {
                subject: {
                    include: {
                        classes: {
                            where: {
                                teacherId: teacher.id
                            },
                            include: {
                                class: {
                                    include: {
                                        level: true,
                                        students: {
                                            where: {
                                                sessionId: currentSession.id,
                                                status: "ACTIVE",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Calculate unique students and classes
        const studentIds = new Set<string>();
        const classIds = new Set<string>();

        // Add students from class teacher assignments
        classTeacherClasses.forEach((classItem) => {
            classIds.add(classItem.id);
            classItem.students.forEach((student) => {
                studentIds.add(student.studentId);
            });
        });

        // Add students from subject teaching
        teacherSubjects.forEach((subjectTeacher) => {
            subjectTeacher.subject.classes.forEach((classSubject) => {
                classIds.add(classSubject.classId);
                classSubject.class.students.forEach((student) => {
                    studentIds.add(student.studentId);
                });
            });
        });

        // Get all classes details
        const allClasses = await prisma.class.findMany({
            where: {
                id: { in: Array.from(classIds) },
            },
            include: {
                level: true,
                students: {
                    where: {
                        sessionId: currentSession.id,
                        status: "ACTIVE",
                    },
                },
            },
        });

        // Get recent results submitted by this teacher
        const recentResults = await prisma.result.findMany({
            where: {
                sessionId: currentSession.id,
                subject: {
                    teachers: {
                        some: {
                            teacherId: teacher.id,
                        },
                    },
                },
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: { name: true },
                        },
                    },
                },
                subject: {
                    select: { name: true },
                },
                period: {
                    select: { name: true },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
            take: 10,
        });

        // Calculate pending results
        const resultConfig = await prisma.resultConfiguration.findUnique({
            where: {
                schoolId_sessionId: {
                    schoolId: teacher.user.schoolId || "",
                    sessionId: currentSession.id,
                },
            },
            include: {
                periods: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
        });

        let pendingResultsCount = 0;

        if (resultConfig && resultConfig.periods.length > 0) {
            const currentPeriod = resultConfig.periods[0];

            // For each subject taught, count pending results
            for (const subjectTeacher of teacherSubjects) {
                const subject = subjectTeacher.subject;
                const classesForSubject = subject.classes.map((cs) => cs.classId);

                const studentsInClasses = await prisma.studentClass.count({
                    where: {
                        classId: { in: classesForSubject },
                        sessionId: currentSession.id,
                        status: "ACTIVE",
                    },
                });

                const existingResults = await prisma.result.count({
                    where: {
                        subjectId: subject.id,
                        sessionId: currentSession.id,
                        periodId: currentPeriod.id,
                    },
                });

                pendingResultsCount += studentsInClasses - existingResults;
            }
        }

        // Format subjects with classes
        const subjectsWithClasses = teacherSubjects.map((ts) => ({
            id: ts.subject.id,
            name: ts.subject.name,
            code: ts.subject.code,
            isCore: ts.subject.isCore,
            classes: ts.subject.classes.map((cs) => ({
                id: cs.class.id,
                name: cs.class.name,
                section: cs.class.section,
                level: cs.class.level?.name,
                studentCount: cs.class.students.length,
            })),
        }));

        // Format classes
        const classDetails = allClasses.map((c) => ({
            id: c.id,
            name: c.name,
            section: c.section,
            level: c.level?.name,
            studentCount: c.students.length,
            isClassTeacher: classTeacherClasses.some((ct) => ct.id === c.id),
        }));

        return NextResponse.json({
            stats: {
                totalStudents: studentIds.size,
                totalClasses: classIds.size,
                totalSubjects: teacherSubjects.length,
                classTeacherOf: classTeacherClasses.length,
                pendingResults: Math.max(0, pendingResultsCount),
            },
            classes: classDetails,
            subjects: subjectsWithClasses,
            recentResults: recentResults.map((r) => ({
                id: r.id,
                studentName: r.student.user.name,
                subjectName: r.subject.name,
                periodName: r.period.name,
                score: r.total,
                grade: r.grade,
                updatedAt: r.updatedAt,
            })),
            currentSession: {
                id: currentSession.id,
                name: currentSession.name,
            },
            teacher: {
                id: teacher.id,
                name: teacher.user.name,
                employeeId: teacher.employeeId,
                specialization: teacher.specialization,
                schoolId: teacher.user.schoolId,
            },
        });
    } catch (error) {
        console.error("Error fetching teacher dashboard data:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard data" },
            { status: 500 }
        );
    }
}
