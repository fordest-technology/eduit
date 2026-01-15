"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
    Plus,
    Eye,
    Users,
    MoreHorizontal,
    Calendar as CalendarIcon,
    Trash2,
    Building2,
    ShieldCheck,
    ReceiptText,
    SearchX
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BillForm } from "./bill-form";
import { BillAssignmentDialog } from "./bill-assignment-form";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AssignBillDialog } from "./assign-bill-dialog";

interface BillItem {
    id: string;
    name: string;
    amount: number;
    description?: string;
}

interface Bill {
    id: string;
    name: string;
    amount: number;
    account?: {
        id: string;
        name: string;
    } | null;
    assignments: {
        id: string;
        targetType: "CLASS" | "STUDENT";
        targetId: string;
        dueDate: string;
        status: "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
        studentPayments: {
            amountPaid: number;
            studentId: string;
        }[];
        student?: {
            user: {
                name: string;
            };
        };
        class?: {
            name: string;
            section?: string;
        };
    }[];
    createdAt: string;
}

interface Class {
    id: string;
    name: string;
    section?: string;
    _count?: {
        students: number;
    };
}

interface Student {
    id: string;
    name: string;
    email: string;
    currentClass?: {
        id: string;
        name: string;
        section?: string;
    };
}

interface BillsTabProps {
    bills: Bill[];
    paymentAccounts: any[];
    students: Student[];
    classes: Class[];
    onRefresh: () => Promise<void>;
}

export function BillsTab({ bills, paymentAccounts, students, classes, onRefresh }: BillsTabProps) {
    const router = useRouter();
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
        }).format(amount);
    };

    const getBillStatus = (bill: Bill) => {
        if (bill.assignments.some(a => a.status === "OVERDUE")) {
            return { label: "Overdue", variant: "destructive" as const };
        }
        if (bill.assignments.every(a => a.status === "PAID")) {
            return { label: "Paid", variant: "default" as const };
        }
        if (bill.assignments.some(a => a.status === "PARTIALLY_PAID")) {
            return { label: "Partially Paid", variant: "secondary" as const };
        }
        return { label: "Pending", variant: "outline" as const };
    };

    const getTotalPaid = (bill: Bill) => {
        return bill.assignments.reduce((total, assignment) => {
            return total + assignment.studentPayments.reduce((sum, payment) => sum + payment.amountPaid, 0);
        }, 0);
    };

    const handleDelete = async (billId: string) => {
        try {
            const response = await fetch(`/api/bills/${billId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete bill");
            }

            toast.success("Bill deleted successfully");
            await onRefresh();
            router.refresh();
        } catch (error) {
            console.error("Error deleting bill:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete bill");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Bills</h2>
                    <p className="text-muted-foreground">
                        Manage and track fee bills
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Bill
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-xl overflow-y-auto">
                            <SheetHeader className="space-y-3 pb-6 border-b">
                                <SheetTitle className="text-2xl font-semibold tracking-tight">Create New Bill</SheetTitle>
                                <SheetDescription className="text-base text-muted-foreground">
                                    Fill in the details below to create a new bill. Add as many items as needed.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="my-6">
                                <BillForm
                                    paymentAccounts={paymentAccounts}
                                    onSubmit={async (data) => {
                                        try {
                                            const response = await fetch("/api/bills", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify(data),
                                            });
                                            if (!response.ok) {
                                                const errorData = await response.json();
                                                throw new Error(errorData.error || "Failed to create bill");
                                            }
                                            toast.success("Bill created successfully");
                                            await onRefresh();
                                            router.refresh();
                                        } catch (error) {
                                            console.error("Error creating bill:", error);
                                            toast.error(error instanceof Error ? error.message : "Failed to create bill");
                                        }
                                    }}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-b">
                                    <TableHead className="w-[30%] py-4 font-bold text-slate-700">Bill Details</TableHead>
                                    <TableHead className="py-4 font-bold text-slate-700">Settlement</TableHead>
                                    <TableHead className="py-4 font-bold text-slate-700 text-right">Target Amount</TableHead>
                                    <TableHead className="py-4 font-bold text-slate-700 text-right">Total Paid</TableHead>
                                    <TableHead className="py-4 font-bold text-slate-700">Overall Status</TableHead>
                                    <TableHead className="py-4 font-bold text-slate-700 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bills.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-72 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                <div className="p-4 bg-slate-100 rounded-full">
                                                    <SearchX className="h-10 w-10 text-slate-400" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-lg font-bold text-slate-900">No bills found</p>
                                                    <p className="text-sm text-slate-500">Create your first bill to start tracking fee payments.</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    bills.map((bill) => {
                                        const status = getBillStatus(bill);
                                        const totalPaid = getTotalPaid(bill);
                                        const isAutomated = !bill.account;
                                        
                                        return (
                                            <TableRow key={bill.id} className="group hover:bg-slate-50/80 transition-colors">
                                                <TableCell className="py-5">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1 p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                            <ReceiptText className="h-4 w-4" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="font-bold text-slate-900 leading-none">{bill.name}</p>
                                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                                                                <CalendarIcon className="h-3 w-3" />
                                                                {format(new Date(bill.createdAt), "MMM d, yyyy")}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    {isAutomated ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 transition-colors gap-1 px-2 py-0.5">
                                                                <ShieldCheck className="h-3 w-3" />
                                                                Squad Automated
                                                            </Badge>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                                                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                            <span className="text-sm">{bill.account?.name}</span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-5 text-right font-mono font-bold text-slate-900">
                                                    {formatCurrency(bill.amount)}
                                                </TableCell>
                                                <TableCell className="py-5 text-right font-mono font-bold text-emerald-600">
                                                    {formatCurrency(totalPaid)}
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <Badge 
                                                        variant={status.variant}
                                                        className={cn(
                                                            "font-bold px-3 py-1",
                                                            status.variant === "default" && "bg-emerald-500 hover:bg-emerald-600",
                                                            status.variant === "secondary" && "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200"
                                                        )}
                                                    >
                                                        {status.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-8 w-8 p-0 text-slate-400 hover:text-primary hover:bg-primary/10"
                                                            onClick={() => router.push(`/dashboard/fees/${bill.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:bg-slate-100">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 py-2">Management</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => router.push(`/dashboard/fees/${bill.id}`)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem 
                                                                    onClick={() => {
                                                                        setSelectedBill(bill);
                                                                        setIsAssignDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Users className="mr-2 h-4 w-4" />
                                                                    Assign to...
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem 
                                                                    className="text-destructive focus:text-destructive focus:bg-destructive/5"
                                                                    onClick={() => handleDelete(bill.id)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete Bill
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {selectedBill && (
                <AssignBillDialog
                    isOpen={isAssignDialogOpen}
                    onClose={() => {
                        setIsAssignDialogOpen(false);
                        setSelectedBill(null);
                    }}
                    bill={selectedBill}
                    classes={classes}
                    students={students}
                />
            )}
        </div>
    );
} 