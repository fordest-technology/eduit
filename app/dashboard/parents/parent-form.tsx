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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Define form schema
const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    profileImage: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ParentForm({ parent }: { parent?: any }) {
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

            if (data.password) {
                formData.append("password", data.password);
            }

            if (data.profileImage) {
                formData.append("profileImage", data.profileImage);
            }

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

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || "Failed to save parent");
            }

            toast.success(parent ? "Parent updated" : "Parent created");
            router.push("/dashboard/parents");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>{parent ? "Edit Parent" : "Add New Parent"}</CardTitle>
            </CardHeader>
            <CardContent>
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
                                        {parent ? "New Password (leave blank to keep current)" : "Password"}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : parent ? "Update Parent" : "Add Parent"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
} 