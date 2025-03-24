"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Check, X, Plus, CreditCard, Download, Eye } from "lucide-react";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

// Form schema
const billFormSchema = z.object({
    name: z.string().min(2, { message: "Bill name must be at least 2 characters" }),
    amount: z.coerce.number().positive({ message: "Amount must be positive" }),
    description: z.string().optional(),
    accountId: z.string().min(1, { message: "Please select an account" }),
    targetType: z.enum(["CLASS", "STUDENT"]),
    targetIds: z.array(z.string()).min(1, { message: "Please select at least one target" }),
    dueDate: z.date({ required_error: "Please select a due date" }),
});

type BillFormValues = z.infer<typeof billFormSchema>;

interface BillsTabProps {
    bills: any[];
    classes: any[];
    students: any[];
    paymentAccounts: any[];
}

export function BillsTab({
    bills,
    classes,
    students,
    paymentAccounts,
}: BillsTabProps) {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [selectedBill, setSelectedBill] = useState<any | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const form = useForm<BillFormValues>({
        resolver: zodResolver(billFormSchema),
        defaultValues: {
            name: "",
            amount: 0,
            description: "",
            targetIds: [],
            targetType: "CLASS",
        },
    });

    const targetType = form.watch("targetType");

    const handleViewBill = (bill: any) => {
        setSelectedBill(bill);
        setShowDetails(true);
    };

    const getStatusColor = (status: string) => {
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

    const onSubmit = async (data: BillFormValues) => {
        try {
            // Format the assignments
            const assignments = data.targetIds.map((id) => ({
                targetType: data.targetType,
                targetId: id,
                dueDate: data.dueDate,
            }));

            // Create the bill
            const response = await fetch("/api/bills", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: data.name,
                    amount: data.amount,
                    description: data.description,
                    accountId: data.accountId,
                    assignments,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create bill");
            }

            toast.success("Bill created successfully");
            router.refresh();
            setIsCreating(false);
            form.reset();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Manage Bills</h2>
                <Button onClick={() => setIsCreating(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Bill
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Bills</CardTitle>
                    <CardDescription>
                        View and manage all bills for your school
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableCaption>A list of all bills</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead>Assignments</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bills.map((bill) => (
                                <TableRow key={bill.id}>
                                    <TableCell className="font-medium">{bill.name}</TableCell>
                                    <TableCell>{formatCurrency(bill.amount)}</TableCell>
                                    <TableCell>{bill.account.name}</TableCell>
                                    <TableCell>{bill.assignments.length}</TableCell>
                                    <TableCell>
                                        {format(new Date(bill.createdAt), "PP")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleViewBill(bill)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>View Details</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {bills.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                        No bills found. Create your first bill!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create Bill Dialog */}
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Create New Bill</DialogTitle>
                        <DialogDescription>
                            Create a new bill and assign it to classes or students
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bill Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Tuition Fee" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Add details about this bill"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="accountId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Account</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a payment account" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {paymentAccounts.map((account) => (
                                                    <SelectItem key={account.id} value={account.id}>
                                                        {account.name} - {account.bankName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Due Date</FormLabel>
                                        <DatePicker
                                            date={field.value}
                                            setDate={field.onChange}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="targetType"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Assign To</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex space-x-4"
                                            >
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="CLASS" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Classes</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="STUDENT" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Students</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="targetIds"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>
                                            {targetType === "CLASS" ? "Classes" : "Students"}
                                        </FormLabel>
                                        <div className="h-48 overflow-auto border rounded-md p-2">
                                            {targetType === "CLASS" ? (
                                                classes.length > 0 ? (
                                                    classes.map((cls) => (
                                                        <FormField
                                                            key={cls.id}
                                                            control={form.control}
                                                            name="targetIds"
                                                            render={({ field }) => (
                                                                <FormItem
                                                                    key={cls.id}
                                                                    className="flex flex-row items-start space-x-3 space-y-0 py-1"
                                                                >
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={field.value?.includes(cls.id)}
                                                                            onCheckedChange={(checked) => {
                                                                                const values = [...(field.value || [])];
                                                                                if (checked) {
                                                                                    values.push(cls.id);
                                                                                } else {
                                                                                    const index = values.indexOf(cls.id);
                                                                                    if (index !== -1) {
                                                                                        values.splice(index, 1);
                                                                                    }
                                                                                }
                                                                                field.onChange(values);
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal">
                                                                        {cls.name} {cls.section ? `(${cls.section})` : ""}
                                                                    </FormLabel>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ))
                                                ) : (
                                                    <div className="text-sm text-muted-foreground p-2">
                                                        No classes available
                                                    </div>
                                                )
                                            ) : students.length > 0 ? (
                                                students.map((student) => (
                                                    <FormField
                                                        key={student.id}
                                                        control={form.control}
                                                        name="targetIds"
                                                        render={({ field }) => (
                                                            <FormItem
                                                                key={student.id}
                                                                className="flex flex-row items-start space-x-3 space-y-0 py-1"
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(student.id)}
                                                                        onCheckedChange={(checked) => {
                                                                            const values = [...(field.value || [])];
                                                                            if (checked) {
                                                                                values.push(student.id);
                                                                            } else {
                                                                                const index = values.indexOf(student.id);
                                                                                if (index !== -1) {
                                                                                    values.splice(index, 1);
                                                                                }
                                                                            }
                                                                            field.onChange(values);
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal">
                                                                    {student.user.name}
                                                                </FormLabel>
                                                            </FormItem>
                                                        )}
                                                    />
                                                ))
                                            ) : (
                                                <div className="text-sm text-muted-foreground p-2">
                                                    No students available
                                                </div>
                                            )}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Create Bill</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Bill Details Dialog */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                {selectedBill && (
                    <DialogContent className="sm:max-w-[700px]">
                        <DialogHeader>
                            <DialogTitle>{selectedBill.name}</DialogTitle>
                            <DialogDescription>
                                {selectedBill.description || "No description provided"}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-semibold mb-1">Amount</h4>
                                    <p>{formatCurrency(selectedBill.amount)}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold mb-1">Payment Account</h4>
                                    <p>
                                        {selectedBill.account.name} ({selectedBill.account.bankName})
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold mb-1">Account Number</h4>
                                    <p>{selectedBill.account.accountNo}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold mb-1">Created</h4>
                                    <p>
                                        {format(new Date(selectedBill.createdAt), "PP")}
                                    </p>
                                </div>
                            </div>

                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="assignments">
                                    <AccordionTrigger>
                                        Bill Assignments ({selectedBill.assignments.length})
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Target</TableHead>
                                                    <TableHead>Due Date</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Paid</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedBill.assignments.map((assignment: any) => {
                                                    const targetName = assignment.targetType === "CLASS"
                                                        ? classes.find(c => c.id === assignment.targetId)?.name || "Unknown"
                                                        : students.find(s => s.id === assignment.targetId)?.user.name || "Unknown";

                                                    const totalPaid = assignment.studentPayments.reduce(
                                                        (sum: number, payment: any) => sum + payment.amountPaid,
                                                        0
                                                    );

                                                    return (
                                                        <TableRow key={assignment.id}>
                                                            <TableCell>{assignment.targetType}</TableCell>
                                                            <TableCell>{targetName}</TableCell>
                                                            <TableCell>
                                                                {format(new Date(assignment.dueDate), "PP")}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge className={getStatusColor(assignment.status)}>
                                                                    {assignment.status.replace("_", " ")}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {formatCurrency(totalPaid)} / {formatCurrency(selectedBill.amount)}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
} 