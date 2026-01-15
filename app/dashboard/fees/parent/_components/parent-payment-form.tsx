"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  ArrowRight, 
  Wallet, 
  Receipt, 
  Check
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

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

interface ParentPaymentFormProps {
    children: any[];
    bills: any[];
}

export function ParentPaymentForm({
    children,
    bills,
}: ParentPaymentFormProps) {
    const router = useRouter();
    const [selectedChild, setSelectedChild] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
    const searchParams = useSearchParams();

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
                        // Automatically redirect after a short delay
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

            if ((result.status === 200 || result.status === "success" || result.success) && (result.data?.checkout_url || result.checkout_url)) {
                const url = result.data?.checkout_url || result.checkout_url;
                toast.success("Redirecting to payment gateway...");
                window.location.href = url;
            } else {
                console.error("Ambiguous Squad Response:", result);
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
        <div className="space-y-6">
            <Card className="border-none shadow-none bg-slate-50/50">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium">Step 1: Select Student</CardTitle>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.push("/dashboard/fees/parent/history")}
                        className="text-xs font-bold text-slate-400 hover:text-black hover:bg-white"
                    >
                        <Receipt className="h-3 w-3 mr-2" />
                        PAYMENT HISTORY
                    </Button>
                </CardHeader>
                <CardContent>
                    <Select onValueChange={onStudentChange}>
                        <SelectTrigger className="w-full bg-white h-12 rounded-xl border-slate-200">
                            <SelectValue placeholder="Which child are you paying for?" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                            {children.map((child) => (
                                <SelectItem key={child.id} value={child.id}>
                                    {child.user.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedChild && (
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 px-1">
                        Assigned Fees
                    </h3>
                    
                    {assignedBills.length === 0 ? (
                        <Card className="border-dashed border-2 py-16 flex flex-col items-center justify-center text-slate-400 rounded-[2rem] bg-slate-50/50">
                            <Receipt className="h-12 w-12 mb-4 opacity-20" />
                            <p className="text-sm font-bold uppercase tracking-widest">No bills assigned to this student</p>
                        </Card>
                    ) : (
                        <div className="space-y-12">
                            {assignedBills.map((bill) => {
                                let currentPaidPool = bill.paidAmount;
                                
                                return (
                                    <div key={bill.id} className="space-y-6">
                                        {/* Bill Title & Overall Status */}
                                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
                                            <div>
                                                <h4 className="text-2xl font-black text-slate-900 font-sora tracking-tight leading-none group flex items-center gap-3">
                                                    {bill.name}
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold text-[10px] uppercase truncate max-w-[120px]">
                                                        {bill.assignmentType}
                                                    </Badge>
                                                </h4>
                                                <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">
                                                    Due: {format(new Date(bill.createdAt), "MMMM d, yyyy")}
                                                </p>
                                            </div>
                                            <div className="text-left md:text-right">
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Balance</p>
                                                <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                                    {formatCurrency(bill.balance)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid gap-4">
                                            {(bill.items?.length > 0 ? bill.items : [{ id: bill.id, name: bill.name, amount: bill.amount }]).map((item: any) => {
                                                const paidForItem = Math.min(item.amount, currentPaidPool);
                                                currentPaidPool = Math.max(0, currentPaidPool - item.amount);
                                                const itemBalance = item.amount - paidForItem;
                                                const isFullyPaid = itemBalance <= 0;
                                                const payId = `${bill.id}-${item.id}`;

                                                return (
                                                    <Card 
                                                        key={item.id} 
                                                        className={cn(
                                                            "group transition-all rounded-[2rem] border-slate-100 shadow-sm hover:shadow-xl hover:shadow-black/5 flex flex-col md:flex-row items-center justify-between p-6 md:p-8 gap-6",
                                                            isFullyPaid ? "bg-slate-50/50" : "bg-white"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-6 w-full">
                                                            <div className={cn(
                                                                "h-16 w-16 rounded-[1.25rem] flex items-center justify-center transition-all group-hover:scale-110",
                                                                isFullyPaid ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-600"
                                                            )}>
                                                                {isFullyPaid ? <CheckCircle2 className="h-8 w-8" /> : <Wallet className="h-8 w-8" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-1">
                                                                    <p className="text-xl font-black text-slate-800 font-sora leading-tight">{item.name}</p>
                                                                    {isFullyPaid && (
                                                                        <Badge className="bg-green-100 text-green-700 border-none font-black text-[10px] uppercase tracking-tighter">Paid</Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm font-bold text-slate-400">
                                                                    Full Cost: {formatCurrency(item.amount)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto border-t md:border-t-0 pt-6 md:pt-0">
                                                            <div className="text-left md:text-right">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Outstanding</p>
                                                                <p className={cn(
                                                                    "text-xl font-black tracking-tight font-sora",
                                                                    isFullyPaid ? "text-slate-300" : "text-slate-900"
                                                                )}>
                                                                    {formatCurrency(itemBalance)}
                                                                </p>
                                                            </div>

                                                            {!isFullyPaid ? (
                                                                <Button 
                                                                    onClick={() => handlePayNow(bill, itemBalance, item.name)}
                                                                    disabled={!!isSubmitting}
                                                                    className="h-14 px-8 rounded-2xl bg-black hover:bg-slate-800 text-white font-black font-sora text-base shadow-xl shadow-black/10 active:scale-95 transition-all w-full md:w-auto"
                                                                >
                                                                    {isSubmitting === `${bill.id}-${item.name}` ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                            <span>Processing...</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-2">
                                                                            <span>Pay Now</span>
                                                                            <ArrowRight className="h-5 w-5" />
                                                                        </div>
                                                                    )}
                                                                </Button>
                                                            ) : (
                                                                <div className="h-14 flex items-center gap-3 px-6 rounded-2xl bg-green-50 text-green-600 font-black text-sm border border-green-100">
                                                                    <Check className="h-5 w-5" />
                                                                    COMPLETED
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Card>
                                                )
                                            })}

                                            {/* Final Total / Whole Bill Option */}
                                            {bill.balance > 0 && bill.items?.length > 1 && (
                                                <div className="mt-4 flex flex-col md:flex-row items-center justify-between p-8 rounded-[2rem] bg-slate-900 text-white shadow-2xl">
                                                    <div>
                                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Settle Remaining Total</p>
                                                        <h5 className="text-3xl font-black font-sora leading-none">
                                                            {formatCurrency(bill.balance)}
                                                        </h5>
                                                    </div>
                                                    <Button 
                                                        onClick={() => handlePayNow(bill, bill.balance)}
                                                        disabled={!!isSubmitting}
                                                        className="h-14 mt-6 md:mt-0 px-10 rounded-2xl bg-white text-black hover:bg-slate-200 font-black font-sora shadow-lg shadow-white/10 w-full md:w-auto transition-all active:scale-95"
                                                    >
                                                        Pay Full Balance
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}

                            <div className="flex items-center justify-center gap-3 pt-8 pb-4 opacity-50 grayscale">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered By</p>
                                <img src="/squad.png" alt="Squad" className="h-4 w-auto object-contain" />
                                <div className="h-3 w-px bg-slate-300"></div>
                                <img src="/habaripay.jpg" alt="HabariPay" className="h-4 w-auto object-contain" />
                                <div className="h-3 w-px bg-slate-300"></div>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Guaranty_Trust_Bank_Logo_2022.svg/1200px-Guaranty_Trust_Bank_Logo_2022.svg.png" alt="GTBank" className="h-4 w-auto object-contain" />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
