"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BillsTab } from "./bills-tab"
import { PaymentAccountsTab } from "./payment-accounts-tab"
import { PaymentRequestsTab } from "./payment-requests-tab"
import { CreditCard, DollarSign, FileText, Users, TrendingUp, AlertCircle } from "lucide-react"

interface FeeDashboardContentProps {
    data: {
        bills: any[]
        paymentAccounts: any[]
        pendingPayments: any[]
        classes: any[]
        students: any[]
        feeSummary: {
            totalBilled: number
            totalPaid: number
            totalPending: number
            totalOverdue: number
            pendingRequests: number
        }
    }
}

export function FeeDashboardContent({ data }: FeeDashboardContentProps) {
    const [activeTab, setActiveTab] = useState("bills")

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount)
    }

    const getPercentage = (value: number, total: number) => {
        return total > 0 ? ((value / total) * 100).toFixed(1) : "0.0"
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.feeSummary.totalBilled)}</div>
                        <p className="text-xs text-muted-foreground">Total amount billed to students</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.feeSummary.totalPaid)}</div>
                        <p className="text-xs text-muted-foreground">
                            {getPercentage(data.feeSummary.totalPaid, data.feeSummary.totalBilled)}% of total billed
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.feeSummary.totalPending)}</div>
                        <p className="text-xs text-muted-foreground">
                            {getPercentage(data.feeSummary.totalPending, data.feeSummary.totalBilled)}% of total billed
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.feeSummary.totalOverdue)}</div>
                        <p className="text-xs text-muted-foreground">
                            {getPercentage(data.feeSummary.totalOverdue, data.feeSummary.totalBilled)}% of total billed
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="bills" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="bills">Bills</TabsTrigger>
                    <TabsTrigger value="accounts">Payment Accounts</TabsTrigger>
                    <TabsTrigger value="requests">

                        {data.pendingPayments.length > 0 && (
                            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                {data.pendingPayments.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="bills" className="space-y-4">
                    <BillsTab
                        bills={data.bills}
                        classes={data.classes}
                        students={data.students}
                        paymentAccounts={data.paymentAccounts}
                    />
                </TabsContent>
                <TabsContent value="accounts" className="space-y-4">
                    <PaymentAccountsTab accounts={data.paymentAccounts} />
                </TabsContent>
                <TabsContent value="requests" className="space-y-4">
                    <PaymentRequestsTab payments={data.pendingPayments} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

