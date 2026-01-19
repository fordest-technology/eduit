"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  CheckCircle2, 
  CreditCard, 
  Users, 
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import Script from "next/script";

interface BillingInfo {
  currentStudentCount: number;
  paidStudentCount: number;
  unpaidStudents: number;
  billingStatus: "ACTIVE" | "BLOCKED";
  amountDue: number;
  hoursRemaining: number | null;
}

export function BillingStatus() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const billingRes = await fetch("/api/school/billing");
      if (billingRes.ok) setBilling(await billingRes.json());
    } catch (error) {
      console.error("Failed to fetch billing info:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="mb-8">
        <Skeleton className="h-[220px] rounded-[2.5rem]" />
      </div>
    );
  }

  const isBlocked = billing?.billingStatus === "BLOCKED";
  const hasUnpaid = (billing?.unpaidStudents || 0) > 0;

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full h-full"
    >
      <motion.div variants={itemVariants} className="h-full">
        <Card className={cn(
          "border-none shadow-xl rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl relative h-full flex flex-col",
          isBlocked 
            ? "bg-red-50 border-2 border-red-100" 
            : "bg-white"
        )}>
          {/* Decorative Gradient Background for Active State */}
          {!isBlocked && (
             <div className="absolute top-0 right-0 w-[400px] h-full bg-gradient-to-l from-indigo-50/80 to-transparent pointer-events-none" />
          )}

          <CardContent className="p-0 flex-1 flex flex-col">
             <div className="flex flex-col h-full">
                {/* Status Header */}
                <div className={cn(
                  "p-6 flex flex-col justify-center border-b border-slate-100 relative overflow-hidden shrink-0",
                   isBlocked ? "bg-red-100/50" : "bg-slate-50/50"
                )}>
                    <div className="relative z-10 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                           <Badge variant={isBlocked ? "destructive" : "secondary"} className={cn("px-2.5 py-0.5 text-[10px] font-bold tracking-wider rounded-md", !isBlocked && "bg-white text-indigo-600")}>
                              {billing?.billingStatus || "UNKNOWN"}
                           </Badge>
                        </div>
                        <h3 className="text-lg font-black font-sora text-slate-800 flex items-center gap-2">
                           {isBlocked ? <AlertCircle className="h-5 w-5 text-red-500" /> : <CreditCard className="h-5 w-5 text-indigo-600" />}
                           {isBlocked ? "Access Revoked" : "Subscription"}
                        </h3>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Students</p>
                         <p className="text-2xl font-black text-slate-800 font-sora">{billing?.currentStudentCount}</p>
                      </div>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 p-6 flex flex-col justify-between gap-6">
                     {/* Stats Bar */}
                     <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-medium">
                           <span className="text-slate-500"><b className="text-slate-800">{billing?.paidStudentCount}</b> Paid</span>
                           <span className={cn(hasUnpaid ? "text-red-500 font-bold" : "text-emerald-600 font-bold")}>
                              {billing?.unpaidStudents} Unpaid
                           </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                           <div 
                              className={cn("h-full rounded-full transition-all duration-1000", isBlocked ? "bg-red-500" : "bg-emerald-500")} 
                              style={{ width: `${billing?.currentStudentCount ? (billing.paidStudentCount / billing.currentStudentCount) * 100 : 0}%` }}
                           />
                        </div>
                     </div>

                     {/* Action Area */}
                     <div className="mt-auto">
                        {hasUnpaid ? (
                           <div className="flex items-center justify-between gap-4">
                             <div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Due Now</p>
                               <div className="flex items-baseline gap-1">
                                 <span className="text-xl font-black text-slate-800 font-sora">₦{billing?.amountDue?.toLocaleString()}</span>
                               </div>
                               {billing?.hoursRemaining !== null && billing?.hoursRemaining !== undefined && !isBlocked && (
                                  <p className="text-[10px] font-bold text-amber-500 flex items-center gap-1 mt-0.5">
                                    <Clock className="h-2.5 w-2.5" /> {billing.hoursRemaining}h left
                                  </p>
                               )}
                             </div>
                             <Button 
                                className={cn(
                                  "rounded-xl font-bold font-sora shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95 px-5 py-2 h-10 text-sm",
                                  isBlocked ? "bg-red-600 hover:bg-red-700 shadow-red-100" : "bg-indigo-600 hover:bg-indigo-700"
                                )}
                                onClick={async () => {
                                  if (!billing) return;
                                  try {
                                    const res = await fetch("/api/payments/create", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        amount: billing.amountDue,
                                        type: "USAGE_BILLING"
                                      })
                                    });
                                    const data = await res.json();
                                    if (data.checkout_url) {
                                      window.location.href = data.checkout_url;
                                    }
                                  } catch (error) {
                                    console.error("Payment initiation failed", error);
                                  }
                                }}
                              >
                                {isBlocked ? "Restore Access" : "Pay Now"}
                             </Button>
                           </div>
                        ) : (
                           <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                              <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                              <div className="leading-tight">
                                <p className="text-xs font-bold text-slate-800">All Caught Up</p>
                                <p className="text-[10px] text-slate-500">No pending bills</p>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
             </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
