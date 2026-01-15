import { getSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import { ParentDashboard } from "./_components/parent-dashboard"
import { DashboardHeader } from "@/app/components/dashboard-header"

export const metadata = {
    title: "Parent Dashboard | EduIT",
    description: "Monitor your children's academic progress, fees, and school activities",
}

export default async function ParentDashboardPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    if (session.role !== "PARENT") {
        redirect("/dashboard")
    }

    // Fetch children linked to this parent
    const children = await prisma.studentParent.findMany({
        where: {
            parentId: session.id
        },
        include: {
            student: {
                include: {
                    user: true,
                    classes: {
                        include: {
                            class: {
                                include: {
                                    level: true
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    // Get all school IDs from the children to fetch relevant events, bills, etc.
    const childSchoolIds = Array.from(new Set(
        children.map(c => c.student.user.schoolId).filter(Boolean) as string[]
    ))

    // Fetch upcoming events from all relevant schools
    const upcomingEvents = await prisma.event.findMany({
        where: {
            schoolId: { in: childSchoolIds },
            endDate: {
                gte: new Date()
            }
        },
        orderBy: {
            startDate: 'asc'
        },
        take: 5
    })

    // Fetch fee information
    const studentIds = children.map(child => child.student.id)

    // Fetch bills assigned to the children or their classes from all relevant schools
    const bills = await prisma.bill.findMany({
        where: {
            schoolId: { in: childSchoolIds },
            assignments: {
                some: {
                    OR: [
                        {
                            targetType: "STUDENT",
                            targetId: { in: studentIds }
                        },
                        {
                            targetType: "CLASS",
                            targetId: {
                                in: children.flatMap(child =>
                                    child.student.classes.map(c => c.classId)
                                )
                            }
                        }
                    ]
                }
            }
        },
        include: {
            assignments: true
        }
    })

    // Fetch payment accounts from all relevant schools
    const paymentAccounts = await prisma.paymentAccount.findMany({
        where: {
            schoolId: { in: childSchoolIds },
            isActive: true
        }
    })

    // Fetch payment requests
    const paymentRequests = await prisma.paymentRequest.findMany({
        where: {
            studentId: { in: studentIds }
        },
        include: {
            processedBy: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    // Fetch approved results
    const approvedResults = await prisma.result.findMany({
        where: {
            studentId: { in: studentIds },
            approvedById: { not: null }
        },
        include: {
            student: {
                include: {
                    user: true
                }
            },
            subject: true
        },
        orderBy: {
            updatedAt: 'desc'
        },
        take: 10
    })

    // Calculate stats
    const totalBilled = bills.reduce((sum, bill) => {
        const assignedToChildren = bill.assignments.filter(assignment =>
            (assignment.targetType === "STUDENT" && studentIds.includes(assignment.targetId)) ||
            (assignment.targetType === "CLASS" && children.some(child =>
                child.student.classes.some(c => c.classId === assignment.targetId)
            ))
        )

        return sum + (assignedToChildren.length > 0 ? bill.amount : 0)
    }, 0)

    const totalPaid = paymentRequests
        .filter(req => req.status === "APPROVED")
        .reduce((sum, req) => sum + req.amount, 0)

    const pendingPayments = paymentRequests.filter(req => req.status === "PENDING").length
    const approvedPayments = paymentRequests.filter(req => req.status === "APPROVED").length
    const remainingBalance = Math.max(0, totalBilled - totalPaid)

    // Transform data for the components
    const formattedPaymentRequests = paymentRequests.map(request => ({
        ...request,
        reviewedBy: request.processedBy,
        reviewedAt: request.processedAt,
        reviewNotes: request.notes
    }))

    const formattedResults = approvedResults.map(result => ({
        ...result,
        term: { id: "current", name: "Current Term" },
        status: "APPROVED"
    }))

    const dashboardData = {
        children: children.map(child => child.student),
        bills,
        paymentAccounts,
        paymentRequests: formattedPaymentRequests,
        paymentHistory: formattedPaymentRequests,
        approvedResults: formattedResults,
        upcomingEvents,
        stats: {
            totalBilled,
            totalPaid,
            pendingPayments,
            approvedPayments,
            remainingBalance
        }
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <DashboardHeader
                heading="Parent Dashboard"
                text="Monitor your children's academic progress, fees, and school activities"
            />
            <ParentDashboard data={dashboardData} />
        </div>
    )
} 