"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Zod schema for bill items with proper validation
const billItemSchema = z.object({
    name: z.string().trim().min(2, {
        message: "Item name must be at least 2 characters.",
    }),
    amount: z.string().refine(
        (val) => {
            const num = parseFloat(val);
            return !isNaN(num) && num > 0;
        },
        {
            message: "Amount must be a positive number.",
        }
    ),
    description: z.string().default(""),
});

// Main form schema with proper validation
const formSchema = z.object({
    name: z.string().trim().min(2, {
        message: "Bill name must be at least 2 characters.",
    }),
    items: z.array(billItemSchema).min(1, {
        message: "At least one bill item is required.",
    }),
    accountId: z.string().trim().min(1, {
        message: "Payment account is required.",
    }),
});

// Type for the form data
type BillFormData = z.infer<typeof formSchema>;

interface PaymentAccount {
    id: string;
    name: string;
    bankName: string;
}

interface BillFormProps {
    paymentAccounts: PaymentAccount[];
    onSubmit: (data: {
        name: string;
        accountId: string;
        items: Array<{
            name: string;
            amount: number;
            description: string;
        }>;
    }) => Promise<void>;
}

export function BillForm({ paymentAccounts, onSubmit }: BillFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<BillFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            items: [{ name: "", amount: "", description: "" }],
            accountId: "",
        },
    });

    const handleAddItem = () => {
        const items = form.getValues("items");
        form.setValue("items", [...items, { name: "", amount: "", description: "" }]);
    };

    const handleRemoveItem = (index: number) => {
        const items = form.getValues("items");
        if (items.length > 1) {
            form.setValue(
                "items",
                items.filter((_, i) => i !== index)
            );
        }
    };

    const handleSubmit = async (data: BillFormData) => {
        try {
            setIsSubmitting(true);

            // Transform the data to match API expectations
            await onSubmit({
                name: data.name.trim(),
                accountId: data.accountId,
                items: data.items.map((item) => ({
                    name: item.name.trim(),
                    amount: parseFloat(item.amount),
                    description: item.description.trim(),
                })),
            });

            // Reset form on success
            form.reset();
            toast.success("Bill created successfully");
        } catch (error) {
            console.error("Failed to create bill:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create bill");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid gap-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base font-semibold">Bill Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter bill name" {...field} className="h-10" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Card className="border-dashed">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Bill Items</CardTitle>
                            <CardDescription>Add the items that make up this bill.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {form.getValues("items").map((_, index) => (
                                <div key={index} className="grid gap-4 p-4 border rounded-lg bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Item {index + 1}</span>
                                        {index > 0 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveItem(index)}
                                                className="h-8 px-2 text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm">Item Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Enter item name" className="h-9" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.amount`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm">Amount</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="0.00" className="h-9" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.description`}
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel className="text-sm">Description (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Enter item description" className="h-9" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddItem}
                                className="w-full h-9 mt-2"
                                disabled={isSubmitting}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Another Item
                            </Button>
                        </CardContent>
                    </Card>

                    <FormField
                        control={form.control}
                        name="accountId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base font-semibold">Payment Account</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isSubmitting}
                                >
                                    <FormControl>
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder="Select payment account" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {paymentAccounts.map((account) => (
                                            <SelectItem key={account.id} value={account.id}>
                                                {account.name} ({account.bankName})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription className="text-sm">
                                    Select the payment account for this bill
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex items-center justify-end gap-4 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.reset()}
                        disabled={isSubmitting}
                        className="h-9"
                    >
                        Reset
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="h-9">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Bill"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}