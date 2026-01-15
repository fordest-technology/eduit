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

    // Get all school IDs from the parent's children to fetch relevant bills
    const childSchoolIds = Array.from(new Set(
        parent?.children.map(child => child.student.user.schoolId).filter(Boolean) as string[]
    ))

    // Fetch all bills and their assignments for the relevant schools
    const bills = await prisma.bill.findMany({
        where: {
            schoolId: { in: childSchoolIds.length > 0 ? childSchoolIds : [session.schoolId as string] },
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
            items: true,
            assignments: {
                include: {
                    studentPayments: true
                }
            }
        }
    }) as ExtendedBill[]

    // Fetch active payment accounts for the relevant schools
    const paymentAccounts = childSchoolIds.length > 0 
        ? await prisma.paymentAccount.findMany({
            where: {
                schoolId: { in: childSchoolIds },
                isActive: true
            },
            orderBy: { updatedAt: "desc" }
        })
        : []
    
    const activeAccount = paymentAccounts[0] || null

    if (!parent?.children.length) {
        return (
            <div className="space-y-6">
                {paymentAccounts.length > 0 && (
                    <div className="space-y-4">
                        {paymentAccounts.map((account) => (
                            <Alert key={account.id} className="bg-blue-50 border-blue-200 text-blue-900 shadow-sm rounded-xl">
                                <AlertTitle className="flex items-center gap-2 font-bold mb-2">
                                    <CreditCard className="h-4 w-4" />
                                    Active Payment Account - {childSchoolIds.length > 1 ? account.schoolId : "School Fees"}
                                </AlertTitle>
                                <AlertDescription>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Account Name</p>
                                            <p className="font-bold">{account.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Bank Name</p>
                                            <p className="font-bold">{account.bankName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Account Number</p>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-lg tracking-wider">{account.accountNo}</p>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="secondary"
                                                    onClick={() => navigator.clipboard.writeText(account.accountNo)}
                                                    className="h-8 w-8 rounded-lg bg-blue-100/50 hover:bg-blue-100 text-blue-600"
                                                    aria-label="Copy account number"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        ))}
                    </div>
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
                // Add bill amount exactly once per student
                totalBilled += bill.amount
                
                // Sum all payments for this student across all assignments of this bill
                bill.assignments.forEach(assignment => {
                    const studentPayments = assignment.studentPayments.filter((p: any) => p.studentId === studentId)
                    totalPaid += studentPayments.reduce((sum: number, payment) => sum + payment.amountPaid, 0)
                })
            })

            return {
            ...student,
            bills: studentBills
        }
    })

    // Transform data for the dashboard
    const paymentRequests = parent.children.flatMap(c => c.student.paymentRequests)
        .filter(p => p.status === "PENDING");
    const paymentHistory = parent.children.flatMap(c => c.student.paymentRequests)
        .filter(p => p.status === "APPROVED");

    const data = {
        children,
        bills,
        paymentAccounts,
        paymentRequests,
        paymentHistory,
        stats: {
            totalBilled,
            totalPaid,
            pendingPayments: paymentRequests.length,
            approvedPayments: paymentHistory.length,
            remainingBalance: Math.max(0, totalBilled - totalPaid),
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