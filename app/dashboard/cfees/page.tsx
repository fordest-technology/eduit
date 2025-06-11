// import { DashboardHeader } from "@/components/dashboard-header"
import { ParentFeeDashboard } from "../fees/_components/parent-fee-dashboard"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { UserRole } from "@prisma/client"

interface ParentFeesPageProps {
    searchParams: { [key: string]: string | string[] | undefined }
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

    // Get parent data with children
    const parent = await prisma.parent.findUnique({
        where: { userId: session.id },
        include: {
            children: {
                include: {
                    student: {
                        include: {
                            user: true,
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

    if (!parent?.children.length) {
        return (
            <div className="space-y-6">
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

    // Transform data for the dashboard
    const data = {
        children: parent.children.map(c => c.student),
        bills: [],
        paymentAccounts: [],
        paymentRequests: parent.children.flatMap(c => c.student.paymentRequests),
        paymentHistory: [],
        stats: {
            totalBilled: 0,
            totalPaid: 0,
            pendingPayments: parent.children.flatMap(c => c.student.paymentRequests)
                .filter(p => p.status === "PENDING").length,
            approvedPayments: parent.children.flatMap(c => c.student.paymentRequests)
                .filter(p => p.status === "APPROVED").length,
            remainingBalance: 0
        }
    }

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Fee Management"
                text="View and manage school fees for your children"
                showBanner={true}
            />
            <ParentFeeDashboard data={data} />
        </div>
    )
} 