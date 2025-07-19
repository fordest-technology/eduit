import { getSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import { StudentsClient } from "./students-client"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { logger } from "@/lib/logger"
import { PerformanceMonitor } from "@/components/ui/performance-monitor"

export const metadata = {
    title: "Students | EduIT",
    description: "Manage student profiles and track academic progress",
}

export default async function StudentsPage() {
    const startTime = Date.now()

    try {
        logger.info("Starting students page data fetch")

        const session = await getSession()

        if (!session) {
            logger.warn("No session found, redirecting to login")
            redirect("/login")
        }

        // Check if user has required role
        const allowedRoles = ['super_admin', 'school_admin', 'teacher']
        const userRole = session.role?.toLowerCase()
        if (!userRole || !allowedRoles.includes(userRole)) {
            logger.warn("Unauthorized access attempt", { userRole, userId: session.id })
            redirect("/dashboard")
        }

        logger.info("Fetching students data", { schoolId: session.schoolId, userRole })

        // Find the current academic session
        const currentSession = await prisma.academicSession.findFirst({
            where: {
                schoolId: session.schoolId,
                isCurrent: true,
            },
        })

        if (!currentSession) {
            logger.error("No current academic session found", { schoolId: session.schoolId })
            throw new Error("No current academic session found")
        }

        // Fetch students with optimized query
        const students = await prisma.student.findMany({
            where: {
                user: {
                    schoolId: session.schoolId,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true,
                    },
                },
                classes: {
                    where: {
                        sessionId: currentSession.id,
                        status: "ACTIVE",
                    },
                    include: {
                        class: {
                            select: {
                                id: true,
                                name: true,
                                section: true,
                                level: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                parents: {
                    select: {
                        parent: {
                            select: {
                                user: {
                                    select: {
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                user: {
                    name: "asc",
                },
            },
        })

        const queryTime = Date.now() - startTime
        logger.query("Students data fetch", queryTime, {
            studentCount: students.length,
            schoolId: session.schoolId
        })

        // Transform the data to include current class information
        const transformedStudents = students.map((student) => {
            const currentClass = student.classes.find((c) => c.status === "ACTIVE")

            return {
                id: student.id,
                name: student.user.name,
                email: student.user.email,
                profileImage: student.user.profileImage,
                rollNumber: currentClass?.rollNumber || "",
                classes: student.classes.map((sc) => ({
                    id: sc.id,
                    class: {
                        id: sc.class.id,
                        name: sc.class.name,
                        section: sc.class.section || undefined,
                        level: sc.class.level || { id: "", name: "" }
                    }
                })),
                currentClass: currentClass
                    ? {
                        id: currentClass.class.id,
                        name: currentClass.class.name,
                        level: currentClass.class.level || { id: "", name: "" }
                    }
                    : undefined,
                hasParents: student.parents.length > 0,
                parentNames: student.parents.map((p) => p.parent.user.name).join(", "),
                schoolId: session.schoolId,
            }
        })

        // Calculate stats efficiently
        const stats = {
            total: transformedStudents.length,
            classes: transformedStudents.filter((s) => s.currentClass).length,
            withParents: transformedStudents.filter((s) => s.hasParents).length,
            levels: new Set(
                transformedStudents
                    .filter((s) => s.currentClass?.level?.id)
                    .map((s) => s.currentClass!.level!.id)
            ).size,
            active: transformedStudents.filter((s) => s.currentClass).length,
        }

        const totalTime = Date.now() - startTime
        logger.api("Students page load", totalTime, {
            studentCount: students.length,
            stats,
            userRole
        })

        return (
            <PerformanceMonitor pageName="Students">
                <div className="space-y-6">
                    <DashboardHeader
                        heading="Students"
                        text="Manage student profiles and track academic progress"
                        showBanner={true}
                    />

                    <StudentsClient
                        students={transformedStudents}
                        stats={stats}
                        error={undefined}
                    />
                </div>
            </PerformanceMonitor>
        )
    } catch (error) {
        const totalTime = Date.now() - startTime
        logger.error("Error loading students page", error, { totalTime })

        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-destructive">
                    {error instanceof Error ? error.message : "An unexpected error occurred"}
                </p>
                <a href="/dashboard" className="text-blue-600 hover:underline">
                    Back to Dashboard
                </a>
            </div>
        )
    }
} 