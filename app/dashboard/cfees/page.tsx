// import { DashboardHeader } from "@/components/dashboard-header"
import { ParentFeeDashboard } from "../fees/_components/parent-fee-dashboard"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { UserRole, Bill, BillAssignment, PaymentRequest, Student, Class, User, PaymentAccount } from "@prisma/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { PaymentAccountBanner } from "@/components/payment-account-banner"

interface ParentFeesPageProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

// Define extended types for our data structures
interface ExtendedBillAssignment extends BillAssignment {
    studentPayments: {
        amountPaid: number;
    }[];
}

interface ExtendedBill extends Bill {
    assignments: ExtendedBillAssignment[];
}

interface ExtendedStudent extends Student {
    user: User;
    classes: {
        class: Class;
    }[];
    paymentRequests: (PaymentRequest & {
        bill: Bill;
        billAssignment: BillAssignment;
        studentPayment: {
            amountPaid: number;
        } | null;
    })[];
}

interface ExtendedChild {
    student: ExtendedStudent;
}

export default async function ParentFeesPage({ searchParams }: ParentFeesPageProps) {
    const session = await getSession()

    if (!session) {
        redirect("/auth/login")
    }

    // Check if user is a parent
    if (session.role !== UserRole.PARENT) {
        redirect("/dashboard")
    }

    // Get parent data with children and their bills
    const parent = await prisma.parent.findUnique({
        where: { userId: session.id },
        include: {
            children: {
                include: {
                    student: {
                        include: {
                            user: true,
                            classes: {
                                include: {
                                    class: true
                                }
                            },
                            paymentRequests: {
                                include: {
                                    bill: true,
                                    billAssignment: true,
                                    studentPayment: true
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    // Fetch all bills and their assignments for the school
    const bills = await prisma.bill.findMany({
        where: {
            schoolId: session.schoolId,
            // Get bills that have active assignments
            assignments: {
                some: {
                    OR: [
                        { targetType: "STUDENT" },
                        { targetType: "CLASS" }
                    ]
                }
            }
        },
        include: {
            assignments: {
                include: {
                    studentPayments: true
                }
            }
        }
    }) as ExtendedBill[]

    // Fetch the active payment account for the parent's school
    const activeAccount = session.schoolId
        ? await prisma.paymentAccount.findFirst({
            where: {
                schoolId: session.schoolId,
                isActive: true
            },
            orderBy: { updatedAt: "desc" }
        })
        : null

    if (!parent?.children.length) {
        return (
            <div className="space-y-6">
                {activeAccount && (
                    <Alert className="bg-blue-50 border-blue-200 text-blue-900">
                        <AlertTitle>Active Payment Account</AlertTitle>
                        <AlertDescription>
                            <div className="flex flex-col gap-1">
                                <span><b>Account Name:</b> {activeAccount.name}</span>
                                <span><b>Bank Name:</b> {activeAccount.bankName}</span>
                                <span className="flex items-center gap-2">
                                    <b>Account Number:</b> {activeAccount.accountNo}
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => navigator.clipboard.writeText(activeAccount.accountNo)}
                                        className="h-6 w-6"
                                        aria-label="Copy account number"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </span>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}
                <DashboardHeader
                    heading="Fee Management"
                    text="View and manage school fees for your children"
                    showBanner={true}
                />
                <div className="rounded-lg border bg-card p-8 text-card-foreground shadow-sm">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <h2 className="text-xl font-bold">No Children Found</h2>
                        <p className="text-center text-muted-foreground">
                            You don't have any children registered in the system.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // Calculate payment statistics
    let totalBilled = 0
    let totalPaid = 0

    // Process bills and assignments for each child
    const children = parent.children.map((child: ExtendedChild) => {
        const student = child.student
        const studentId = student.id
        const classIds = student.classes.map(c => c.class.id)

        // Find all bill assignments for this student
        const studentBills = bills.filter(bill =>
            bill.assignments.some(assignment =>
                (assignment.targetType === "STUDENT" && assignment.targetId === studentId) ||
                (assignment.targetType === "CLASS" && classIds.includes(assignment.targetId))
            )
        )

        // Calculate totals for this student
        studentBills.forEach(bill => {
            const assignment = bill.assignments.find(a =>
                (a.targetType === "STUDENT" && a.targetId === studentId) ||
                (a.targetType === "CLASS" && classIds.includes(a.targetId))
            )
            if (assignment) {
                totalBilled += bill.amount
                totalPaid += assignment.studentPayments.reduce((sum: number, payment) => sum + payment.amountPaid, 0)
            }
        })

        return {
            ...student,
            bills: studentBills
        }
    })

    // Transform data for the dashboard
    const data = {
        children,
        bills,
        paymentAccounts: activeAccount ? [activeAccount] : [],
        paymentRequests: parent.children.flatMap(c => c.student.paymentRequests),
        paymentHistory: parent.children.flatMap(c => c.student.paymentRequests),
        stats: {
            totalBilled,
            totalPaid,
            pendingPayments: parent.children.flatMap(c => c.student.paymentRequests)
                .filter(p => p.status === "PENDING").length,
            approvedPayments: parent.children.flatMap(c => c.student.paymentRequests)
                .filter(p => p.status === "APPROVED").length,
            remainingBalance: totalBilled - totalPaid
        }
    }

    return (
        <div className="space-y-6">
            {activeAccount && (
                <PaymentAccountBanner
                    name={activeAccount.name}
                    bankName={activeAccount.bankName}
                    accountNo={activeAccount.accountNo}
                />
            )}
            <DashboardHeader
                heading="Fee Management"
                text="View and manage school fees for your children"
                showBanner={true}
            />
            <ParentFeeDashboard data={data} />
        </div>
    )
} 