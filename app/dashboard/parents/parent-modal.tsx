"use client";

import { useState, useEffect } from "react";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Define form schema
const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    profileImage: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ParentModalProps {
    parent?: any;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export default function ParentModal({ parent, trigger, onSuccess }: ParentModalProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        parent?.profileImage || null
    );
    const [open, setOpen] = useState(false);

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

    // Reset form when parent data changes
    useEffect(() => {
        if (parent) {
            form.reset({
                name: parent.name || "",
                email: parent.email || "",
                phone: parent.phone || "",
                password: undefined,
            });
            setPreviewUrl(parent.profileImage || null);
        }
    }, [parent, form]);

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

            toast({
                title: parent ? "Parent updated" : "Parent created",
                description: parent
                    ? `${data.name} has been updated successfully`
                    : `${data.name} has been added as a parent`,
                variant: "default",
            });

            form.reset();
            setPreviewUrl(null);
            setOpen(false);

            if (onSuccess) {
                onSuccess();
            } else {
                router.refresh();
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Something went wrong",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Parent
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{parent ? "Edit Parent" : "Add New Parent"}</DialogTitle>
                </DialogHeader>
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

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : parent ? "Update Parent" : "Add Parent"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
} 