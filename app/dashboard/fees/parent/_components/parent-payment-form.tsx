"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CreditCard, Upload, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/app/dashboard/fees/_components/date-picker";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

// Form schema
const paymentFormSchema = z.object({
    studentId: z.string().min(1, { message: "Please select a student" }),
    billId: z.string().min(1, { message: "Please select a bill" }),
    billAssignmentId: z.string().min(1, { message: "Invalid bill assignment" }),
    amount: z.coerce.number().positive({ message: "Amount must be positive" }),
    receiptUrl: z.string().optional(),
    notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface ParentPaymentFormProps {
    children: any[];
    bills: any[];
    paymentAccounts: any[];
}

export function ParentPaymentForm({
    children,
    bills,
    paymentAccounts,
}: ParentPaymentFormProps) {
    const router = useRouter();
    const [selectedBill, setSelectedBill] = useState<any | null>(null);
    const [selectedChild, setSelectedChild] = useState<any | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    // The cloudinary cloud name should be properly exposed to the client-side
    // either through Next.js public environment variables or fetched from an API
    const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentFormSchema),
        defaultValues: {
            studentId: "",
            billId: "",
            billAssignmentId: "",
            amount: 0,
            receiptUrl: "",
            notes: "",
        },
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    // Handle uploading of receipt
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Upload failed");
            }

            const data = await response.json();
            if (data.url) {
                form.setValue("receiptUrl", data.url);
                toast.success("Receipt uploaded successfully");
            } else {
                throw new Error("No URL returned from upload service");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to upload receipt");
        } finally {
            setIsUploading(false);
        }
    };

    // Handle student selection
    const onStudentChange = (studentId: string) => {
        setSelectedChild(children.find((child) => child.id === studentId));
        form.setValue("billId", "");
        form.setValue("billAssignmentId", "");
        form.setValue("amount", 0);
        setSelectedBill(null);
    };

    // Handle bill selection
    const onBillChange = (billId: string) => {
        const bill = bills.find((b) => b.id === billId);
        setSelectedBill(bill);

        // Find the bill assignment for this student
        if (bill && form.getValues("studentId")) {
            const studentId = form.getValues("studentId");

            // First check if there's a direct student assignment
            let assignment = bill.assignments.find(
                (a: any) => a.targetType === "STUDENT" && a.targetId === studentId
            );

            // If no direct assignment, check for class assignments
            if (!assignment) {
                const student = children.find((child) => child.id === studentId);
                const classIds = student?.classes.map((c: any) => c.classId) || [];

                assignment = bill.assignments.find(
                    (a: any) => a.targetType === "CLASS" && classIds.includes(a.targetId)
                );
            }

            if (assignment) {
                form.setValue("billAssignmentId", assignment.id);

                // Calculate remaining amount
                const totalPaid = assignment.studentPayments.reduce(
                    (sum: number, payment: any) => sum + payment.amountPaid,
                    0
                );
                const remainingAmount = Math.max(0, bill.amount - totalPaid);
                form.setValue("amount", remainingAmount);
            }
        }
    };

    // Get available bills for the selected student
    const getAvailableBills = () => {
        if (!selectedChild) return [];

        const studentId = selectedChild.id;
        const classIds = selectedChild.classes.map((c: any) => c.classId);

        return bills.filter((bill: any) => {
            return bill.assignments.some(
                (assignment: any) =>
                    (assignment.targetType === "STUDENT" && assignment.targetId === studentId) ||
                    (assignment.targetType === "CLASS" && classIds.includes(assignment.targetId))
            );
        });
    };

    // Submit the payment request
    const onSubmit = async (data: PaymentFormValues) => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/payment-requests", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to submit payment request");
            }

            toast.success("Payment request submitted successfully");
            setIsComplete(true);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset the form and state for a new payment
    const makeAnotherPayment = () => {
        form.reset();
        setSelectedBill(null);
        setSelectedChild(null);
        setIsComplete(false);
    };

    if (isComplete) {
        return (
            <Card className="w-full max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-center">Payment Submitted</CardTitle>
                    <CardDescription className="text-center">
                        Your payment request has been submitted and is awaiting approval
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex flex-col items-center">
                    <div className="rounded-full bg-green-100 p-3">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold">Thank You!</h3>
                        <p className="text-muted-foreground">
                            Your payment request has been submitted successfully. The school
                            administration will review your payment and update your balance
                            accordingly.
                        </p>
                    </div>
                    <div className="bg-muted p-4 rounded-md w-full max-w-md">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm font-medium">Student:</span>
                                <span className="text-sm">{selectedChild?.user.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium">Bill:</span>
                                <span className="text-sm">{selectedBill?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium">Amount:</span>
                                <span className="text-sm">
                                    {formatCurrency(form.getValues("amount"))}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium">Date:</span>
                                <span className="text-sm">{format(new Date(), "PP")}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button onClick={makeAnotherPayment} className="w-full">
                        Make Another Payment
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push("/dashboard")}
                        className="w-full"
                    >
                        Return to Dashboard
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    const availableBills = getAvailableBills();

    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Submit a Payment</CardTitle>
                <CardDescription>
                    Make a payment for your child's school fees
                </CardDescription>
            </CardHeader>
            <CardContent>
                {children.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-muted-foreground">
                            No students found. Please contact the school administration.
                        </p>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="studentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Student</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                onStudentChange(value);
                                            }}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a student" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {children.map((child) => (
                                                    <SelectItem key={child.id} value={child.id}>
                                                        {child.user.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Select the student you want to make a payment for
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {selectedChild && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="billId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Bill</FormLabel>
                                                <Select
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        onBillChange(value);
                                                    }}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a bill" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {availableBills.length > 0 ? (
                                                            availableBills.map((bill) => (
                                                                <SelectItem key={bill.id} value={bill.id}>
                                                                    {bill.name} - {formatCurrency(bill.amount)}
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <div className="px-2 py-1 text-sm text-muted-foreground">
                                                                No bills available
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {selectedBill && (
                                        <>
                                            <div className="bg-muted p-4 rounded-md">
                                                <h3 className="font-medium text-sm mb-2">
                                                    Payment Details
                                                </h3>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm">Bill Amount:</span>
                                                        <span className="text-sm font-medium">
                                                            {formatCurrency(selectedBill.amount)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm">Account:</span>
                                                        <span className="text-sm">
                                                            {selectedBill.account.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm">Bank:</span>
                                                        <span className="text-sm">
                                                            {selectedBill.account.bankName}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm">Account Number:</span>
                                                        <span className="text-sm font-medium">
                                                            {selectedBill.account.accountNo}
                                                        </span>
                                                    </div>
                                                    <Separator className="my-2" />
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium">
                                                            Remaining Balance:
                                                        </span>
                                                        <span className="text-sm font-medium">
                                                            {formatCurrency(form.getValues("amount"))}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="amount"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Payment Amount</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max={selectedBill.amount}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Enter the amount you are paying
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="receiptUrl"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Payment Receipt</FormLabel>
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                id="receipt"
                                                                type="file"
                                                                accept="image/*,.pdf"
                                                                className="hidden"
                                                                onChange={handleUpload}
                                                                disabled={isUploading}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    document.getElementById("receipt")?.click()
                                                                }
                                                                disabled={isUploading}
                                                                className="w-full"
                                                            >
                                                                <Upload className="h-4 w-4 mr-2" />
                                                                {isUploading
                                                                    ? "Uploading..."
                                                                    : field.value
                                                                        ? "Change Receipt"
                                                                        : "Upload Receipt"}
                                                            </Button>
                                                            {field.value && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        window.open(field.value, "_blank");
                                                                    }}
                                                                >
                                                                    <ArrowRight className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <FormDescription>
                                                            Upload a screenshot or photo of your payment
                                                            receipt
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="notes"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Additional Notes</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Any additional information about this payment"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <Button
                                                type="submit"
                                                className="w-full"
                                                disabled={isSubmitting || isUploading}
                                            >
                                                {isSubmitting ? "Submitting..." : "Submit Payment Request"}
                                            </Button>
                                        </>
                                    )}
                                </>
                            )}
                        </form>
                    </Form>
                )}
            </CardContent>
        </Card>
    );
}