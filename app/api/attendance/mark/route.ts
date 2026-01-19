import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, AttendanceStatus } from "@prisma/client";
import { z } from "zod";

// Validation schema
const markAttendanceSchema = z.object({
    classId: z.string(),
    date: z.string(),
    attendance: z.array(
        z.object({
            studentId: z.string(),
            status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
            remarks: z.string().optional(),
        })
    ),
});

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req, [UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN]);

        if (!auth.authenticated || !auth.authorized || !auth.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { user } = auth;
        const body = await req.json();

        // Validate input
        const validationResult = markAttendanceSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Invalid input data", details: validationResult.error.errors },
                { status: 400 }
            );
        }

        const { classId, date, attendance } = validationResult.data;

        // Get current academic session
        const currentSession = await prisma.academicSession.findFirst({
            where: {
                schoolId: user.schoolId!,
                isCurrent: true,
            },
            select: {
                id: true,
            },
        });

        if (!currentSession) {
            return NextResponse.json(
                { error: "No active academic session found" },
                { status: 404 }
            );
        }

        // If user is a teacher, verify they are assigned to this class
        if (user.role === UserRole.TEACHER) {
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

            const classData = await prisma.class.findUnique({
                where: { id: classId },
                select: { teacherId: true },
            });

            if (!classData || classData.teacherId !== teacher.id) {
                return NextResponse.json(
                    { error: "You are not assigned to this class" },
                    { status: 403 }
                );
            }
        }

        // Parse date
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        // Use transaction to ensure all attendance records are created/updated together
        const result = await prisma.$transaction(async (tx) => {
            const records = [];

            for (const record of attendance) {
                const attendanceRecord = await tx.attendance.upsert({
                    where: {
                        studentId_date_sessionId: {
                            studentId: record.studentId,
                            date: attendanceDate,
                            sessionId: currentSession.id,
                        },
                    },
                    update: {
                        status: record.status as AttendanceStatus,
                        remarks: record.remarks || null,
                    },
                    create: {
                        studentId: record.studentId,
                        date: attendanceDate,
                        status: record.status as AttendanceStatus,
                        sessionId: currentSession.id,
                        remarks: record.remarks || null,
                    },
                });

                records.push(attendanceRecord);
            }

            return records;
        });

        return NextResponse.json({
            message: "Attendance marked successfully",
            count: result.length,
        });
    } catch (error) {
        console.error("[MARK_ATTENDANCE]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// GET attendance for a specific class and date
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);

        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { user } = auth;
        const { searchParams } = new URL(req.url);
        const classId = searchParams.get("classId");
        const date = searchParams.get("date");

        if (!classId || !date) {
            return NextResponse.json(
                { error: "classId and date are required" },
                { status: 400 }
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
            },
        });

        if (!currentSession) {
            return NextResponse.json(
                { error: "No active academic session found" },
                { status: 404 }
            );
        }

        // Parse date
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        // Get students in class
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

        // Get attendance records for this date
        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                studentId: { in: students.map((s) => s.studentId) },
                date: attendanceDate,
                sessionId: currentSession.id,
            },
        });

        // Create a map for quick lookup
        const attendanceMap = new Map(
            attendanceRecords.map((record) => [record.studentId, record])
        );

        // Format response
        const studentsWithAttendance = students.map((sc) => ({
            id: sc.student.id,
            userId: sc.student.user.id,
            name: sc.student.user.name,
            email: sc.student.user.email,
            profileImage: sc.student.user.profileImage,
            rollNumber: sc.rollNumber,
            attendance: attendanceMap.get(sc.studentId) || null,
        }));

        return NextResponse.json({
            students: studentsWithAttendance,
            date: attendanceDate,
            classId,
        });
    } catch (error) {
        console.error("[GET_ATTENDANCE]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
