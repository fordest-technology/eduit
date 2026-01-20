import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req, [UserRole.TEACHER]);

        if (!auth.authenticated || !auth.authorized || !auth.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
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

        // Get teacher's classes
        const classes = await prisma.class.findMany({
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

        const classIds = classes.map((c) => c.id);

        // Get total students across all classes
        const totalStudents = await prisma.studentClass.count({
            where: {
                classId: { in: classIds },
                sessionId: currentSession.id,
                status: "ACTIVE",
            },
        });

        // Get subjects taught by this teacher
        const subjects = await prisma.subjectTeacher.count({
            where: {
                teacherId: teacher.id,
            },
        });

        // Get pending results (results not yet submitted for current session)
        const studentsInClasses = await prisma.studentClass.findMany({
            where: {
                classId: { in: classIds },
                sessionId: currentSession.id,
                status: "ACTIVE",
            },
            select: {
                studentId: true,
            },
        });

        const studentIds = studentsInClasses.map((sc) => sc.studentId);

        // Get subjects this teacher teaches
        const teacherSubjects = await prisma.subjectTeacher.findMany({
            where: {
                teacherId: teacher.id,
            },
            select: {
                subjectId: true,
            },
        });

        const subjectIds = teacherSubjects.map((ts) => ts.subjectId);

        // Get current result period
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

        let pendingResults = 0;
        if (currentPeriod && studentIds.length > 0 && subjectIds.length > 0) {
            // Count total expected results
            const totalExpected = studentIds.length * subjectIds.length;

            // Count existing results
            const existingResults = await prisma.result.count({
                where: {
                    studentId: { in: studentIds },
                    subjectId: { in: subjectIds },
                    periodId: currentPeriod.id,
                    sessionId: currentSession.id,
                },
            });

            pendingResults = totalExpected - existingResults;
        }

        // Get pending attendance (today's attendance not marked)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const markedAttendanceToday = await prisma.attendance.count({
            where: {
                date: {
                    gte: today,
                },
                studentId: { in: studentIds },
                sessionId: currentSession.id,
            },
        });

        const pendingAttendance = studentIds.length - markedAttendanceToday;

        // Calculate average class performance
        let averagePerformance = 0;
        if (currentPeriod && studentIds.length > 0 && subjectIds.length > 0) {
            const results = await prisma.result.findMany({
                where: {
                    studentId: { in: studentIds },
                    subjectId: { in: subjectIds },
                    periodId: currentPeriod.id,
                    sessionId: currentSession.id,
                },
                select: {
                    total: true,
                },
            });

            if (results.length > 0) {
                const totalScore = results.reduce((sum, r) => sum + r.total, 0);
                averagePerformance = Math.round((totalScore / results.length) * 10) / 10;
            }
        }

        const stats = {
            totalStudents,
            totalClasses: classes.length,
            totalSubjects: subjects,
            pendingResults: Math.max(0, pendingResults),
            pendingAttendance: Math.max(0, pendingAttendance),
            averagePerformance,
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error("[TEACHER_DASHBOARD_STATS]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
