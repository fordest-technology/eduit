'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/app/components/dashboard-header"
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
    students: { id: string }[]
}

interface Student {
    id: string
    user: {
        name: string
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

    useEffect(() => {
        async function fetchSessionAndData() {
            try {
                // Get session
                const sessionRes = await fetch('/api/auth/session')
                if (!sessionRes.ok) {
                    throw new Error('Failed to fetch session')
                }

                const sessionData = await sessionRes.json()
                setSession(sessionData)

                // If no session or not allowed, redirect
                if (!sessionData) {
                    router.push("/login")
                    return
                }

                // Fetch payment accounts
                const accountsRes = await fetch('/api/payment-accounts')
                if (!accountsRes.ok) {
                    throw new Error("Failed to fetch payment accounts")
                }
                const accountsData = await accountsRes.json()
                setPaymentAccounts(accountsData)

                // Fetch bills
                const billsRes = await fetch('/api/bills')
                if (!billsRes.ok) {
                    throw new Error("Failed to fetch bills")
                }
                const billsData = await billsRes.json()
                setBills(billsData)

                // Fetch classes
                const classesRes = await fetch('/api/classes')
                if (!classesRes.ok) {
                    throw new Error("Failed to fetch classes")
                }
                const classesData = await classesRes.json()
                setClasses(classesData)

                // Fetch students
                const studentsRes = await fetch('/api/students')
                if (!studentsRes.ok) {
                    throw new Error("Failed to fetch students")
                }
                const studentsData = await studentsRes.json()
                setStudents(studentsData)

                // Fetch payment requests
                const requestsRes = await fetch('/api/payment-requests')
                if (!requestsRes.ok) {
                    throw new Error("Failed to fetch payment requests")
                }
                const requestsData = await requestsRes.json()
                setPaymentRequests(requestsData)

                // Calculate fee statistics
                const feeData: AdminFeeData = {
                    totalBilled: billsData.reduce((sum: number, bill: Bill) =>
                        sum + bill.items.reduce((itemSum, item) => itemSum + item.amount, 0), 0),
                    totalPaid: billsData.reduce((sum: number, bill: Bill) =>
                        sum + bill.assignments.reduce((assignmentSum, assignment) =>
                            assignmentSum + assignment.studentPayments.reduce((paymentSum, payment) =>
                                paymentSum + payment.amountPaid, 0), 0), 0),
                    totalPending: billsData.reduce((sum: number, bill: Bill) =>
                        sum + bill.assignments.filter(assignment => assignment.status === 'PENDING').length, 0),
                    totalOverdue: billsData.reduce((sum: number, bill: Bill) =>
                        sum + bill.assignments.filter(assignment => assignment.status === 'OVERDUE').length, 0),
                    pendingRequests: requestsData.filter((req: PaymentRequest) => req.status === 'PENDING').length
                }
                setAdminFeeData(feeData)

            } catch (error) {
                console.error("Error:", error)
                if (error instanceof Error) {
                    setError(error.message)
                } else {
                    setError("An unexpected error occurred")
                }
                toast.error("Error loading page")
            } finally {
                setLoading(false)
            }
        }

        fetchSessionAndData()
    }, [router])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (error || !session || !adminFeeData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-red-500 mb-4">{error || "Not found or not authorized"}</p>
                <Button onClick={() => router.push("/dashboard")}>
                    Back to Dashboard
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Fee Management"
                text="Manage and track student fees"
                showBanner={true}
                icon={<DollarSign className="h-6 w-6" />}
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-blue-700">
                            <DollarSign className="mr-2 h-5 w-5" />
                            Total Billed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-800">{formatCurrency(adminFeeData.totalBilled)}</p>
                        <p className="text-sm text-blue-600 mt-1">Total amount billed to students</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-green-700">
                            <CreditCard className="mr-2 h-5 w-5" />
                            Total Paid
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-800">{formatCurrency(adminFeeData.totalPaid)}</p>
                        <p className="text-sm text-green-600 mt-1">
                            {((adminFeeData.totalPaid / adminFeeData.totalBilled) * 100 || 0).toFixed(1)}% of total billed
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-yellow-700">
                            <FileText className="mr-2 h-5 w-5" />
                            Pending Payments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-yellow-800">{adminFeeData.totalPending}</p>
                        <p className="text-sm text-yellow-600 mt-1">Awaiting payment</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-red-700">
                            <AlertCircle className="mr-2 h-5 w-5" />
                            Overdue Payments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-red-800">{adminFeeData.totalOverdue}</p>
                        <p className="text-sm text-red-600 mt-1">Requires immediate attention</p>
                    </CardContent>
                </Card>
            </div>

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
                            {adminFeeData.pendingRequests > 0 && (
                                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                    {adminFeeData.pendingRequests}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="bills" className="m-0">
                        <BillsTab
                            bills={bills}
                            classes={classes}
                            students={students}
                            paymentAccounts={paymentAccounts}
                        />
                    </TabsContent>

                    <TabsContent value="accounts" className="m-0">
                        <PaymentAccountsTab accounts={paymentAccounts} />
                    </TabsContent>

                    <TabsContent value="requests" className="m-0">
                        <PaymentRequestsTab payments={paymentRequests} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}

