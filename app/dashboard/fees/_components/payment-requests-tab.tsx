"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle, XCircle, Eye, ExternalLink } from "lucide-react";
import { toast } from "sonner";

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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface PaymentRequestsTabProps {
    payments: any[];
}

export function PaymentRequestsTab({ payments }: PaymentRequestsTabProps) {
    const router = useRouter();
    const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [notes, setNotes] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const handleViewPayment = (payment: any) => {
        setSelectedPayment(payment);
        setShowDetails(true);
        setNotes(payment.notes || "");
    };

    const processPayment = async (status: "APPROVED" | "REJECTED") => {
        if (!selectedPayment) return;

        setIsProcessing(true);
        try {
            const response = await fetch(`/api/payment-requests/${selectedPayment.id}/process`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status,
                    notes,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to ${status.toLowerCase()} payment`);
            }

            toast.success(`Payment ${status.toLowerCase()} successfully`);
            router.refresh();
            setShowDetails(false);
            setSelectedPayment(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Payment Requests</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Requests</CardTitle>
                    <CardDescription>Review and process payment requests from parents</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableCaption>A list of pending payment requests</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Bill</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Receipt</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-medium">
                                        {payment.student?.user?.name || 'Unknown Student'}
                                    </TableCell>
                                    <TableCell>{payment.bill?.name || 'Unknown Bill'}</TableCell>
                                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                    <TableCell>
                                        {payment.receiptUrl ? (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <a
                                                            href={payment.receiptUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center text-blue-600 hover:underline"
                                                        >
                                                            <ExternalLink className="h-4 w-4 mr-1" />
                                                            View
                                                        </a>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Open receipt in new tab</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ) : (
                                            "No receipt"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(payment.createdAt), "PP")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleViewPayment(payment)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {payments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                        No pending payment requests found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Payment Details Dialog */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                {selectedPayment && (
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Payment Request Details</DialogTitle>
                            <DialogDescription>
                                Review payment details and approve or reject
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-semibold mb-1">Student</h4>
                                    <p>{selectedPayment.student?.user?.name || 'Unknown Student'}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold mb-1">Bill</h4>
                                    <p>{selectedPayment.bill?.name || 'Unknown Bill'}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold mb-1">Amount</h4>
                                    <p className="font-medium">{formatCurrency(selectedPayment.amount)}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold mb-1">Date Submitted</h4>
                                    <p>{format(new Date(selectedPayment.createdAt), "PPp")}</p>
                                </div>
                            </div>

                            {selectedPayment.notes && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-1">Student/Parent Notes</h4>
                                    <p className="p-3 bg-muted rounded-md text-sm">
                                        {selectedPayment.notes}
                                    </p>
                                </div>
                            )}

                            {selectedPayment.receiptUrl && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-1">Payment Receipt</h4>
                                    <div className="flex items-center">
                                        <a
                                            href={selectedPayment.receiptUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-blue-600 hover:underline"
                                        >
                                            <ExternalLink className="h-4 w-4 mr-1" />
                                            View Receipt
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-semibold mb-1">Admin Notes</h4>
                                <Textarea
                                    placeholder="Add notes about this payment request..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <DialogFooter className="flex justify-between space-x-4">
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() => setShowDetails(false)}
                                    >
                                        Close
                                    </Button>
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="destructive"
                                        onClick={() => processPayment("REJECTED")}
                                        disabled={isProcessing}
                                        className="flex items-center"
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={() => processPayment("APPROVED")}
                                        disabled={isProcessing}
                                        className="flex items-center"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve
                                    </Button>
                                </div>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
} 