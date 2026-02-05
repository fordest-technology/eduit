"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    CheckCircle2,
    ArrowRight,
    Wallet,
    Receipt,
    Check,
    CreditCard,
    ShoppingBag,
    Info,
    Loader2,
    ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ParentPaymentFormProps {
    children: any[];
    bills: any[];
}

export function ParentPaymentForm({
    children,
    bills,
}: ParentPaymentFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlChildId = searchParams.get("childId");

    const [selectedChild, setSelectedChild] = useState<any | null>(
        children.find(c => c.id === urlChildId) || null
    );
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

    // Check for successful payment on mount
    useEffect(() => {
        const reference = searchParams.get("transaction_ref") || searchParams.get("reference");
        if (reference) {
            const verifyPayment = async () => {
                toast.loading("Verifying your payment...", { id: "verify-p" });
                try {
                    const res = await fetch(`/api/payments/verify?reference=${reference}`);
                    const result = await res.json();

                    if (result.status === "success") {
                        toast.success("Payment verified successfully!", {
                            id: "verify-p",
                            description: "Your receipt is ready.",
                            action: {
                                label: "View Receipt",
                                onClick: () => router.push(`/dashboard/receipt/${reference}`)
                            }
                        });
                        setTimeout(() => {
                            router.push(`/dashboard/receipt/${reference}`);
                        }, 2000);
                    } else if (result.error) {
                        toast.error(result.error || "Could not verify payment status", { id: "verify-p" });
                    } else {
                        toast.dismiss("verify-p");
                    }
                } catch (error) {
                    console.error("Verification error:", error);
                    toast.dismiss("verify-p");
                }
            };
            verifyPayment();
        }
    }, [searchParams, router]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
        }).format(amount);
    };

    // Handle student selection
    const onStudentChange = (studentId: string) => {
        setSelectedChild(children.find((child) => child.id === studentId));
    };

    // Get assigned bills for the selected student
    const getAssignedBills = () => {
        if (!selectedChild) return [];

        const studentId = selectedChild.id;
        const classIds = Array.isArray(selectedChild.classes)
            ? selectedChild.classes.map((c: any) => c.classId || (c.class && c.class.id))
            : [];

        return bills.filter((bill: any) => {
            return bill.assignments.some(
                (assignment: any) =>
                    (assignment.targetType === "STUDENT" && assignment.targetId === studentId) ||
                    (assignment.targetType === "CLASS" && classIds.includes(assignment.targetId))
            );
        }).map(bill => {
            const assignment = bill.assignments.find((a: any) =>
                (a.targetType === "STUDENT" && a.targetId === studentId) ||
                (a.targetType === "CLASS" && classIds.includes(a.targetId))
            );

            const paidAmount = assignment?.studentPayments?.filter((p: any) => p.studentId === studentId).reduce((sum: number, p: any) => sum + p.amountPaid, 0) || 0;
            const balance = Math.max(0, bill.amount - paidAmount);
            const status = balance <= 0 ? "PAID" : (paidAmount > 0 ? "PARTIALLY_PAID" : "PENDING");

            return {
                ...bill,
                assignmentId: assignment?.id,
                assignmentType: assignment?.targetType,
                paidAmount,
                balance,
                status
            };
        });
    };

    const [vaDetails, setVaDetails] = useState<any | null>(null);

    const handlePayNow = async (bill: any, amountToPay: number, itemName?: string) => {
        const payId = itemName ? `${bill.id}-${itemName}` : bill.id;
        setIsSubmitting(payId);

        try {
            if (isNaN(amountToPay) || amountToPay <= 0) {
                toast.error("Invalid payment amount");
                setIsSubmitting(null);
                return;
            }

            const response = await fetch("/api/payments/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: "FEE_PAYMENT",
                    amount: amountToPay,
                    studentId: selectedChild.id,
                    billId: bill.id,
                    billAssignmentId: bill.assignmentId,
                    description: `Payment for ${itemName ? `${itemName} (${bill.name})` : bill.name} - ${selectedChild.user.name}`
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to initiate payment");
            }

            if (result.status === "success" && result.payment_method === "TRANSFER") {
                setVaDetails(result.account_details);
                toast.success("Virtual account generated!");
            } else if ((result.status === 200 || result.status === "success" || result.success) && (result.data?.checkout_url || result.checkout_url)) {
                // Fallback for legacy or other methods
                const url = result.data?.checkout_url || result.checkout_url;
                window.location.href = url;
            } else {
                throw new Error("Invalid response from payment gateway");
            }
        } catch (error) {
            console.error("Payment error:", error);
            toast.error(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsSubmitting(null);
        }
    };

    const assignedBills = getAssignedBills();

    return (
        <div className="space-y-10">
            {/* Student Selector Card */}
            <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden p-8 border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-black font-sora text-slate-800 text-lg">Identity Verification</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select student account to settle</p>
                        </div>
                    </div>
                    <div className="flex-1 md:max-w-md">
                        <Select onValueChange={onStudentChange} value={selectedChild?.id}>
                            <SelectTrigger className="w-full bg-slate-50 h-14 rounded-2xl border-none font-bold text-slate-700 focus:ring-indigo-500/20">
                                <SelectValue placeholder="Which child are you paying for?" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                {children.map((child) => (
                                    <SelectItem key={child.id} value={child.id} className="rounded-xl font-bold py-3">
                                        {child.user.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            <AnimatePresence mode="wait">
                {vaDetails ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex justify-center"
                    >
                        <Card className="w-full max-w-2xl border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden relative">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
                             <div className="p-10 space-y-8 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black font-sora text-white">Bank Transfer</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Temporary Payment Account</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                        <ArrowRight className="h-6 w-6 text-indigo-400 rotate-90" />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col items-center gap-2">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Transfer Exactly</p>
                                        <h4 className="text-5xl font-black font-sora tracking-tighter">
                                            {formatCurrency(vaDetails.amount)}
                                        </h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bank Name</p>
                                            <div className="h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center px-6 font-bold text-lg">
                                                {vaDetails.bankName}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Number</p>
                                            <div className="h-14 rounded-2xl bg-indigo-500 text-white flex items-center justify-between px-6 font-black text-2xl tracking-widest group cursor-pointer" onClick={() => {
                                                navigator.clipboard.writeText(vaDetails.accountNumber);
                                                toast.success("Account number copied!");
                                            }}>
                                                {vaDetails.accountNumber}
                                                <Badge className="bg-white/20 text-white border-none text-[9px]">COPY</Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Beneficiary</p>
                                        <div className="h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center px-6 font-bold text-slate-300">
                                            {vaDetails.accountName}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-tight flex gap-3 items-center">
                                    <Info className="h-5 w-5 shrink-0" />
                                    <span>This account is temporary and expires in 30 minutes. Once payment is made, your receipt will be generated automatically.</span>
                                </div>

                                <div className="flex gap-4">
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 h-14 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-black uppercase text-xs tracking-widest"
                                        onClick={() => setVaDetails(null)}
                                    >
                                        Cancel Transaction
                                    </Button>
                                    <Button 
                                        className="flex-1 h-14 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black uppercase text-xs tracking-widest"
                                        onClick={() => {
                                            toast.info("Checking for payment status...");
                                            // Verification logic will trigger automatically via webhook
                                        }}
                                    >
                                        I Have Paid
                                    </Button>
                                </div>
                             </div>
                        </Card>
                    </motion.div>
                ) : selectedChild && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                                Assigned Obligations
                            </h3>
                            <Badge className="bg-slate-100 text-slate-400 border-none font-black text-[10px] tracking-widest px-3">
                                {assignedBills.length} Active Bills
                            </Badge>
                        </div>

                        {assignedBills.length === 0 ? (
                            <Card className="border-dashed border-2 py-20 flex flex-col items-center justify-center text-slate-400 rounded-[3rem] bg-slate-50/50">
                                <ShoppingBag className="h-14 w-14 mb-4 opacity-10" />
                                <p className="text-sm font-black uppercase tracking-widest text-slate-300">No active bills found for this account</p>
                            </Card>
                        ) : (
                            <div className="space-y-12">
                                {assignedBills.map((bill, bIdx) => {
                                    let currentPaidPool = bill.paidAmount;

                                    return (
                                        <motion.div
                                            key={bill.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: bIdx * 0.1 }}
                                            className="space-y-6"
                                        >
                                            {/* Bill Title & Overall Status */}
                                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="text-3xl font-black text-slate-900 font-sora tracking-tight leading-none group">
                                                            {bill.name}
                                                        </h4>
                                                        <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[10px] uppercase tracking-widest px-3 h-6">
                                                            {bill.assignmentType}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                        <span className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> Due: {format(new Date(bill.createdAt), "MMMM d, yyyy")}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-white px-8 py-4 rounded-[2rem] shadow-xl shadow-black/5 border border-slate-50 flex flex-col items-center">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Outstanding</p>
                                                    <p className="text-2xl font-black text-indigo-600 tracking-tighter font-sora">
                                                        {formatCurrency(bill.balance)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid gap-6">
                                                {(bill.items?.length > 0 ? bill.items : [{ id: bill.id, name: bill.name, amount: bill.amount }]).map((item: any) => {
                                                    const paidForItem = Math.min(item.amount, currentPaidPool);
                                                    currentPaidPool = Math.max(0, currentPaidPool - item.amount);
                                                    const itemBalance = item.amount - paidForItem;
                                                    const isFullyPaid = itemBalance <= 0;

                                                    return (
                                                        <Card
                                                            key={item.id}
                                                            className={cn(
                                                                "group transition-all duration-500 rounded-[2.5rem] border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-black/10 flex flex-col md:flex-row items-center justify-between p-8 gap-8",
                                                                isFullyPaid ? "bg-slate-50/50 opacity-80" : "bg-white"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-6 w-full">
                                                                <div className={cn(
                                                                    "h-16 w-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 group-hover:rotate-6 shadow-lg",
                                                                    isFullyPaid ? "bg-emerald-50 text-emerald-600 shadow-emerald-500/10" : "bg-indigo-50 text-indigo-600 shadow-indigo-500/10"
                                                                )}>
                                                                    {isFullyPaid ? <CheckCircle2 className="h-8 w-8" /> : <Wallet className="h-8 w-8" />}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3 mb-1">
                                                                        <p className="text-2xl font-black text-slate-800 font-sora leading-tight">{item.name}</p>
                                                                        {isFullyPaid && (
                                                                            <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] uppercase tracking-widest px-3 h-5">Verified Paid</Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                        Benchmark Cost: <span className="text-slate-600">{formatCurrency(item.amount)}</span>
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between md:justify-end gap-10 w-full md:w-auto border-t md:border-t-0 pt-8 md:pt-0">
                                                                <div className="text-left md:text-right">
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Individual Balance</p>
                                                                    <p className={cn(
                                                                        "text-2xl font-black tracking-tighter font-sora",
                                                                        isFullyPaid ? "text-slate-300" : "text-slate-900"
                                                                    )}>
                                                                        {itemBalance === 0 ? "Settled" : formatCurrency(itemBalance)}
                                                                    </p>
                                                                </div>

                                                                {!isFullyPaid ? (
                                                                    <Button
                                                                        onClick={() => handlePayNow(bill, itemBalance, item.name)}
                                                                        disabled={!!isSubmitting}
                                                                        className="h-16 px-10 rounded-2xl bg-slate-900 hover:bg-black text-white font-black font-sora text-sm shadow-xl shadow-black/10 transition-all duration-300 active:scale-95 group/btn"
                                                                    >
                                                                        {isSubmitting === `${bill.id}-${item.name}` ? (
                                                                            <div className="flex items-center gap-3">
                                                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                                                <span>Generating ID...</span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center gap-3 uppercase tracking-widest">
                                                                                <span>Secure Settle</span>
                                                                                <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                                                                            </div>
                                                                        )}
                                                                    </Button>
                                                                ) : (
                                                                    <div className="h-16 flex items-center gap-3 px-8 rounded-2xl bg-emerald-50 text-emerald-600 font-black text-sm border border-emerald-100 shadow-sm shadow-emerald-500/5">
                                                                        <Check className="h-5 w-5" />
                                                                        FULLY CLEARED
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </Card>
                                                    )
                                                })}

                                                {/* Final Total / Whole Bill Option */}
                                                {bill.balance > 0 && bill.items?.length > 1 && (
                                                    <motion.div
                                                        whileHover={{ scale: 1.01 }}
                                                        className="mt-4 flex flex-col md:flex-row items-center justify-between p-10 rounded-[3rem] bg-indigo-600 text-white shadow-2xl relative overflow-hidden"
                                                    >
                                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                                                        <div className="relative z-10">
                                                            <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-2">Aggregated Settlement</p>
                                                            <h5 className="text-4xl font-black font-sora leading-none tracking-tighter">
                                                                 {formatCurrency(bill.balance)}
                                                            </h5>
                                                            <p className="text-xs text-white/60 font-medium mt-3">Clear all remaining items in this category instantly</p>
                                                        </div>
                                                        <Button
                                                            onClick={() => handlePayNow(bill, bill.balance)}
                                                            disabled={!!isSubmitting}
                                                            className="h-16 mt-8 md:mt-0 px-12 rounded-[1.5rem] bg-white text-indigo-600 hover:bg-slate-50 font-black font-sora shadow-2xl shadow-indigo-900/40 w-full md:w-auto transition-all active:scale-95 text-sm uppercase tracking-wider"
                                                        >
                                                            {isSubmitting === bill.id ? (
                                                                <div className="flex items-center gap-3">
                                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                                    <span>Authorizing...</span>
                                                                </div>
                                                            ) : "Settle Full Balance"}
                                                        </Button>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )
                                })}

                                <div className="flex flex-col items-center justify-center gap-4 pt-12 pb-6 border-t border-slate-100">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Institutional Secure Gateway</p>
                                    <div className="flex items-center gap-8 opacity-60 transition-all duration-500">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Powered by Payvessel</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
