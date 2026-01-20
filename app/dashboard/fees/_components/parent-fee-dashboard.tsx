"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, DollarSign, Clock, CheckCircle, Wallet, ArrowUpRight, History, Sparkles } from "lucide-react"
import { ParentPaymentForm } from "../parent/_components/parent-payment-form"
import { ParentPaymentHistory } from "../parent/_components/parent-payment-history"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"

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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* Financial Overview Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={item}>
          <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white p-6 group hover:scale-[1.02] transition-transform duration-500">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <DollarSign className="h-5 w-5" />
              </div>
              <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[10px] tracking-widest px-3">Aggregated</Badge>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Commitment</p>
            <h3 className="text-2xl font-black font-sora text-slate-800">{formatCurrency(data.stats.totalBilled)}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Institutional obligations</p>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-indigo-600 p-6 group hover:scale-[1.02] transition-transform duration-500 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md border border-white/20">
                  <Wallet className="h-5 w-5" />
                </div>
                <Badge className="bg-white/20 text-white border-none font-black text-[10px] tracking-widest px-3">Liquidated</Badge>
              </div>
              <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Total Paid</p>
              <h3 className="text-2xl font-black font-sora text-white">{formatCurrency(data.stats.totalPaid)}</h3>
              <p className="text-xs text-white/60 font-medium mt-1">
                {((data.stats.totalPaid / data.stats.totalBilled) * 100 || 0).toFixed(1)}% of total
              </p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white p-6 group hover:scale-[1.02] transition-transform duration-500">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                <Clock className="h-5 w-5" />
              </div>
              <Badge className="bg-amber-50 text-amber-600 border-none font-black text-[10px] tracking-widest px-3">In Review</Badge>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Pending Sync</p>
            <h3 className="text-2xl font-black font-sora text-slate-800">{data.stats.pendingPayments}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Awaiting audit approval</p>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white p-6 group hover:scale-[1.02] transition-transform duration-500">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 transition-colors group-hover:bg-rose-600 group-hover:text-white">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <Badge className="bg-rose-50 text-rose-600 border-none font-black text-[10px] tracking-widest px-3">Outstanding</Badge>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Debt</p>
            <h3 className="text-2xl font-black font-sora text-slate-800">{formatCurrency(data.stats.remainingBalance)}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Current unliquidated balance</p>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Content Area */}
      <Card className="border-none shadow-2xl shadow-black/5 rounded-[3rem] bg-white overflow-hidden p-2">
        <Tabs defaultValue="make-payment" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="p-8 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-3xl font-black font-sora text-slate-800 flex items-center gap-3">
                  Fee Management <Sparkles className="h-6 w-6 text-indigo-500" />
                </h2>
                <p className="text-slate-400 font-medium mt-1 tracking-tight">Manage institutional financial obligations and history</p>
              </div>
              <TabsList className="bg-slate-100/50 p-1.5 rounded-[2rem] h-auto flex gap-2 border border-slate-200/50 shadow-inner">
                <TabsTrigger
                  value="make-payment"
                  className="rounded-2xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg transition-all duration-300 tracking-tight font-sora flex items-center gap-2"
                >
                  <Wallet className="h-4 w-4" /> Settlement
                </TabsTrigger>
                <TabsTrigger
                  value="payment-history"
                  className="rounded-2xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg transition-all duration-300 tracking-tight font-sora flex items-center gap-2"
                >
                  <History className="h-4 w-4" /> Log History
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="px-8 pb-10">
            <TabsContent value="make-payment" className="mt-0 animate-in fade-in zoom-in-95 duration-500">
              {data.children.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                  <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-slate-200 mb-6 shadow-xl shadow-black/5">
                    <CreditCard className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-400 font-sora">No Student Accounts Found</h3>
                  <p className="text-slate-300 max-w-xs mt-2 font-medium text-center">Please contact institutional audit to link student records to your profile.</p>
                </div>
              ) : (
                <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100">
                  <ParentPaymentForm children={data.children} bills={data.bills} paymentAccounts={data.paymentAccounts} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="payment-history" className="mt-0 animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100">
                <ParentPaymentHistory paymentRequests={data.paymentHistory} children={data.children} />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  )
}
