"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Download, Eye, CreditCard, Users, MoreHorizontal, XCircle } from "lucide-react";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
    account: {
        id: string;
        name: string;
    };
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
    students: { id: string }[];
}

interface Student {
    id: string;
    user: {
        name: string;
        email: string;
    };
}

interface BillsTabProps {
    bills: Bill[];
    paymentAccounts: any[];
    students: Student[];
    classes: Class[];
}

export function BillsTab({ bills, paymentAccounts, students, classes }: BillsTabProps) {
    const router = useRouter();
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
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
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Bill
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] overflow-y-auto w-[800px] p-6">
                            <DialogHeader className="space-y-3 pb-6 border-b">
                                <DialogTitle className="text-2xl font-semibold tracking-tight">Create New Bill</DialogTitle>
                                <DialogDescription className="text-base text-muted-foreground">
                                    Fill in the details below to create a new bill. Add as many items as needed.
                                </DialogDescription>
                            </DialogHeader>
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
                                            router.refresh();
                                        } catch (error) {
                                            console.error("Error creating bill:", error);
                                            toast.error(error instanceof Error ? error.message : "Failed to create bill");
                                        }
                                    }}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Paid</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bills.map((bill) => {
                                const status = getBillStatus(bill);
                                const totalPaid = getTotalPaid(bill);
                                return (
                                    <TableRow key={bill.id}>
                                        <TableCell className="font-medium">{bill.name}</TableCell>
                                        <TableCell>{bill.account.name}</TableCell>
                                        <TableCell>{formatCurrency(bill.amount)}</TableCell>
                                        <TableCell>{formatCurrency(totalPaid)}</TableCell>
                                        <TableCell>
                                            <Badge variant={status.variant}>
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(bill.createdAt), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => router.push(`/dashboard/fees/${bill.id}`)}
                                                    >
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
                                                        Assign
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(bill.id)}
                                                        className="text-destructive"
                                                    >
                                                        <XCircle className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
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