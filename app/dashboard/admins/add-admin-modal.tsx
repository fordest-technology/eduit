"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Shield, Lock } from "lucide-react";
import { PERMISSION_GROUPS } from "@/lib/permissions";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    permissions: z.record(z.boolean()),
});

interface AddAdminModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    admin?: any;
    onSuccess?: () => void;
}

export function AddAdminModal({
    open,
    onOpenChange,
    admin,
    onSuccess,
}: AddAdminModalProps) {
    const [loading, setLoading] = useState(false);

    const defaultPermissions: Record<string, boolean> = {};
    PERMISSION_GROUPS.forEach(group => {
        group.permissions.forEach(p => {
            defaultPermissions[p.key] = false;
        });
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            permissions: defaultPermissions,
        },
    });

    useEffect(() => {
        if (admin) {
            // Parse permissions if it's a string
            let savedPerms = admin.admin?.permissions || {};
            if (typeof savedPerms === 'string') {
                try { savedPerms = JSON.parse(savedPerms); } catch (e) { }
            }

            const mergedPerms = { ...defaultPermissions };
            if (Array.isArray(savedPerms)) {
                savedPerms.forEach((p: string) => mergedPerms[p] = true);
            } else {
                Object.keys(savedPerms).forEach(k => mergedPerms[k] = !!savedPerms[k]);
            }

            form.reset({
                name: admin.name,
                email: admin.email,
                password: "",
                permissions: mergedPerms,
            });
        } else {
            form.reset({
                name: "",
                email: "",
                password: "",
                permissions: defaultPermissions,
            });
        }
    }, [admin, open, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setLoading(true);
            const url = admin ? `/api/users/${admin.id}` : "/api/users";
            const method = admin ? "PUT" : "POST";

            const payload = {
                name: values.name,
                email: values.email,
                role: "SCHOOL_ADMIN",
                ...(values.password ? { password: values.password } : {}),
                adminData: {
                    adminType: "SCHOOL_ADMIN",
                    permissions: values.permissions,
                },
            };

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(admin ? "Failed to update admin" : "Failed to create admin");
            }

            toast.success(admin ? "Admin updated successfully" : "Admin created successfully");
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const selectAll = (value: boolean) => {
        const newPerms = { ...form.getValues().permissions };
        Object.keys(newPerms).forEach(k => newPerms[k] = value);
        form.setValue("permissions", newPerms);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[700px] w-full p-0" side="right">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                        <SheetHeader className="p-6 pb-2 border-b flex-none">
                            <SheetTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                {admin ? "Edit Administrator" : "Add New Administrator"}
                            </SheetTitle>
                            <SheetDescription>
                                Account details and granular access control.
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto">
                            <div className="space-y-6 p-6 pb-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="John Doe" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Address</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="john@example.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{admin ? "New Password (leave blank to keep current)" : "Password"}</FormLabel>
                                            <FormControl>
                                                <PasswordInput {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Separator />

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-medium flex items-center gap-2">
                                                <Lock className="h-4 w-4 text-primary" />
                                                Permissions & Access Control
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Select which modules this administrator can access.
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" size="sm" onClick={() => selectAll(true)}>
                                                Select All
                                            </Button>
                                            <Button type="button" variant="outline" size="sm" onClick={() => selectAll(false)}>
                                                Deselect All
                                            </Button>
                                        </div>
                                    </div>

                                    {PERMISSION_GROUPS.map((group) => (
                                        <div key={group.name} className="space-y-3 pt-2">
                                            <h4 className="font-semibold text-sm text-primary uppercase tracking-wider">{group.name}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 border rounded-lg p-4 bg-gray-50/50">
                                                {group.permissions.map((permission) => (
                                                    <FormField
                                                        key={permission.key}
                                                        control={form.control}
                                                        name={`permissions.${permission.key}`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                    />
                                                                </FormControl>
                                                                <div className="space-y-1 leading-none">
                                                                    <FormLabel className="text-sm font-medium cursor-pointer">
                                                                        {permission.label}
                                                                    </FormLabel>
                                                                    <FormDescription className="text-xs">
                                                                        {permission.description}
                                                                    </FormDescription>
                                                                </div>
                                                            </FormItem>
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <SheetFooter className="p-6 border-t bg-gray-50 flex-none">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {admin ? "Update Admin" : "Create Admin"}
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
