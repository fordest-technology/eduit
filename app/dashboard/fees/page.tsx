import type { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { FeeDashboardContent } from "@/app/dashboard/fees/_components/fee-dashboard-content"
import { ParentFeeDashboard } from "./_components/parent-fee-dashboard"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { BillStatus, UserRole } from "@prisma/client"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
    title: "Fee Management",
    description: "Manage student fees and payments",
}

interface AdminFeeData {
    bills: any[];
    paymentAccounts: any[];
    pendingPayments: any[];
    classes: any[];
    students: any[];
    feeSummary: {
        totalBilled: number;
        totalPaid: number;
        totalPending: number;
        totalOverdue: number;
        pendingRequests: number;
    };
}

interface ParentFeeData {
    children: any[];
    bills: any[];
    paymentAccounts: any[];
    paymentRequests: any[];
    paymentHistory: any[];
    stats: {
        totalBilled: number;
        totalPaid: number;
        pendingPayments: number;
        approvedPayments: number;
        remainingBalance: number;
    };
}

async function getAdminFeeData(schoolId: string): Promise<AdminFeeData> {
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

async function getParentFeeData(parentId: string): Promise<ParentFeeData> {
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
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            include: {
                admin: true,
            },
        });

        if (!user) {
            redirect("/login");
        }

        let feeData: AdminFeeData | ParentFeeData;
        if (user.role === UserRole.PARENT) {
            feeData = await getParentFeeData(user.id);
        } else {
            feeData = await getAdminFeeData(user.schoolId!);
        }

        return (
            <div className="flex flex-col gap-4">
                <DashboardHeader
                    heading="Fee Management"
                    text="Manage student fees and payments"
                />
                {user.role === UserRole.PARENT ? (
                    <ParentFeeDashboard data={feeData as ParentFeeData} />
                ) : (
                    <FeeDashboardContent data={feeData as AdminFeeData} />
                )}
            </div>
        );
    } catch (error: any) {
        console.error("Error fetching fee data:", error);

        // Handle specific Prisma errors
        if (error?.code === 'P1017' || error?.code === 'P2021') {
            // If it's a connection error, try to reconnect
            await prisma.$disconnect();
            await prisma.$connect();

            // Retry the operation
            return FeeDashboardPage();
        }

        // For other errors, show a user-friendly error message
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <h2 className="text-2xl font-semibold">Error Loading Fee Data</h2>
                <p className="text-muted-foreground">
                    There was an error loading the fee data. Please try again later.
                </p>
                <Button onClick={() => window.location.reload()}>
                    Try Again
                </Button>
            </div>
        );
    }
}

