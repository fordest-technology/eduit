"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/app/components/dashboard-header";
import {
    Wallet,
    TrendingUp,
    Download,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    CheckCircle,
    XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Transaction {
    id: string;
    amount: number;
    type: "CREDIT" | "DEBIT";
    status: "PENDING" | "SUCCESS" | "FAILED";
    reference: string;
    description: string;
    createdAt: string;
}

interface WalletData {
    balance: number;
    virtualAccountNo?: string;
    virtualBankName?: string;
    transactions: Transaction[];
}

export default function WalletPage() {
    const router = useRouter();
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        async function fetchWallet() {
            try {
                const sessionRes = await fetch("/api/auth/session");
                const session = await sessionRes.json();

                if (!session || !session.schoolId) {
                    router.push("/login");
                    return;
                }

                const res = await fetch(`/api/schools/${session.schoolId}/wallet`);
                if (!res.ok) throw new Error("Failed to fetch wallet");

                const data = await res.json();
                setWallet(data);
            } catch (error) {
                toast.error("Failed to load wallet data");
            } finally {
                setLoading(false);
            }
        }
        fetchWallet();
    }, [router]);

    const handleWithdrawal = async () => {
        if (!wallet || wallet.balance <= 0) {
            toast.error("Insufficient balance for withdrawal");
            return;
        }

        try {
            setProcessing(true);
            // This will be implemented when we integrate the payment gateway
            toast.info("Withdrawal feature coming soon. Please set up your settlement account first.");
        } catch (error) {
            toast.error("Failed to process withdrawal");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <DashboardHeader
                heading="School Wallet"
                text="Manage your school's finances and track all transactions"
                icon={<Wallet className="h-6 w-6" />}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Balance Card */}
                <Card className="lg:col-span-2 border-none shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            <Wallet className="h-6 w-6" />
                            Available Balance
                        </CardTitle>
                        <CardDescription className="text-white/80">
                            Total revenue collected through the platform
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="text-5xl font-bold tracking-tight">
                                {wallet ? formatCurrency(wallet.balance) : "₦0.00"}
                            </div>

                            {wallet?.virtualAccountNo && (
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                                    <p className="text-sm text-white/70 mb-1">Collection Account</p>
                                    <p className="font-mono text-lg font-bold">{wallet.virtualAccountNo}</p>
                                    <p className="text-sm text-white/80 mt-1">{wallet.virtualBankName}</p>
                                </div>
                            )}

                            <Button
                                onClick={handleWithdrawal}
                                disabled={processing || !wallet || wallet.balance <= 0}
                                className="w-full bg-white text-indigo-600 hover:bg-white/90 font-bold h-12"
                            >
                                {processing ? "Processing..." : "Withdraw to Bank Account"}
                                <ArrowUpRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="space-y-4">
                    <Card className="border-none shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                This Month
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(0)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Total revenue collected</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Pending
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-amber-600">
                                {formatCurrency(0)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">In processing</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Transactions Table */}
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Transaction History</CardTitle>
                    <CardDescription>All credits and debits to your wallet</CardDescription>
                </CardHeader>
                <CardContent>
                    {wallet?.transactions && wallet.transactions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {wallet.transactions.map((txn) => (
                                    <TableRow key={txn.id}>
                                        <TableCell className="font-mono text-sm">{txn.reference}</TableCell>
                                        <TableCell>{txn.description || "—"}</TableCell>
                                        <TableCell>
                                            <Badge variant={txn.type === "CREDIT" ? "default" : "secondary"} className="gap-1">
                                                {txn.type === "CREDIT" ? (
                                                    <ArrowDownRight className="h-3 w-3" />
                                                ) : (
                                                    <ArrowUpRight className="h-3 w-3" />
                                                )}
                                                {txn.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={cn(
                                            "text-right font-bold",
                                            txn.type === "CREDIT" ? "text-green-600" : "text-red-600"
                                        )}>
                                            {txn.type === "CREDIT" ? "+" : "-"}{formatCurrency(txn.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    txn.status === "SUCCESS"
                                                        ? "default"
                                                        : txn.status === "PENDING"
                                                            ? "secondary"
                                                            : "destructive"
                                                }
                                                className="gap-1"
                                            >
                                                {txn.status === "SUCCESS" && <CheckCircle className="h-3 w-3" />}
                                                {txn.status === "PENDING" && <Clock className="h-3 w-3" />}
                                                {txn.status === "FAILED" && <XCircle className="h-3 w-3" />}
                                                {txn.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(txn.createdAt).toLocaleDateString("en-GB")}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12">
                            <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg font-semibold text-muted-foreground">No transactions yet</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Transactions will appear here once parents start making payments
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
