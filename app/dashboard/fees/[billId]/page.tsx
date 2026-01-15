'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    ArrowLeft,
    Users,
    School,
    Calendar,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertCircle,
    CreditCard,
    FileText,
    ChevronRight,
    ChevronDown,
    Search,
    Filter,
    LayoutGrid,
    ListFilter
} from "lucide-react"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { formatCurrency } from '@/app/lib/utils'
import { AssignBillDialog } from "../_components/assign-bill-dialog"

interface BillDetails {
    id: string
    name: string
    amount: number
    createdAt: string
    account: {
        name: string
        bankName: string
        accountNo: string
    }
    items?: {
        id: string
        name: string
        amount: number
        description?: string
    }[]
    feeComponents?: {
        id: string
        name: string
        amount: number
        description?: string
    }[]
    assignments: {
        id: string
        targetType: "CLASS" | "STUDENT"
        targetId: string
        dueDate: string
        status: "PAID" | "PARTIALLY_PAID" | "PENDING" | "OVERDUE"
        studentPayments: {
            amountPaid: number
            studentId: string
            student?: {
                user: {
                    name: string
                }
            }
        }[]
        class?: {
            name: string
            section?: string
            students: {
                id: string
                user: {
                    name: string
                }
            }[]
        }
        student?: {
            user: {
                name: string
            }
        }
    }[]
}

interface SchoolTheme {
    primaryColor: string
    secondaryColor: string
}

type PaymentStatus = "PAID" | "PARTIAL" | "UNPAID"

export default function BillDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const [loading, setLoading] = useState(true)
    const [bill, setBill] = useState<BillDetails | null>(null)
    const [schoolTheme, setSchoolTheme] = useState<SchoolTheme | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
    const [classes, setClasses] = useState<any[]>([])
    const [students, setStudents] = useState<any[]>([])

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch bill details
                const billRes = await fetch(`/api/bills/${params.billId}`)
                if (!billRes.ok) throw new Error("Failed to fetch bill details")
                const billData = await billRes.json()
                setBill(billData)

                // Fetch school theme
                const themeRes = await fetch('/api/school/theme')
                if (themeRes.ok) {
                    const themeData = await themeRes.json()
                    setSchoolTheme(themeData)
                }

                // Fetch classes and students for assignment dialog
                const [clsRes, stdRes] = await Promise.all([
                    fetch('/api/classes'),
                    fetch('/api/students')
                ])
                if (clsRes.ok) setClasses(await clsRes.json())
                if (stdRes.ok) setStudents(await stdRes.json())
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred")
            } finally {
                setLoading(false)
            }
        }

        if (params.billId) {
            fetchData()
        }
    }, [params.billId])

    // Helper function to get fee components
    const getFeeComponents = (bill: BillDetails | null) => {
        if (!bill) return []
        return bill.feeComponents || bill.items || []
    }

    if (loading) {
        return <BillDetailsSkeleton />
    }

    if (error || !bill) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <p className="text-red-500 mb-4">{error || "Bill not found"}</p>
                <Button onClick={() => router.push("/dashboard/fees")}>
                    Back to Fees
                </Button>
            </div>
        )
    }

    const feeComponents = getFeeComponents(bill)

    const statusColors = {
        PAID: "bg-green-500",
        PARTIALLY_PAID: "bg-yellow-500",
        PENDING: "bg-blue-500",
        OVERDUE: "bg-red-500",
    }

    const statusIcons = {
        PAID: <CheckCircle2 className="h-4 w-4" />,
        PARTIALLY_PAID: <Clock className="h-4 w-4" />,
        PENDING: <Clock className="h-4 w-4" />,
        OVERDUE: <AlertCircle className="h-4 w-4" />,
    }

    const getTotalPaid = (assignment: BillDetails['assignments'][0]) => {
        return assignment.studentPayments.reduce((sum, payment) => sum + payment.amountPaid, 0)
    }

    const getPaymentProgress = (assignment: BillDetails['assignments'][0]) => {
        const totalPaid = getTotalPaid(assignment)
        const multiplier = assignment.targetType === "CLASS" ? (assignment.class?.students?.length || 1) : 1
        const totalExpected = bill.amount * multiplier
        return totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0
    }

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            onClick={() => router.push("/dashboard/fees")}
                            size="sm"
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Fees
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{bill?.name}</h1>
                            <p className="text-sm text-muted-foreground">
                                Created on {format(new Date(bill?.createdAt || ''), "PPP")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            Download Invoice
                        </Button>
                        <Button size="sm">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Record Payment
                        </Button>
                    </div>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Amount
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-2xl font-bold">{formatCurrency(bill.amount)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {feeComponents.length} fee component{feeComponents.length !== 1 ? 's' : ''}
                        </p>
                    </CardContent>
                    <div
                        className="absolute top-0 right-0 h-full w-2"
                        style={{ backgroundColor: schoolTheme?.primaryColor }}
                    />
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Payment Account
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{bill?.account?.name || "Automated via Squad"}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {bill?.account ? `${bill.account.bankName} (${bill.account.accountNo})` : "Direct digital settlements"}
                        </p>
                    </CardContent>
                    <div
                        className="absolute top-0 right-0 h-full w-2"
                        style={{ backgroundColor: schoolTheme?.secondaryColor }}
                    />
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Assignment Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    {bill?.assignments.filter(a => a.targetType === "STUDENT").length} Students
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <School className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    {bill?.assignments.filter(a => a.targetType === "CLASS").length} Classes
                                </span>
                            </div>
                        </div>
                    </CardContent>
                    <div
                        className="absolute top-0 right-0 h-full w-2"
                        style={{ backgroundColor: schoolTheme?.primaryColor }}
                    />
                </Card>
            </div>

            {/* Main Content */}
            <div className="grid gap-6 md:grid-cols-12">
                {/* Fee Components Section */}
                <Card className="md:col-span-4">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Fee Components
                            <Badge variant="secondary" className="ml-2">
                                {feeComponents.length} item{feeComponents.length !== 1 ? 's' : ''}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-4">
                                {feeComponents.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex flex-col space-y-2 p-4 rounded-lg border"
                                        style={{
                                            borderLeft: schoolTheme ? `4px solid ${schoolTheme.primaryColor}` : undefined
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-medium">{item.name}</h3>
                                            <span className="font-semibold">{formatCurrency(item.amount)}</span>
                                        </div>
                                        {item.description && (
                                            <p className="text-sm text-muted-foreground">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Assignments Section */}
                <Card className="md:col-span-8">
                    <CardHeader>
                        <CardTitle>Assignments & Payments</CardTitle>
                        <CardDescription>
                            Track payment progress and manage bill assignments
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="all" className="space-y-6">
                            <div className="flex items-center justify-between">
                                <TabsList className="bg-background">
                                    <TabsTrigger value="all" className="data-[state=active]:bg-primary/5">
                                        All
                                    </TabsTrigger>
                                    <TabsTrigger value="class" className="data-[state=active]:bg-primary/5">
                                        Classes
                                    </TabsTrigger>
                                    <TabsTrigger value="student" className="data-[state=active]:bg-primary/5">
                                        Students
                                    </TabsTrigger>
                                </TabsList>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setIsAssignDialogOpen(true)}
                                >
                                    <Users className="h-4 w-4 mr-2" />
                                    Assign Bill
                                </Button>
                            </div>

                            <TabsContent value="all" className="space-y-4 mt-4">
                                {bill?.assignments.map((assignment) => (
                                    <AssignmentCard
                                        key={assignment.id}
                                        assignment={assignment}
                                        bill={bill}
                                        schoolTheme={schoolTheme}
                                        statusColors={statusColors}
                                        statusIcons={statusIcons}
                                        getTotalPaid={getTotalPaid}
                                        getPaymentProgress={getPaymentProgress}
                                    />
                                ))}
                            </TabsContent>

                            <TabsContent value="class" className="space-y-4 mt-4">
                                {bill?.assignments
                                    .filter(a => a.targetType === "CLASS")
                                    .map((assignment) => (
                                        <AssignmentCard
                                            key={assignment.id}
                                            assignment={assignment}
                                            bill={bill}
                                            schoolTheme={schoolTheme}
                                            statusColors={statusColors}
                                            statusIcons={statusIcons}
                                            getTotalPaid={getTotalPaid}
                                            getPaymentProgress={getPaymentProgress}
                                        />
                                    ))}
                            </TabsContent>

                            <TabsContent value="student" className="space-y-4 mt-4">
                                {bill?.assignments
                                    .filter(a => a.targetType === "STUDENT")
                                    .map((assignment) => (
                                        <AssignmentCard
                                            key={assignment.id}
                                            assignment={assignment}
                                            bill={bill}
                                            schoolTheme={schoolTheme}
                                            statusColors={statusColors}
                                            statusIcons={statusIcons}
                                            getTotalPaid={getTotalPaid}
                                            getPaymentProgress={getPaymentProgress}
                                        />
                                    ))}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            <AssignBillDialog
                isOpen={isAssignDialogOpen}
                onClose={() => setIsAssignDialogOpen(false)}
                bill={bill}
                classes={classes}
                students={students}
            />
        </div>
    )
}

function AssignmentCard({
    assignment,
    bill,
    schoolTheme,
    statusColors,
    statusIcons,
    getTotalPaid,
    getPaymentProgress
}: {
    assignment: BillDetails['assignments'][0]
    bill: BillDetails
    schoolTheme: SchoolTheme | null
    statusColors: Record<string, string>
    statusIcons: Record<string, React.ReactNode>
    getTotalPaid: (assignment: BillDetails['assignments'][0]) => number
    getPaymentProgress: (assignment: BillDetails['assignments'][0]) => number
}) {
    const [isExpanded, setIsExpanded] = useState(false)
    const totalPaid = getTotalPaid(assignment)
    const progress = getPaymentProgress(assignment)

    return (
        <div className="space-y-2">
            <div
                className={`group relative border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all ${
                    assignment.targetType === "CLASS" ? "cursor-pointer" : ""
                }`}
                onClick={() => assignment.targetType === "CLASS" && setIsExpanded(!isExpanded)}
                style={{
                    backgroundColor: isExpanded ? 'rgba(var(--primary-rgb), 0.02)' : 'white'
                }}
            >
                <div 
                    className="absolute top-0 left-0 bottom-0 w-1.5"
                    style={{ backgroundColor: schoolTheme?.primaryColor }}
                />
                
                <div className="p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                                isExpanded ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                            )}
                            style={{ backgroundColor: isExpanded ? schoolTheme?.primaryColor : undefined }}
                            >
                                {assignment.targetType === "CLASS" ? (
                                    <School className="h-5 w-5" />
                                ) : (
                                    <Users className="h-5 w-5" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-800 tracking-tight">
                                        {assignment.targetType === "CLASS"
                                            ? `${assignment.class?.name || 'Unknown Class'}${assignment.class?.section ? ` - ${assignment.class.section}` : ''}`
                                            : assignment.student?.user?.name || "Unknown Student"}
                                    </p>
                                    <Badge
                                        className={cn(
                                            "capitalize font-bold border-none",
                                            assignment.status === "PAID" ? "bg-green-100 text-green-700" :
                                            assignment.status === "PARTIALLY_PAID" ? "bg-amber-100 text-amber-700" :
                                            "bg-slate-100 text-slate-600"
                                        )}
                                    >
                                        {assignment.status.replace("_", " ")}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Due {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                                    </div>
                                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                                    <span>
                                        {assignment.targetType === "CLASS" 
                                            ? `${assignment.class?.students?.length || 0} Students` 
                                            : "Individual"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-6">
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Collection</p>
                                <p className="font-black text-lg text-slate-900">{formatCurrency(totalPaid)}</p>
                                <p className="text-[10px] font-bold text-slate-400">Total: {formatCurrency(bill.amount * (assignment.targetType === "CLASS" ? (assignment.class?.students?.length || 1) : 1))}</p>
                            </div>
                            {assignment.targetType === "CLASS" && (
                                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center transition-transform group-hover:bg-slate-100">
                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Payment Progress</span>
                            <span>{progress.toFixed(1)}%</span>
                        </div>
                        <Progress
                            value={progress}
                            className="h-1.5"
                            style={{
                                backgroundColor: schoolTheme?.secondaryColor + '40', // 25% opacity
                                '--progress-foreground': schoolTheme?.primaryColor
                            } as any}
                        />
                    </div>
                </div>
            </div>
            
            {isExpanded && assignment.targetType === "CLASS" && (
                <div className="px-1 animate-in slide-in-from-top-2 duration-300">
                    <ClassPaymentDetails 
                        assignment={assignment} 
                        bill={bill} 
                        schoolTheme={schoolTheme} 
                    />
                </div>
            )}
        </div>
    )
}

function ClassPaymentDetails({
    assignment,
    bill,
    schoolTheme
}: {
    assignment: BillDetails['assignments'][0]
    bill: BillDetails
    schoolTheme: SchoolTheme | null
}) {
    const router = useRouter()
    if (!assignment.class?.students) return null

    const totalStudents = assignment.class.students.length
    const perStudentAmount = bill.amount
    const totalExpected = perStudentAmount * totalStudents

    // Calculate payments with proper type safety
    const studentPayments = assignment.class.students.map(student => {
        const payment = assignment.studentPayments.find(p => p.studentId === student.id)
        const amountPaid = payment?.amountPaid ?? 0
        const status: PaymentStatus = amountPaid >= perStudentAmount
            ? "PAID"
            : amountPaid > 0
                ? "PARTIAL"
                : "UNPAID"
        return {
            student,
            amountPaid,
            status
        }
    })

    const totalPaid = studentPayments.reduce((sum, { amountPaid }) => sum + amountPaid, 0)
    const totalPending = totalExpected - totalPaid

    // Group students by payment status
    const paidStudents = studentPayments.filter(p => p.status === "PAID")
    const partialStudents = studentPayments.filter(p => p.status === "PARTIAL")
    const unpaidStudents = studentPayments.filter(p => p.status === "UNPAID")

    const statusColors: Record<PaymentStatus, string> = {
        PAID: "bg-green-100 text-green-700 border-green-200",
        PARTIAL: "bg-yellow-100 text-yellow-700 border-yellow-200",
        UNPAID: "bg-red-100 text-red-700 border-red-200"
    }

    return (
        <div className="mt-2 space-y-4 rounded-2xl bg-slate-50 border border-slate-100 p-6 shadow-inner">
            <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Expected</p>
                    <p className="text-xl font-black text-slate-800">{formatCurrency(totalExpected)}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">
                        {formatCurrency(perStudentAmount)} × {totalStudents}
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Collected</p>
                    <p className="text-xl font-black text-green-600">{formatCurrency(totalPaid)}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">
                        {((totalPaid / totalExpected) * 100).toFixed(1)}% complete
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Balance</p>
                    <p className="text-xl font-black text-amber-600">{formatCurrency(totalPending)}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">
                        {((totalPending / totalExpected) * 100).toFixed(1)}% remaining
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Success Rate</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-green-100 text-green-700 border-none font-bold">{paidStudents.length} Paid</Badge>
                        <Badge className="bg-amber-100 text-amber-700 border-none font-bold">{partialStudents.length} Part</Badge>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Student Payment Status</CardTitle>
                    <CardDescription>
                        Payment tracking for {totalStudents} students in {assignment.class?.name || "Unknown Class"}
                        {assignment.class?.section && ` - ${assignment.class.section}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-3">
                            {studentPayments.map(({ student, amountPaid, status }) => {
                                return (
                                    <div
                                        key={student.id}
                                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/5 transition-colors"
                                        style={{
                                            borderLeft: schoolTheme ? `4px solid ${schoolTheme.primaryColor}` : undefined
                                        }}
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-sm font-medium">
                                                        {student.user.name.split(' ').map(n => n[0]).join('')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-medium">{student.user.name}</p>
                                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                                    <span>Expected: {formatCurrency(perStudentAmount)}</span>
                                                    <span>•</span>
                                                    <span>Paid: {formatCurrency(amountPaid)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">
                                                    {((amountPaid / perStudentAmount) * 100).toFixed(1)}% paid
                                                </p>
                                                <Progress
                                                    value={(amountPaid / perStudentAmount) * 100}
                                                    className="h-1.5 w-24"
                                                    style={{
                                                        backgroundColor: schoolTheme?.secondaryColor,
                                                        '--progress-foreground': schoolTheme?.primaryColor
                                                    } as any}
                                                />
                                            </div>
                                            <Badge className={statusColors[status]}>
                                                {status}
                                            </Badge>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}

function BillDetailsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="h-10 w-32">
                <Skeleton className="h-full w-full" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i}>
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                        {[1, 2].map((i) => (
                            <div key={i} className="mb-4">
                                <Skeleton className="h-16 w-full rounded-lg" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 