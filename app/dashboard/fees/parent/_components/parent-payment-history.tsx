"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
    Download,
    ExternalLink,
    ChevronDown,
    Search,
    X,
    Check,
    Clock,
    AlertCircle,
    FileText,
    TrendingUp,
    Filter,
    ArrowUpRight,
    SearchX
} from "lucide-react";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PaymentRequestStudent {
    id: string;
    user: {
        id: string;
        name: string;
    };
}

interface PaymentRequest {
    id: string;
    amount: number;
    status: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    receiptUrl: string | null;
    notes: string | null;
    reviewedAt: string | Date | null;
    reviewNotes: string | null;
    student: PaymentRequestStudent;
    billAssignment: {
        id: string;
        bill: {
            id: string;
            name: string;
            description: string | null;
            amount: number;
            dueDate: string | Date;
            account: {
                id: string;
                name: string;
                bankName: string;
                accountNo: string;
            };
        };
    };
    reviewedBy: {
        id: string;
        name: string;
    } | null;
}

interface ParentPaymentHistoryProps {
    paymentRequests: PaymentRequest[];
    children: PaymentRequestStudent[];
}

export function ParentPaymentHistory({ paymentRequests, children }: ParentPaymentHistoryProps) {
    const [studentFilter, setStudentFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Format currency values
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
        }).format(amount);
    };

    // Format dates
    const formatDate = (dateString: string | Date | null) => {
        if (!dateString) return "N/A";
        return format(new Date(dateString), "PPP");
    };

    // Status badge styling
    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; bg: string; text: string; icon: any }> = {
            PENDING: {
                label: "Audit Pending",
                bg: "bg-amber-50",
                text: "text-amber-600",
                icon: Clock
            },
            APPROVED: {
                label: "Verified Paid",
                bg: "bg-emerald-50",
                text: "text-emerald-600",
                icon: Check
            },
            REJECTED: {
                label: "Record Declined",
                bg: "bg-rose-50",
                text: "text-rose-600",
                icon: X
            },
        };

        const config = statusMap[status] || {
            label: status,
            bg: "bg-slate-50",
            text: "text-slate-600",
            icon: AlertCircle
        };

        const Icon = config.icon;

        return (
            <Badge className={cn("flex items-center gap-1.5 border-none font-black text-[10px] tracking-widest px-3 h-6 uppercase", config.bg, config.text)}>
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    // Filter and search data
    const filteredPaymentRequests = paymentRequests.filter((request) => {
        if (studentFilter !== "all" && request.student.id !== studentFilter) return false;
        if (statusFilter !== "all" && request.status !== statusFilter) return false;
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
                request.billAssignment.bill.name.toLowerCase().includes(searchLower) ||
                (request.billAssignment.bill.description?.toLowerCase().includes(searchLower) || false) ||
                request.student.user.name.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    return (
        <div className="space-y-8">
            {/* Search & Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="relative w-full lg:max-w-md group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                        <Search className="h-5 w-5" />
                    </div>
                    <Input
                        placeholder="Search audit trail..."
                        className="pl-12 h-14 rounded-2xl border-none bg-white shadow-xl shadow-black/5 font-bold focus-visible:ring-indigo-500/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                            onClick={() => setSearchTerm("")}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-xl shadow-black/5 border border-slate-50">
                        <Filter className="h-4 w-4 text-slate-400" />
                        <Select value={studentFilter} onValueChange={setStudentFilter}>
                            <SelectTrigger className="w-[180px] border-none shadow-none h-10 font-bold text-slate-600 focus:ring-0">
                                <SelectValue placeholder="All Students" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                <SelectItem value="all" className="rounded-xl font-bold">All Students</SelectItem>
                                {children.map((child) => (
                                    <SelectItem key={child.id} value={child.id} className="rounded-xl font-bold">
                                        {child.user.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-xl shadow-black/5 border border-slate-50">
                        <TrendingUp className="h-4 w-4 text-slate-400" />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px] border-none shadow-none h-10 font-bold text-slate-600 focus:ring-0">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                <SelectItem value="all" className="rounded-xl font-bold">All Status</SelectItem>
                                <SelectItem value="PENDING" className="rounded-xl font-bold">Pending</SelectItem>
                                <SelectItem value="APPROVED" className="rounded-xl font-bold">Approved</SelectItem>
                                <SelectItem value="REJECTED" className="rounded-xl font-bold">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {filteredPaymentRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] shadow-xl shadow-black/5 border border-slate-50">
                    <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-6 border border-slate-100 shadow-inner">
                        <SearchX className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-400 font-sora">No Records Found</h3>
                    <p className="text-slate-300 max-w-xs mt-2 font-medium text-center">Adjust your search parameters to locate specific payment entries.</p>
                </div>
            ) : (
                <div className="bg-white rounded-[3rem] shadow-xl shadow-black/5 border border-slate-50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-slate-100 hover:bg-transparent">
                                <TableHead className="pl-10 h-16 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student Account</TableHead>
                                <TableHead className="h-16 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Official Bill</TableHead>
                                <TableHead className="h-16 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount Settled</TableHead>
                                <TableHead className="h-16 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Audit Status</TableHead>
                                <TableHead className="pr-10 h-16 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPaymentRequests.map((request, idx) => (
                                <Collapsible
                                    key={request.id}
                                    open={expandedId === request.id}
                                    onOpenChange={() =>
                                        setExpandedId(expandedId === request.id ? null : request.id)
                                    }
                                    asChild
                                >
                                    <>
                                        <TableRow className="group hover:bg-slate-50/50 border-slate-50 transition-colors">
                                            <TableCell className="pl-10 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 w-2 rounded-full bg-indigo-500 group-hover:scale-[2] transition-transform duration-300" />
                                                    <span className="font-bold text-slate-700 font-sora">{request.student.user.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6 font-bold text-slate-600">
                                                {request.billAssignment.bill.name}
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <span className="font-black text-slate-800 font-sora tracking-tight">{formatCurrency(request.amount)}</span>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                {getStatusBadge(request.status)}
                                            </TableCell>
                                            <TableCell className="pr-10 py-6 text-right">
                                                <CollapsibleTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn(
                                                            "h-10 w-10 rounded-xl transition-all duration-300",
                                                            expandedId === request.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                                        )}
                                                    >
                                                        <ChevronDown
                                                            className={cn("h-4 w-4 transition-transform duration-300", expandedId === request.id && "rotate-180")}
                                                        />
                                                    </Button>
                                                </CollapsibleTrigger>
                                            </TableCell>
                                        </TableRow>

                                        <CollapsibleContent asChild>
                                            <TableRow className="bg-slate-50/30 hover:bg-slate-50/30 border-none transition-all">
                                                <TableCell colSpan={5} className="p-0 border-none">
                                                    <div className="px-10 py-10 animate-in slide-in-from-top-4 duration-500">
                                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                                            {/* Detailed Breakdown */}
                                                            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                <div className="space-y-4">
                                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                        <ArrowUpRight className="h-3 w-3" /> Transaction Context
                                                                    </h4>
                                                                    <div className="space-y-3 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                                                        <div className="flex justify-between items-center text-sm">
                                                                            <span className="font-bold text-slate-400">Ledger Bill</span>
                                                                            <span className="font-black text-slate-800">{request.billAssignment.bill.name}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-sm">
                                                                            <span className="font-bold text-slate-400">Authorized Date</span>
                                                                            <span className="font-black text-slate-800">{formatDate(request.createdAt)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-sm">
                                                                            <span className="font-bold text-slate-400">Institutional Unit</span>
                                                                            <span className="font-black text-slate-800">{request.billAssignment.bill.account?.bankName || "Treasury"}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                        <Check className="h-3 w-3" /> Audit Information
                                                                    </h4>
                                                                    <div className="space-y-3 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                                                        <div className="flex justify-between items-center text-sm">
                                                                            <span className="font-bold text-slate-400">Audit Status</span>
                                                                            {getStatusBadge(request.status)}
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-sm">
                                                                            <span className="font-bold text-slate-400">Review Date</span>
                                                                            <span className="font-black text-slate-800">{formatDate(request.reviewedAt)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-sm">
                                                                            <span className="font-bold text-slate-400">Auditor</span>
                                                                            <span className="font-black text-indigo-600 font-sora text-xs uppercase tracking-tight">{request.reviewedBy?.name || "System Automated"}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Actions & Notes */}
                                                            <div className="lg:col-span-4 space-y-6">
                                                                {request.receiptUrl && (
                                                                    <Link
                                                                        href={request.receiptUrl.startsWith("/") ? request.receiptUrl : "#"}
                                                                        target={request.receiptUrl.startsWith("/") ? "_blank" : undefined}
                                                                        onClick={() => !request.receiptUrl?.startsWith("/") && window.open(request.receiptUrl!, "_blank")}
                                                                        className="block group/receipt"
                                                                    >
                                                                        <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-600/20 group-hover/receipt:scale-[1.02] transition-transform duration-500 relative overflow-hidden">
                                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover/receipt:scale-150 transition-transform duration-700" />
                                                                            <div className="relative z-10 flex items-center justify-between">
                                                                                <div className="space-y-1">
                                                                                    <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Official Proof</p>
                                                                                    <h4 className="font-black font-sora text-sm">View Digital Receipt</h4>
                                                                                </div>
                                                                                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20">
                                                                                    <FileText className="h-5 w-5" />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </Link>
                                                                )}

                                                                {(request.notes || request.reviewNotes) && (
                                                                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                                                                        {request.notes && (
                                                                            <div>
                                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 font-sora">Payee Notes</p>
                                                                                <p className="text-xs text-slate-600 font-medium italic leading-relaxed">"{request.notes}"</p>
                                                                            </div>
                                                                        )}
                                                                        {request.reviewNotes && (
                                                                            <div className="pt-4 border-t border-slate-50">
                                                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2 font-sora">Audit Response</p>
                                                                                <p className="text-xs text-indigo-900 font-bold leading-relaxed">{request.reviewNotes}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="outline" className="w-full h-12 rounded-[1.25rem] border-slate-200 font-bold text-slate-600 gap-2 hover:bg-slate-50">
                                                                            Access Archival Actions
                                                                            <ChevronDown className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[200px]">
                                                                        <DropdownMenuItem onClick={() => window.print()} className="rounded-xl font-bold py-3">
                                                                            Print Transaction Log
                                                                        </DropdownMenuItem>
                                                                        {request.status === "REJECTED" && (
                                                                            <DropdownMenuItem
                                                                                onClick={() => window.location.href = `/dashboard/fees/parent?resubmit=${request.id}`}
                                                                                className="rounded-xl font-bold py-3 text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                                                                            >
                                                                                Attempt Re-submission
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        </CollapsibleContent>
                                    </>
                                </Collapsible>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
} 