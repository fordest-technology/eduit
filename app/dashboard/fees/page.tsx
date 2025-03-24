import type { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { FeeDashboardContent } from "@/app/dashboard/fees/_components/fee-dashboard-content"
// import { ParentFeeDashboard } from "@/app/dashboard/fees/_components/parent-fee-dashboard"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { BillStatus, UserRole } from "@prisma/client"
import { ParentFeeDashboard } from "./_components/parent-fee-dashboard (1)"
// import { ParentFeeDashboard } from "./_components/parent-fee-dashboard"

export const metadata: Metadata = {
    title: "Fee Management",
    description: "Manage student fees and payments",
}

async function getAdminFeeData(schoolId: string) {
    // Get all bills for the school
    const bills = await prisma.bill.findMany({
        where: { schoolId },
        include: {
            account: true,
            assignments: {
                include: {
                    studentPayments: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    })

    // Get all payment accounts for the school
    const paymentAccounts = await prisma.paymentAccount.findMany({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
    })

    // Get all payment requests with pending status
    const pendingPayments = await prisma.paymentRequest.findMany({
        where: {
            status: "PENDING",
            billAssignment: {
                bill: { schoolId },
            },
        },
        include: {
            billAssignment: {
                include: {
                    bill: {
                        include: {
                            account: true,
                        },
                    },
                },
            },
            student: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    })

    // Get all classes for the school
    const classes = await prisma.class.findMany({
        where: { schoolId },
        orderBy: { name: "asc" },
    })

    // Get all students for the school
    const students = await prisma.student.findMany({
        where: {
            user: { schoolId },
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
            classes: {
                include: {
                    class: true,
                },
            },
        },
        orderBy: { user: { name: "asc" } },
    })

    // Calculate fee statistics
    const feeSummary = {
        totalBilled: bills.reduce((sum, bill) => sum + bill.amount * bill.assignments.length, 0),
        totalPaid: bills.reduce((sum, bill) => {
            const assignmentsPaid = bill.assignments.reduce((assignmentSum, assignment) => {
                return (
                    assignmentSum +
                    assignment.studentPayments.reduce((paymentSum, payment) => {
                        return paymentSum + payment.amountPaid
                    }, 0)
                )
            }, 0)
            return sum + assignmentsPaid
        }, 0),
        totalPending: bills.reduce((sum, bill) => {
            const assignmentsPending = bill.assignments.filter(
                (assignment) => assignment.status === BillStatus.PENDING || assignment.status === BillStatus.PARTIALLY_PAID,
            ).length
            return sum + assignmentsPending * bill.amount
        }, 0),
        totalOverdue: bills.reduce((sum, bill) => {
            const assignmentsOverdue = bill.assignments.filter(
                (assignment) => assignment.status === BillStatus.OVERDUE,
            ).length
            return sum + assignmentsOverdue * bill.amount
        }, 0),
        pendingRequests: pendingPayments.length,
    }

    return {
        bills,
        paymentAccounts,
        pendingPayments,
        classes,
        students,
        feeSummary,
    }
}

async function getParentFeeData(parentId: string) {
    // Get parent's students (children)
    const children = await prisma.studentParent.findMany({
        where: { parentId },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                    classes: {
                        include: {
                            class: true,
                        },
                    },
                },
            },
        },
    })

    // Get school ID from any of the children
    let schoolId
    if (children.length > 0) {
        const studentId = children[0].studentId
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                user: {
                    select: {
                        schoolId: true,
                    },
                },
            },
        })
        schoolId = student?.user.schoolId
    }

    // If no children or no school ID, return empty arrays
    if (!schoolId || children.length === 0) {
        return {
            children: [],
            bills: [],
            paymentAccounts: [],
            paymentRequests: [],
            paymentHistory: [],
            stats: {
                totalBilled: 0,
                totalPaid: 0,
                pendingPayments: 0,
                approvedPayments: 0,
                remainingBalance: 0
            }
        }
    }

    // Get active payment accounts
    const paymentAccounts = await prisma.paymentAccount.findMany({
        where: {
            schoolId,
            isActive: true,
        },
    })

    // Get all bills assigned to the parent's children
    const studentIds = children.map((child) => child.studentId)
    const classes = await prisma.studentClass.findMany({
        where: {
            studentId: {
                in: studentIds,
            },
        },
        select: {
            classId: true,
        },
    })
    const classIds = classes.map((cls) => cls.classId)

    // Find bills through assignments where the target is either the student or their class
    const bills = await prisma.bill.findMany({
        where: {
            schoolId,
            assignments: {
                some: {
                    OR: [
                        {
                            targetType: "STUDENT",
                            targetId: {
                                in: studentIds,
                            },
                        },
                        {
                            targetType: "CLASS",
                            targetId: {
                                in: classIds,
                            },
                        },
                    ],
                },
            },
        },
        include: {
            account: true,
            assignments: {
                where: {
                    OR: [
                        {
                            targetType: "STUDENT",
                            targetId: {
                                in: studentIds,
                            },
                        },
                        {
                            targetType: "CLASS",
                            targetId: {
                                in: classIds,
                            },
                        },
                    ],
                },
                include: {
                    studentPayments: {
                        where: {
                            studentId: {
                                in: studentIds,
                            },
                        },
                    },
                },
            },
        },
    })

    // Get payment requests for the parent's children
    const paymentRequests = await prisma.paymentRequest.findMany({
        where: {
            studentId: {
                in: studentIds,
            },
        },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
            billAssignment: {
                include: {
                    bill: {
                        include: {
                            account: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    // Calculate payment statistics
    const totalBilled = bills.reduce((sum, bill) => {
        return sum + bill.assignments.length * bill.amount
    }, 0)

    const totalPaid = bills.reduce((sum, bill) => {
        return (
            sum +
            bill.assignments.reduce((assignmentSum, assignment) => {
                return (
                    assignmentSum +
                    assignment.studentPayments.reduce((paymentSum, payment) => {
                        return paymentSum + payment.amountPaid
                    }, 0)
                )
            }, 0)
        )
    }, 0)

    const pendingPayments = paymentRequests.filter((req) => req.status === "PENDING").length
    const approvedPayments = paymentRequests.filter((req) => req.status === "APPROVED").length

    return {
        children: children.map((child) => child.student),
        bills,
        paymentAccounts,
        paymentRequests,
        paymentHistory: paymentRequests,
        stats: {
            totalBilled,
            totalPaid,
            pendingPayments,
            approvedPayments,
            remainingBalance: totalBilled - totalPaid,
        },
    }
}

export default async function FeeDashboardPage() {
    const session = await getSession(null)

    if (!session) {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.id },
        include: {
            admin: true,
            parent: true,
        },
    })

    if (!user || !user.schoolId) {
        redirect("/login")
    }

    // Check user role based on the role field, admin and parent relationship
    const isAdmin = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.SCHOOL_ADMIN || !!user.admin
    const isParent = user.role === UserRole.PARENT || !!user.parent

    if (isAdmin) {
        const feeData = await getAdminFeeData(user.schoolId)

        return (
            <div className="space-y-6">
                <DashboardHeader
                    heading="Fee Management"
                    text="Manage school fees, payment accounts, and process payment requests"
                />
                <FeeDashboardContent data={feeData} />
            </div>
        )
    } else if (isParent) {
        const parentData = await getParentFeeData(user.parent?.id || user.id)

        return (
            <div className="space-y-6">
                <DashboardHeader heading="School Fees" text="Make payments and view payment history for your children" />
                <ParentFeeDashboard data={parentData} />
            </div>
        )
    }

    // Fallback for other roles
    return (
        <div className="space-y-6">
            <DashboardHeader heading="Fee Management" text="View and manage school fees" />
            <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Access Restricted</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                            <p>You don't have permission to access the fee management system. Please contact your administrator.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

