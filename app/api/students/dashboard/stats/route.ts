import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { AttendanceStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== "STUDENT") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 1. Find the student record associated with the user
        const student = await db.student.findUnique({
            where: { userId: session.id },
            include: {
                classes: {
                    where: { status: "ACTIVE" },
                    include: {
                        class: {
                            include: {
                                level: true,
                            },
                        },
                        session: true,
                    },
                },
                attendance: {
                    orderBy: { date: "desc" },
                    take: 30, // Last 30 days of attendance
                },
                results: {
                    include: {
                        subject: true,
                    },
                    orderBy: { updatedAt: "desc" },
                },
                subjects: {
                    include: {
                        subject: true,
                    },
                },
                user: {
                    select: {
                        schoolId: true,
                    },
                },
            },
        });

        if (!student) {
            return NextResponse.json({ message: "Student record not found" }, { status: 404 });
        }

        // 1.5 Fetch School Events/Announcements
        const announcements = await db.event.findMany({
            where: {
                schoolId: student.user.schoolId as string,
                isPublic: true,
            },
            orderBy: {
                startDate: 'desc',
            },
            take: 5,
        });

        // 2. Calculate stats
        const totalAttendance = student.attendance.length;
        const presentCount = student.attendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
        const attendancePercentage = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

        // Academic performance (Average of all published results)
        const publishedResults = student.results;
        const totalScore = publishedResults.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
        const averageScore = publishedResults.length > 0 ? totalScore / publishedResults.length : 0;

        // Current Class
        const currentClassRecord = student.classes[0];
        const className = currentClassRecord ? `${currentClassRecord.class.name}${currentClassRecord.class.section ? ` ${currentClassRecord.class.section}` : ""}` : "Unassigned";
        const levelName = currentClassRecord?.class.level?.name || "N/A";

        const stats = {
            attendancePercentage: Math.round(attendancePercentage),
            averagePerformance: Math.round(averageScore),
            totalSubjects: student.subjects.length,
            currentClass: className,
            currentLevel: levelName,
            attendanceHistory: student.attendance.map(a => ({
                date: a.date,
                status: a.status,
            })),
            recentResults: publishedResults.slice(0, 5).map(r => ({
                subject: r.subject.name,
                total: r.total,
                grade: r.grade,
                remark: r.remark,
            })),
            announcements: announcements.map(a => ({
                id: a.id,
                title: a.title,
                description: a.description,
                date: a.startDate,
                location: a.location,
            })),
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Error fetching student dashboard stats:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
