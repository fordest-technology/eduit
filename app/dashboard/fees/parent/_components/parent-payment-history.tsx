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
    ExternalLink as LinkIcon
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
        const statusMap: Record<string, { label: string; variant: string; icon: React.ReactNode }> = {
            PENDING: {
                label: "Pending",
                variant: "outline",
                icon: <Clock className="h-3 w-3 mr-1" />
            },
            APPROVED: {
                label: "Approved",
                variant: "success",
                icon: <Check className="h-3 w-3 mr-1" />
            },
            REJECTED: {
                label: "Rejected",
                variant: "destructive",
                icon: <X className="h-3 w-3 mr-1" />
            },
        };

        const { label, variant, icon } = statusMap[status] || {
            label: status,
            variant: "secondary",
            icon: <AlertCircle className="h-3 w-3 mr-1" />
        };

        return (
            <Badge variant={variant as any} className="flex items-center">
                {icon}
                {label}
            </Badge>
        );
    };

    // Filter and search data
    const filteredPaymentRequests = paymentRequests.filter((request) => {
        // Apply student filter
        if (studentFilter !== "all" && request.student.id !== studentFilter) {
            return false;
        }

        // Apply status filter
        if (statusFilter !== "all" && request.status !== statusFilter) {
            return false;
        }

        // Apply search filter (search in bill name, description, and student name)
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
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>View your payment requests and their status</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="flex-1 relative w-full sm:max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search payments..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1.5 h-7 w-7"
                                    onClick={() => setSearchTerm("")}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Select
                                value={studentFilter}
                                onValueChange={setStudentFilter}
                            >
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Filter by student" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Students</SelectItem>
                                    {children.map((child) => (
                                        <SelectItem key={child.id} value={child.id}>
                                            {child.user.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="APPROVED">Approved</SelectItem>
                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {filteredPaymentRequests.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">No payment requests found</p>
                        </div>
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Bill</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPaymentRequests.map((request) => (
                                        <Collapsible
                                            key={request.id}
                                            open={expandedId === request.id}
                                            onOpenChange={() =>
                                                setExpandedId(expandedId === request.id ? null : request.id)
                                            }
                                            className="w-full"
                                        >
                                            <TableRow className="group hover:bg-muted/50">
                                                <TableCell>
                                                    {request.student.user.name}
                                                </TableCell>
                                                <TableCell>
                                                    {request.billAssignment.bill.name}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(request.amount)}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(request.createdAt)}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(request.status)}
                                                </TableCell>
                                                <TableCell>
                                                    <CollapsibleTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                        >
                                                            <ChevronDown
                                                                className={`h-4 w-4 transition-transform duration-200 ${expandedId === request.id ? "rotate-180" : ""
                                                                    }`}
                                                            />
                                                        </Button>
                                                    </CollapsibleTrigger>
                                                </TableCell>
                                            </TableRow>
                                            <CollapsibleContent>
                                                <TableRow className="hover:bg-transparent border-0">
                                                    <TableCell colSpan={6} className="p-0">
                                                        <div className="bg-muted/50 p-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-3">
                                                                    <h4 className="text-sm font-medium">
                                                                        Payment Details
                                                                    </h4>
                                                                    <div className="grid grid-cols-2 gap-1 text-sm">
                                                                        <div className="text-muted-foreground">Bill</div>
                                                                        <div>{request.billAssignment.bill.name}</div>
                                                                        <div className="text-muted-foreground">Amount</div>
                                                                        <div>{formatCurrency(request.amount)}</div>
                                                                        <div className="text-muted-foreground">Due Date</div>
                                                                        <div>{formatDate(request.billAssignment.bill.dueDate)}</div>
                                                                        <div className="text-muted-foreground">Description</div>
                                                                        <div>{request.billAssignment.bill.description || "N/A"}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    <h4 className="text-sm font-medium">Status Information</h4>
                                                                    <div className="grid grid-cols-2 gap-1 text-sm">
                                                                        <div className="text-muted-foreground">Status</div>
                                                                        <div>{getStatusBadge(request.status)}</div>
                                                                        <div className="text-muted-foreground">Submitted</div>
                                                                        <div>{formatDate(request.createdAt)}</div>
                                                                        <div className="text-muted-foreground">Reviewed</div>
                                                                        <div>{formatDate(request.reviewedAt)}</div>
                                                                        <div className="text-muted-foreground">Reviewed By</div>
                                                                        <div>{request.reviewedBy?.name || "N/A"}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {(request.notes || request.reviewNotes) && (
                                                                <>
                                                                    <Separator className="my-4" />
                                                                    <div className="space-y-3">
                                                                        {request.notes && (
                                                                            <div>
                                                                                <h4 className="text-sm font-medium mb-1">Your Notes</h4>
                                                                                <p className="text-sm">{request.notes}</p>
                                                                            </div>
                                                                        )}
                                                                        {request.reviewNotes && (
                                                                            <div>
                                                                                <h4 className="text-sm font-medium mb-1">Admin Response</h4>
                                                                                <p className="text-sm">{request.reviewNotes}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            )}
                                                            <div className="flex justify-end gap-2 mt-4">
                                                                    {request.receiptUrl?.startsWith("/") ? (
                                                                        <Link href={request.receiptUrl} target="_blank">
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="rounded-xl border-slate-200 hover:bg-slate-50"
                                                                            >
                                                                                <FileText className="h-4 w-4 mr-2 text-green-600" />
                                                                                Official Receipt
                                                                            </Button>
                                                                        </Link>
                                                                    ) : request.receiptUrl ? (
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="rounded-xl border-slate-200 hover:bg-slate-50"
                                                                            onClick={() => window.open(request.receiptUrl!, "_blank")}
                                                                        >
                                                                            <ExternalLink className="h-4 w-4 mr-2" />
                                                                            View Uploaded Receipt
                                                                        </Button>
                                                                    ) : null}
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="outline" size="sm">
                                                                            Actions
                                                                            <ChevronDown className="h-4 w-4 ml-2" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem
                                                                            onClick={() => window.print()}
                                                                        >
                                                                            Print Details
                                                                        </DropdownMenuItem>
                                                                        {request.status === "REJECTED" && (
                                                                            <DropdownMenuItem
                                                                                onClick={() => window.location.href = `/dashboard/fees/parent?resubmit=${request.id}`}
                                                                            >
                                                                                Resubmit Payment
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 