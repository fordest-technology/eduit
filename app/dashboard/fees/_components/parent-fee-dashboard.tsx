"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { ParentPaymentForm } from "./parent-payment-form"
// import { ParentPaymentHistory } from "./parent-payment-history"
import { CreditCard, DollarSign, Clock, CheckCircle } from "lucide-react"
import { ParentPaymentForm } from "../parent/_components/parent-payment-form"
import { ParentPaymentHistory } from "../parent/_components/parent-payment-history"

interface ParentFeeDashboardProps {
  data: {
    children: any[]
    bills: any[]
    paymentAccounts: any[]
    paymentRequests: any[]
    paymentHistory: any[]
    stats: {
      totalBilled: number
      totalPaid: number
      pendingPayments: number
      approvedPayments: number
      remainingBalance: number
    }
  }
}

export function ParentFeeDashboard({ data }: ParentFeeDashboardProps) {
  const [activeTab, setActiveTab] = useState("make-payment")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
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
            <div className="text-2xl font-bold">{formatCurrency(data.stats.totalBilled)}</div>
            <p className="text-xs text-muted-foreground">Total fees for your children</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.stats.totalPaid)}</div>
            <p className="text-xs text-muted-foreground">
              {((data.stats.totalPaid / data.stats.totalBilled) * 100 || 0).toFixed(1)}% of total billed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.stats.remainingBalance)}</div>
            <p className="text-xs text-muted-foreground">Outstanding balance</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10 shadow-md">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle>Fee Management</CardTitle>
          <CardDescription>Make payments and view payment history</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="make-payment" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="make-payment">Make Payment</TabsTrigger>
              <TabsTrigger value="payment-history">Payment History</TabsTrigger>
            </TabsList>

            <TabsContent value="make-payment">
              {data.children.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No students found. Please contact the school administration.</p>
                </div>
              ) : (
                <ParentPaymentForm children={data.children} bills={data.bills} paymentAccounts={data.paymentAccounts} />
              )}
            </TabsContent>

            <TabsContent value="payment-history">
              <ParentPaymentHistory paymentRequests={data.paymentHistory} children={data.children} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

