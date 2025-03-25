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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CreditCard, DollarSign, FileText, AlertCircle, CheckCircle, Clock, Plus } from "lucide-react"
import { formatCurrency } from "@/app/lib/utils"
import { Button } from "@/components/ui/button"
// import { formatCurrency } from "@/lib/utils"

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

    // Fetch school theme color
    const school = await prisma.school.findUnique({
        where: { id: user.schoolId },
        select: { primaryColor: true, secondaryColor: true } // Adjusted to match existing properties
    })

    const themeColor = school?.primaryColor || 'blue' // Fallback to 'blue' if primaryColor is not available

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
                    showBanner={true}
                // color={themeColor}
                />

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium flex items-center text-blue-700">
                                <DollarSign className="mr-2 h-5 w-5" />
                                Total Billed
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-blue-800">
                                {formatCurrency(feeData.feeSummary.totalBilled)}
                            </p>
                            <p className="text-sm text-blue-600 mt-1">Total fees billed</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium flex items-center text-purple-700">
                                <CheckCircle className="mr-2 h-5 w-5" />
                                Total Paid
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-purple-800">
                                {formatCurrency(feeData.feeSummary.totalPaid)}
                            </p>
                            <p className="text-sm text-purple-600 mt-1">Total payments received</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium flex items-center text-emerald-700">
                                <Clock className="mr-2 h-5 w-5" />
                                Pending
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-emerald-800">
                                {formatCurrency(feeData.feeSummary.totalPending)}
                            </p>
                            <p className="text-sm text-emerald-600 mt-1">Awaiting payment</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Card */}
                <Card className="border-primary/10 shadow-md">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Fee Bills</CardTitle>
                                <CardDescription>Manage and track all fee bills</CardDescription>
                            </div>
                            <Button className="inline-flex items-center justify-center">
                                <Plus className="mr-2 h-4 w-4" /> Create New Bill
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <FeeDashboardContent data={feeData} />
                    </CardContent>
                </Card>

                {/* Payment Accounts Section */}
                <Card className="border-primary/10">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Payment Accounts</CardTitle>
                                <CardDescription>Manage school payment accounts</CardDescription>
                            </div>
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" /> Add Account
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Payment accounts content */}
                    </CardContent>
                </Card>

                {/* Payment Requests Section */}
                <Card className="border-primary/10">
                    <CardHeader>
                        <CardTitle>Payment Requests</CardTitle>
                        <CardDescription>Review and process payment requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Payment requests content */}
                    </CardContent>
                </Card>
            </div>
        )
    } else if (isParent) {
        const parentData = await getParentFeeData(user.parent?.id || user.id)

        return (
            <div className="space-y-6">
                <DashboardHeader
                    heading="School Fees"
                    text="Make payments and view payment history for your children"
                    showBanner={true}
                />

                {/* Parent Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium flex items-center text-blue-700">
                                <FileText className="mr-2 h-5 w-5" />
                                Total Billed
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-blue-800">
                                {formatCurrency(parentData.stats.totalBilled)}
                            </p>
                            <p className="text-sm text-blue-600 mt-1">Total fees billed</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium flex items-center text-purple-700">
                                <CheckCircle className="mr-2 h-5 w-5" />
                                Total Paid
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-purple-800">
                                {formatCurrency(parentData.stats.totalPaid)}
                            </p>
                            <p className="text-sm text-purple-600 mt-1">Total payments made</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium flex items-center text-emerald-700">
                                <CreditCard className="mr-2 h-5 w-5" />
                                Balance Due
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-emerald-800">
                                {formatCurrency(parentData.stats.remainingBalance)}
                            </p>
                            <p className="text-sm text-emerald-600 mt-1">Outstanding balance</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Parent Main Content */}
                <Card className="border-primary/10 shadow-md">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <CardTitle>Outstanding Bills</CardTitle>
                        <CardDescription>View and pay pending bills</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <ParentFeeDashboard data={parentData} />
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Fallback for other roles
    return (
        <div className="space-y-6">
            <DashboardHeader heading="Fee Management" text="View and manage school fees" />
            <Card className="border border-yellow-200">
                <CardHeader className="bg-yellow-50 border-b border-yellow-200">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                            <CardTitle className="text-sm font-medium text-yellow-800">Access Restricted</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="bg-yellow-50">
                    <p className="text-sm text-yellow-700">
                        You don't have permission to access the fee management system. Please contact your administrator.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

