"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { type ParentFormData } from "./types";

// Define form schema
const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    profileImage: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ParentFormProps {
    parent?: ParentFormData;
    onSuccess?: () => void;
}

export default function ParentForm({ parent, onSuccess }: ParentFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        parent?.profileImage || null
    );

    // Initialize form with default values or existing parent data
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: parent?.name || "",
            email: parent?.email || "",
            phone: parent?.phone || "",
            password: parent ? undefined : "",
        },
    });

    // Handle image preview
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setValue("profileImage", file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    // Handle form submission
    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", data.name);
            formData.append("email", data.email);
            if (data.phone) formData.append("phone", data.phone);
            if (data.password) formData.append("password", data.password);
            if (data.profileImage) formData.append("profileImage", data.profileImage);

            let response;

            if (parent) {
                // Update existing parent
                response = await fetch(`/api/parents/${parent.id}`, {
                    method: "PATCH",
                    body: formData,
                });
            } else {
                // Create new parent
                response = await fetch("/api/parents", {
                    method: "POST",
                    body: formData,
                });
            }

            const result = await response.json();

            if (!response.ok) {
                if (result.code === "EMAIL_EXISTS") {
                    form.setError("email", {
                        type: "manual",
                        message: "This email is already registered. Please use a different email."
                    });
                    return;
                }
                throw new Error(result.error || "Failed to save parent");
            }

            // Show appropriate message based on whether email was sent
            if (parent) {
                toast.success("Parent updated successfully");
            } else {
                if (result.emailSent === false) {
                    toast.warning("Parent account created. However, there was an issue sending the login email. You may need to provide credentials manually.");
                } else {
                    toast.success(result.message || "Parent created successfully");
                }
            }

            // Refresh the router and call onSuccess
            router.refresh();
            onSuccess?.();
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {!parent && (
                <Alert className="bg-blue-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Automatic credential generation</AlertTitle>
                    <AlertDescription>
                        When you create a new parent, the system will automatically generate a secure password and send the
                        login credentials to the parent's email address if you don't provide a password.
                    </AlertDescription>
                </Alert>
            )}

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                >
                    <div className="flex flex-col items-center mb-6">
                        <Avatar className="w-24 h-24 mb-2">
                            <AvatarImage src={previewUrl || ""} alt="Profile" />
                            <AvatarFallback className="text-lg">
                                {parent?.name
                                    ? parent.name
                                        .split(" ")
                                        .map((n: string) => n[0])
                                        .join("")
                                        .toUpperCase()
                                    : "P"}
                            </AvatarFallback>
                        </Avatar>
                        <Input
                            id="profileImage"
                            type="file"
                            accept="image/*"
                            className="w-full max-w-xs mt-2"
                            onChange={handleImageChange}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Full name" {...field} />
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
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder="Email address"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Phone number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {parent ? "New Password (leave blank to keep current)" : "Password (Optional)"}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder={parent ? "New password" : "Leave blank to auto-generate"}
                                        {...field}
                                    />
                                </FormControl>
                                {!parent && (
                                    <FormDescription>
                                        If left blank, a secure password will be generated and sent to the parent's email.
                                    </FormDescription>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onSuccess}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                                    {parent ? "Updating..." : "Creating..."}
                                </>
                            ) : parent ? (
                                "Update Parent"
                            ) : (
                                "Create Parent"
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
} 