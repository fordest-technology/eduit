"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Plus, Building, Check, X, CreditCard } from "lucide-react";
import { toast } from "sonner";

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
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

// Form schema
const accountFormSchema = z.object({
    name: z.string().min(2, { message: "Account name must be at least 2 characters" }),
    accountNo: z.string().min(5, { message: "Please enter a valid account number" }),
    bankName: z.string().min(2, { message: "Bank name must be at least 2 characters" }),
    branchCode: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface PaymentAccountsTabProps {
    accounts: any[];
}

export function PaymentAccountsTab({ accounts }: PaymentAccountsTabProps) {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);

    const form = useForm<AccountFormValues>({
        resolver: zodResolver(accountFormSchema),
        defaultValues: {
            name: "",
            accountNo: "",
            bankName: "",
            branchCode: "",
            description: "",
            isActive: true,
        },
    });

    const onSubmit = async (data: AccountFormValues) => {
        try {
            const response = await fetch("/api/payment-accounts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create payment account");
            }

            toast.success("Payment account created successfully");
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
                <h2 className="text-2xl font-bold">Payment Accounts</h2>
                <Button onClick={() => setIsCreating(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Account
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Bank Accounts</CardTitle>
                    <CardDescription>
                        Manage bank accounts for receiving payments
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableCaption>A list of payment accounts</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Account Name</TableHead>
                                <TableHead>Bank Name</TableHead>
                                <TableHead>Account Number</TableHead>
                                <TableHead>Branch Code</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accounts.map((account) => (
                                <TableRow key={account.id}>
                                    <TableCell className="font-medium">{account.name}</TableCell>
                                    <TableCell>{account.bankName}</TableCell>
                                    <TableCell>{account.accountNo}</TableCell>
                                    <TableCell>{account.branchCode || "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant={account.isActive ? "default" : "secondary"}>
                                            {account.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {accounts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        No payment accounts found. Add your first account!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create Account Sheet */}
            <Sheet open={isCreating} onOpenChange={setIsCreating}>
                <SheetContent className="sm:max-w-[500px] w-full overflow-y-auto" side="right">
                    <SheetHeader>
                        <SheetTitle>Add Payment Account</SheetTitle>
                        <SheetDescription>
                            Add a new bank account for receiving payments
                        </SheetDescription>
                    </SheetHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Account Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. School Tuition Account" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            A descriptive name for the account
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="bankName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bank Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. National Bank" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="branchCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Branch Code (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 001234" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="accountNo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Account Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 1234567890" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Additional details about this account"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                        <div className="space-y-0.5">
                                            <FormLabel>Active</FormLabel>
                                            <FormDescription>
                                                Make this account available for payments
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <SheetFooter className="mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Add Account</Button>
                            </SheetFooter>
                        </form>
                    </Form>
                </SheetContent>
            </Sheet>
        </div>
    );
} 