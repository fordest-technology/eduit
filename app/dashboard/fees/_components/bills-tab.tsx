"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Download, Eye, CreditCard, Users, MoreHorizontal } from "lucide-react";
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
    items?: BillItem[];
    account: {
        id: string;
        name: string;
        bankName: string;
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
    };
}

interface BillsTabProps {
    bills: Bill[];
    paymentAccounts: Array<{
        id: string;
        name: string;
        bankName: string;
    }>;
    students: Array<{
        id: string;
        user: {
            name: string;
        };
    }>;
    classes: Array<{
        id: string;
        name: string;
        students: Array<{
            id: string;
        }>;
    }>;
}

export function BillsTab({ bills, paymentAccounts, students, classes }: BillsTabProps) {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const calculateTotalAmount = (bill: Bill) => {
        if (!bill.items || bill.items.length === 0) return 0;
        return bill.items.reduce((sum, item) => sum + item.amount, 0);
    };

    const handleCreateBill = async (data: any) => {
        try {
            const response = await fetch("/api/bills", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to create bill");
            }

            router.refresh();
            setIsCreating(false);
            toast.success("Bill created successfully");
        } catch (error) {
            toast.error("Failed to create bill");
            console.error(error);
        }
    };

    const handleAssignBill = async (data: any) => {
        try {
            const response = await fetch("/api/bills/assign", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to assign bill");
            }

            router.refresh();
            toast.success("Bill assigned successfully");
        } catch (error) {
            toast.error("Failed to assign bill");
            console.error(error);
        }
    };

    const getStatusColor = (status: Bill["assignments"][0]["status"]) => {
        switch (status) {
            case "PAID":
                return "bg-green-500";
            case "PARTIALLY_PAID":
                return "bg-yellow-500";
            case "PENDING":
                return "bg-blue-500";
            case "OVERDUE":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    const getTotalPaid = (assignment: Bill["assignments"][0]) => {
        return assignment.studentPayments.reduce(
            (sum, payment) => sum + payment.amountPaid,
            0
        );
    };

    const getTargetName = (assignment: Bill["assignments"][0]) => {
        if (assignment.targetType === "STUDENT") {
            const student = students.find(s => s.id === assignment.targetId);
            return student?.user.name || "Unknown Student";
        } else {
            const cls = classes.find(c => c.id === assignment.targetId);
            return cls?.name || "Unknown Class";
        }
    };

    const getTargetStudents = (assignment: Bill["assignments"][0]) => {
        if (assignment.targetType === "STUDENT") {
            return [assignment.targetId];
        } else {
            const cls = classes.find(c => c.id === assignment.targetId);
            return cls?.students.map(s => s.id) || [];
        }
    };

    function getBillStatus(bill: Bill) {
        const statuses = bill.assignments.map((a) => a.status);
        if (statuses.every((s) => s === "PAID")) return "PAID";
        if (statuses.some((s) => s === "PARTIALLY_PAID")) return "PARTIALLY_PAID";
        if (statuses.some((s) => s === "OVERDUE")) return "OVERDUE";
        return "PENDING";
    }

    const statusColors = {
        PAID: "bg-green-500",
        PARTIALLY_PAID: "bg-yellow-500",
        PENDING: "bg-blue-500",
        OVERDUE: "bg-red-500",
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Bills</h2>
                    <p className="text-muted-foreground">
                        Manage and track student bills and payments
                    </p>
                </div>
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Bill
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px]">
                        <DialogHeader>
                            <DialogTitle>Create New Bill</DialogTitle>
                            <DialogDescription>
                                Create a new bill for your school
                            </DialogDescription>
                        </DialogHeader>
                        <BillForm
                            paymentAccounts={paymentAccounts}
                            onSubmit={handleCreateBill}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Bills</CardTitle>
                    <CardDescription>
                        View and manage all bills for your school
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bill Items</TableHead>
                                <TableHead>Total Amount</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead>Assignments</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bills.map((bill) => {
                                const status = getBillStatus(bill);
                                return (
                                    <TableRow key={bill.id}>
                                        <TableCell className="font-medium">
                                            <div className="space-y-1">
                                                {bill.items && bill.items.length > 0 ? (
                                                    bill.items.map((item) => (
                                                        <div key={item.id} className="text-sm">
                                                            {item.name} - {formatCurrency(item.amount)}
                                                            {item.description && (
                                                                <span className="text-muted-foreground ml-2">
                                                                    ({item.description})
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-sm text-muted-foreground">
                                                        No items added
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatCurrency(calculateTotalAmount(bill))}</TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="font-medium">{bill.account.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {bill.account.bankName}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-2">
                                                {bill.assignments.map((assignment) => (
                                                    <div key={assignment.id} className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                className={cn(
                                                                    getStatusColor(assignment.status),
                                                                    "text-white"
                                                                )}
                                                            >
                                                                {assignment.status}
                                                            </Badge>
                                                            <span className="text-sm">
                                                                {getTargetName(assignment)}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Due: {format(new Date(assignment.dueDate), "PPP")}
                                                        </div>
                                                        <div className="text-sm">
                                                            Paid: {formatCurrency(getTotalPaid(assignment))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(bill.createdAt), "PPP")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${statusColors[status]} text-white`}>
                                                {status.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    router.push(`/dashboard/fees/${bill.id}`);
                                                                }}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>View Details</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setSelectedBill(bill);
                                                                }}
                                                            >
                                                                <Users className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Manage Assignments</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {bills.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                        No bills found. Create your first bill to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AssignBillDialog
                isOpen={!!selectedBill}
                onClose={() => setSelectedBill(null)}
                bill={selectedBill}
                classes={classes}
                students={students}
            />
        </div>
    );
} 