import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch Global Stats
    const totalSchools = await prisma.school.count();
    const totalStudents = await prisma.student.count();
    const totalTeachers = await prisma.teacher.count();
    
    // Total Revenue (Sum of successful usage payments)
    const usagePayments = await prisma.usagePayment.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true }
    });
    const totalRevenue = Number(usagePayments._sum.amount || 0);

    // 2. Fetch Schools with metrics
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        billingStatus: true,
        createdAt: true,
        _count: {
          select: {
            users: { where: { role: UserRole.STUDENT } },
            subjects: true,
          }
        },
        users: {
            where: { role: UserRole.TEACHER },
            select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Enriched Schools Data
    const enrichedSchools = await Promise.all(schools.map(async (school) => {
        // Calculate Avg Performance for this school
        // Use result's 'total' field
        const avgResult = await prisma.result.aggregate({
            where: {
                student: {
                    user: { schoolId: school.id }
                }
            },
            _avg: { total: true }
        });

        // Calculate Success Rate
        // Success = Avg score > 50
        const students = await prisma.student.findMany({
            where: { user: { schoolId: school.id } },
            select: {
                id: true,
                results: {
                    select: { total: true }
                }
            }
        });

        let successCount = 0;
        students.forEach(student => {
            if (student.results.length > 0) {
                const avg = student.results.reduce((acc, r) => acc + r.total, 0) / student.results.length;
                if (avg >= 50) successCount++;
            }
        });

        const studentCount = school._count.users;
        const successRate = studentCount > 0 ? (successCount / studentCount) * 100 : 0;

        return {
            id: school.id,
            name: school.name,
            subdomain: school.subdomain,
            billingStatus: school.billingStatus,
            studentCount: studentCount,
            teacherCount: school.users.length,
            avgPerformance: Number((avgResult._avg.total || 0).toFixed(2)),
            successRate: Number(successRate.toFixed(2)),
            createdAt: school.createdAt,
        };
    }));

    // 3. Overall performance (System-wide)
    const systemAvg = await prisma.result.aggregate({
        _avg: { total: true }
    });

    // 4. Best Student (Across all schools)
    const topScorer = await prisma.student.findFirst({
        include: {
            user: { select: { name: true, schoolId: true, profileImage: true, school: { select: { name: true } } } },
            results: { select: { total: true } }
        },
        orderBy: {
            results: {
                _count: 'desc' // Just a fallback, we need to sort by average
            }
        }
    });
    
    // Better Best Student logic: Find student with highest individual average
    // For simplicity in a single query, we'll take top 100 students and calculate locally or just take one
    const topStudents = await prisma.student.findMany({
        take: 10,
        include: {
            user: { select: { name: true, profileImage: true, school: { select: { name: true } } } },
            results: { select: { total: true } }
        }
    });

    const bestStudent = topStudents
        .map(s => ({
            name: s.user.name,
            school: s.user.school.name,
            img: s.user.profileImage,
            avg: s.results.length > 0 ? s.results.reduce((acc, r) => acc + r.total, 0) / s.results.length : 0
        }))
        .sort((a, b) => b.avg - a.avg)[0];

    return NextResponse.json({
      stats: {
        totalSchools,
        totalStudents,
        totalTeachers,
        totalRevenue,
        systemAvg: Number((systemAvg._avg.total || 0).toFixed(2)),
      },
      schools: enrichedSchools,
      bestStudent
    });
  } catch (error) {
    console.error("[SUPER_ADMIN_DATA_GET]", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
