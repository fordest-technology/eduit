'use client'

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { DashboardStatsCard, DashboardStatsGrid } from "@/components/dashboard-stats-card"
import { Loader2, Plus, DollarSign, CreditCard, FileText, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { BillsTab } from "./_components/bills-tab"
import { PaymentAccountsTab } from "./_components/payment-accounts-tab"
import { PaymentRequestsTab } from "./_components/payment-requests-tab"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from '@/app/lib/utils'

interface AdminFeeData {
    totalBilled: number
    totalPaid: number
    totalPending: number
    totalOverdue: number
    pendingRequests: number
}

interface PaymentAccount {
    id: string
    name: string
    bankName: string
    accountNo: string
    isActive: boolean
}

interface Class {
    id: string
    name: string
    section?: string
    _count?: {
        students: number
    }
}

interface Student {
    id: string
    name: string
    email: string
    currentClass?: {
        id: string
        name: string
        section?: string
    }
}

interface StudentPayment {
    amountPaid: number
    studentId: string
}

interface BillAssignment {
    id: string
    targetType: "CLASS" | "STUDENT"
    targetId: string
    dueDate: string
    status: "PAID" | "PARTIALLY_PAID" | "PENDING" | "OVERDUE"
    studentPayments: StudentPayment[]
}

interface BillItem {
    id: string
    billId: string
    name: string
    amount: number
    description?: string
    createdAt: Date
    updatedAt: Date
    bill: {
        id: string
        schoolId: string
        accountId: string
        createdAt: Date
        updatedAt: Date
    }
}

interface Bill {
    id: string
    name: string
    amount: number
    description?: string
    createdAt: string
    account: PaymentAccount
    items: BillItem[]
    assignments: BillAssignment[]
}

interface PaymentRequest {
    id: string
    student?: {
        user?: {
            name: string
        }
    }
    bill?: {
        name: string
    }
    amount: number
    receiptUrl?: string
    notes?: string
    createdAt: string
    status: "PENDING" | "APPROVED" | "REJECTED"
}

import { Skeleton } from "@/components/ui/skeleton"

export default function FeeDashboardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [session, setSession] = useState<any>(null)
    const [adminFeeData, setAdminFeeData] = useState<AdminFeeData | null>(null)
    const [bills, setBills] = useState<Bill[]>([])
    const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([])
    const [classes, setClasses] = useState<Class[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
    const [activeTab, setActiveTab] = useState("bills")



    const loadDashboardData = useCallback(async () => {
        setLoading(true)
        try {
            // Fetch basic entities in parallel
            const [accountsRes, billsRes, classesRes, studentsRes, requestsRes] = await Promise.all([
                fetch('/api/payment-accounts').then(r => r.ok ? r.json() : []),
                fetch('/api/bills').then(r => r.ok ? r.json() : []),
                fetch('/api/classes').then(r => r.ok ? r.json() : []),
                fetch('/api/students').then(r => r.ok ? r.json() : []),
                fetch('/api/payment-requests').then(r => r.ok ? r.json() : [])
            ])

            setPaymentAccounts(accountsRes)
            setBills(billsRes)
            setClasses(classesRes)
            setStudents(studentsRes)
            setPaymentRequests(requestsRes)

            // Calculate fee statistics
            const feeData: AdminFeeData = {
                totalBilled: billsRes.reduce((sum: number, bill: Bill) =>
                    sum + bill.items.reduce((itemSum, item) => itemSum + item.amount, 0), 0),
                totalPaid: billsRes.reduce((sum: number, bill: Bill) =>
                    sum + bill.assignments.reduce((assignmentSum, assignment) =>
                        assignmentSum + assignment.studentPayments.reduce((paymentSum, payment) =>
                            paymentSum + payment.amountPaid, 0), 0), 0),
                totalPending: billsRes.reduce((sum: number, bill: Bill) =>
                    sum + (bill.assignments?.filter(assignment => assignment.status === 'PENDING').length || 0), 0),
                totalOverdue: billsRes.reduce((sum: number, bill: Bill) =>
                    sum + (bill.assignments?.filter(assignment => assignment.status === 'OVERDUE').length || 0), 0),
                pendingRequests: requestsRes.filter((req: PaymentRequest) => req.status === 'PENDING').length
            }
            setAdminFeeData(feeData)
        } catch (error) {
            console.error("Error loading dashboard data:", error)
            toast.error("Some data failed to load")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        async function fetchSession() {
            try {
                const sessionRes = await fetch('/api/auth/session')
                if (!sessionRes.ok) throw new Error('Failed to fetch session')
                const sessionData = await sessionRes.json()
                setSession(sessionData)
                if (!sessionData) router.push("/login")
            } catch (error) {
                console.error("Session error:", error)
            }
        }

        fetchSession()
        loadDashboardData()
    }, [router, loadDashboardData])

    if (!session && !loading) return null

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Fee Management"
                text="Manage and track student fees"
                showBanner={true}
                icon={<DollarSign className="h-6 w-6" />}
            />

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
            ) : (
                <DashboardStatsGrid columns={4}>
                    <DashboardStatsCard
                        title="Total Billed"
                        value={formatCurrency(adminFeeData?.totalBilled || 0)}
                        icon={DollarSign}
                        color="blue"
                        description="Total amount billed to students"
                    />
                    <DashboardStatsCard
                        title="Total Paid"
                        value={formatCurrency(adminFeeData?.totalPaid || 0)}
                        icon={CreditCard}
                        color="emerald"
                        description={adminFeeData?.totalBilled ? `${((adminFeeData.totalPaid / adminFeeData.totalBilled) * 100).toFixed(1)}% of total billed` : "No billing yet"}
                    />
                    <DashboardStatsCard
                        title="Pending Payments"
                        value={adminFeeData?.totalPending || 0}
                        icon={FileText}
                        color="amber"
                        description="Awaiting payment"
                    />
                    <DashboardStatsCard
                        title="Overdue Payments"
                        value={adminFeeData?.totalOverdue || 0}
                        icon={AlertCircle}
                        color="rose"
                        description="Requires immediate attention"
                    />
                </DashboardStatsGrid>
            )}

            <Separator />

            <Tabs defaultValue="bills" value={activeTab} onValueChange={setActiveTab}>
                <div className="space-y-4">
                    <TabsList className="bg-background w-full justify-start rounded-none border-b">
                        <TabsTrigger
                            value="bills"
                            className="relative rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-background hover:bg-muted/50"
                        >
                            Bills
                        </TabsTrigger>
                        <TabsTrigger
                            value="accounts"
                            className="relative rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-background hover:bg-muted/50"
                        >
                            Payment Accounts
                        </TabsTrigger>
                        <TabsTrigger
                            value="requests"
                            className="relative rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-background hover:bg-muted/50"
                        >
                            Payment Requests
                            {(adminFeeData?.pendingRequests || 0) > 0 && (
                                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                    {adminFeeData?.pendingRequests}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {loading ? (
                        <div className="p-4 space-y-4">
                            <Skeleton className="h-[400px] w-full rounded-2xl" />
                        </div>
                    ) : (
                        <>
                            <TabsContent value="bills" className="m-0">
                                <BillsTab
                                    bills={bills}
                                    classes={classes}
                                    students={students}
                                    paymentAccounts={paymentAccounts}
                                    onRefresh={loadDashboardData}
                                />
                            </TabsContent>

                            <TabsContent value="accounts" className="m-0">
                                <PaymentAccountsTab accounts={paymentAccounts} />
                            </TabsContent>

                            <TabsContent value="requests" className="m-0">
                                <PaymentRequestsTab payments={paymentRequests} />
                            </TabsContent>
                        </>
                    )}
                </div>
            </Tabs>
        </div>
    )
}

