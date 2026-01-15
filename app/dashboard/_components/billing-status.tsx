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
      className="mb-8"
    >
      <motion.div variants={itemVariants}>
        <Card className={cn(
          "border-none shadow-xl rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl max-w-2xl mx-auto",
          isBlocked ? "bg-red-50 border-2 border-red-200" : "bg-white"
        )}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold font-sora">Subscription status</CardTitle>
              <Badge variant={isBlocked ? "destructive" : "outline"} className="rounded-full px-4 py-1">
                {isBlocked ? "BLOCKED" : "ACTIVE"}
              </Badge>
            </div>
            <CardDescription>Progressive Student-Based Billing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border border-slate-100 group transition-all hover:bg-white hover:border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 rounded-2xl text-blue-600 transition-transform group-hover:scale-110">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Students</p>
                    <p className="text-xl font-black text-slate-800 tracking-tight">{billing?.currentStudentCount} <span className="text-slate-400 font-medium text-sm">onboarded</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paid For</p>
                  <p className="text-xl font-black text-slate-800 tracking-tight">{billing?.paidStudentCount}</p>
                </div>
              </div>

              <AnimatePresence>
                {hasUnpaid && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, scale: 0.9 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.9 }}
                    className={cn(
                      "p-5 rounded-3xl flex items-start gap-4 shadow-inner",
                      isBlocked ? "bg-red-100/30 text-red-900" : "bg-amber-50 text-amber-900"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-xl shrink-0",
                      isBlocked ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                    )}>
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black font-sora">
                        {isBlocked ? "Account Access Revoked" : "Action Required: Unpaid Students"}
                      </p>
                      <p className="text-xs font-medium mt-1 leading-relaxed opacity-80">
                        You have {billing?.unpaidStudents} students awaiting payment (₦{billing?.amountDue?.toLocaleString()}).
                        {billing?.hoursRemaining !== null && billing?.hoursRemaining !== undefined && !isBlocked && (
                          <span className="flex items-center gap-1 mt-2 font-black">
                            <Clock className="h-3 w-3" />
                            Blocks in {billing.hoursRemaining} hours
                          </span>
                        )}
                      </p>
                      <Button 
                        size="sm" 
                        className={cn(
                          "mt-4 rounded-xl font-bold shadow-lg transition-all active:scale-95",
                          isBlocked ? "bg-red-600 hover:bg-red-700" : "bg-slate-900 hover:bg-slate-800"
                        )}
                        disabled={!billing}
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
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay ₦{billing?.amountDue.toLocaleString() ?? "0"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!hasUnpaid && (
                <div className="p-4 rounded-3xl bg-green-50/50 border border-green-100 flex items-center gap-3">
                  <div className="p-1.5 bg-green-500 rounded-full text-white">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-xs font-black text-green-800 uppercase tracking-tight">Verified & Fully Paid</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
