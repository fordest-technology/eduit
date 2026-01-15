"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Plus, Trash2, Loader2, Info, CreditCard, Sparkles, ReceiptText } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

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
    accountId: z.string().optional(),
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
        accountId?: string;
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
            accountId: "automated",
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
                accountId: data.accountId === "automated" ? undefined : data.accountId,
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
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 pb-10">
                <div className="space-y-6">
                    {/* Basic Info */}
                    <Card className="border-none shadow-none bg-slate-50/50 p-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                        <ReceiptText className="h-4 w-4 text-primary" />
                                        General Information
                                    </FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="e.g., First Term Tuition 2024" 
                                            {...field} 
                                            className="h-11 bg-white border-slate-200 focus:ring-primary/20"
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        This name will be visible to parents on their dashboard.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </Card>

                    {/* Bill Items Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Plus className="h-4 w-4 text-primary" />
                                Bill Line Items
                            </h3>
                            <Badge variant="outline" className="font-mono text-[10px] bg-white">
                                {form.watch("items").length} {form.watch("items").length === 1 ? 'Item' : 'Items'}
                            </Badge>
                        </div>
                        
                        <div className="space-y-3">
                            {form.watch("items").map((_, index) => (
                                <Card key={index} className="relative overflow-hidden border-slate-200 shadow-sm transition-all hover:shadow-md">
                                    <CardContent className="p-4 pt-5 space-y-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.name`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Item Name</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} placeholder="Tuition Fee" className="h-9" />
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
                                                            <FormLabel className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Amount (₦)</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} type="number" placeholder="0.00" className="h-9 font-mono" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            {index > 0 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.description`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Small Note (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Additional details..." className="h-9" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddItem}
                            className="w-full h-11 border-dashed border-2 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                            disabled={isSubmitting}
                        >
                            <Plus className="h-4 w-4" />
                            Add Another Item
                        </Button>
                    </div>

                    <Separator className="my-6" />

                    {/* Payment Engine */}
                    <div className="space-y-6">
                        <div className="px-1">
                            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-primary" />
                                Payment Configuration
                            </h3>
                        </div>

                        {form.watch("accountId") === "automated" ? (
                            <Alert className="bg-amber-50 border-amber-200 text-amber-900">
                                <Sparkles className="h-4 w-4 text-amber-600" />
                                <AlertTitle className="text-sm font-bold flex items-center gap-2">
                                    Automated Squad Flow Active
                                </AlertTitle>
                                <AlertDescription className="text-xs opacity-90 leading-relaxed mt-1">
                                    You haven't selected a manual bank account. Payments will be processed automatically via Squad and deposited directly into your school's virtual wallet.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert className="bg-blue-50 border-blue-200 text-blue-900">
                                <Info className="h-4 w-4 text-blue-600" />
                                <AlertTitle className="text-sm font-bold">Manual Bank Transfer Active</AlertTitle>
                                <AlertDescription className="text-xs opacity-90 leading-relaxed mt-1">
                                    Payments will be directed to your selected bank account. Note that this requires manual reconciliation of receipts.
                                </AlertDescription>
                            </Alert>
                        )}

                        <FormField
                            control={form.control}
                            name="accountId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold text-slate-600 uppercase">Settlement Account (Optional)</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isSubmitting}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-11 bg-white border-slate-200 focus:ring-primary/20">
                                                <SelectValue placeholder="Select manual account (Optional)" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="automated">Use Automated Wallet (Recommended)</SelectItem>
                                            {paymentAccounts.map((account) => (
                                                <SelectItem key={account.id} value={account.id}>
                                                    {account.name} ({account.bankName})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="sticky bottom-0 left-0 right-0 pt-6 bg-white border-t mt-10">
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Total Bill Amount</p>
                            <p className="text-xl font-black text-slate-900 font-mono">
                                ₦{form.watch("items").reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0).toLocaleString()}
                            </p>
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="h-12 px-8 font-bold shadow-lg shadow-primary/20">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Generate Bill"
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    );
}
