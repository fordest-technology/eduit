import { ParentFeeDashboard } from "../fees/_components/parent-fee-dashboard"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma, withErrorHandling } from "@/lib/prisma"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { UserRole, Bill, BillAssignment, PaymentRequest, Student, Class, User } from "@prisma/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, Wallet } from "lucide-react"
import { PaymentAccountBanner } from "@/components/payment-account-banner"

interface ParentFeesPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Define extended types for our data structures
interface ExtendedBillAssignment extends BillAssignment {
    studentPayments: {
        amountPaid: number;
    }[];
}

interface ExtendedBill extends Bill {
    assignments: ExtendedBillAssignment[];
    items: any[];
}

export default async function ParentFeesPage({ searchParams }: ParentFeesPageProps) {
    const sParams = await searchParams;
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    // Check if user is a parent
    if (session.role !== UserRole.PARENT) {
        redirect("/dashboard")
    }

    // STEP 1: Get parent data with children (Minimal fetch to release connection fast)
    const parentData = await withErrorHandling(() => prisma.parent.findUnique({
        where: { userId: session.id },
        select: {
            id: true,
            children: {
                select: {
                    student: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    schoolId: true,
                                    profileImage: true,
                                    email: true
                                }
                            },
                            classes: {
                                where: { session: { isCurrent: true } },
                                select: {
                                    class: {
                                        select: {
                                            id: true,
                                            name: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }))

    if (!parentData?.children.length) {
        return (
            <div className="space-y-6">
                <DashboardHeader
                    heading="Fee Management"
                    text="View and manage school fees for your children"
                    showBanner={true}
                    icon={<Wallet className="h-8 w-8 text-white" />}
                    action={
                        <Link href="/dashboard">
                            <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-2xl font-bold gap-2 backdrop-blur-md">
                                <ChevronLeft className="h-4 w-4" /> Back to Dashboard
                            </Button>
                        </Link>
                    }
                />
                <div className="rounded-[2.5rem] border-none bg-white p-12 text-center text-slate-400 shadow-xl shadow-black/5 font-medium">
                    You don't have any children registered in the system.
                </div>
            </div>
        )
    }

    const studentIds = parentData.children.map(c => c.student.id)
    const schoolIds = Array.from(new Set(
        parentData.children.map(c => c.student.user.schoolId).filter(Boolean) as string[]
    ))

    // STEP 2: Fetch bills and payment accounts for the relevant schools
    const [bills, paymentAccounts] = await Promise.all([
        withErrorHandling(() => prisma.bill.findMany({
            where: {
                schoolId: { in: schoolIds.length > 0 ? schoolIds : [session.schoolId as string] },
                assignments: {
                    some: {
                        OR: [
                            { targetType: "STUDENT", targetId: { in: studentIds } },
                            { targetType: "CLASS" } // We filter these later based on student classes
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
        })),
        schoolIds.length > 0
            ? withErrorHandling(() => prisma.paymentAccount.findMany({
                where: {
                    schoolId: { in: schoolIds },
                    isActive: true
                },
                orderBy: { updatedAt: "desc" }
            }))
            : Promise.resolve([])
    ])

    // STEP 3: Fetch payment requests for these students
    const paymentRequestsAll = await withErrorHandling(() => prisma.paymentRequest.findMany({
        where: {
            studentId: { in: studentIds }
        },
        include: {
            bill: true,
            billAssignment: true,
            studentPayment: true
        }
    }))

    const activeAccount = (paymentAccounts as any[])[0] || null

    // Calculate payment statistics and prepare children data
    let totalBilled = 0
    let totalPaid = 0

    const children = parentData.children.map((child: any) => {
        const student = child.student
        const studentId = student.id
        const classIds = student.classes.map((c: any) => c.class.id)

        const studentBills = (bills as any[]).filter(bill =>
            bill.assignments.some((assignment: any) =>
                (assignment.targetType === "STUDENT" && assignment.targetId === studentId) ||
                (assignment.targetType === "CLASS" && classIds.includes(assignment.targetId))
            )
        )

        studentBills.forEach(bill => {
            totalBilled += bill.amount
            bill.assignments.forEach((assignment: any) => {
                const studentPayments = assignment.studentPayments.filter((p: any) => p.studentId === studentId)
                totalPaid += studentPayments.reduce((sum: number, payment: any) => sum + payment.amountPaid, 0)
            })
        })

        const studentRequests = paymentRequestsAll.filter(p => p.studentId === studentId)

        return {
            ...student,
            paymentRequests: studentRequests,
            bills: studentBills
        }
    })

    const paymentRequests = paymentRequestsAll.filter(p => p.status === "PENDING");
    const paymentHistory = paymentRequestsAll.filter(p => p.status === "APPROVED");

    const data = {
        children,
        bills: bills as any[],
        paymentAccounts: paymentAccounts as any[],
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
                icon={<Wallet className="h-8 w-8 text-white" />}
                action={
                    <Link href="/dashboard">
                        <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-2xl font-bold gap-2 backdrop-blur-md">
                            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
                        </Button>
                    </Link>
                }
            />
            <ParentFeeDashboard data={data} />
        </div>
    )
} 