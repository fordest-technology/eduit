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
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetTrigger,
    SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Loader2, RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";
import { generatePassword } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define form schema
const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    alternatePhone: z.string().optional(),
    occupation: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
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
    const [isLoading, setIsLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        parent?.profileImage || null
    );
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("basic");

    // Initialize form with default values or existing parent data
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: parent?.name || "",
            email: parent?.email || "",
            phone: parent?.phone || "",
            alternatePhone: parent?.alternatePhone || "",
            occupation: parent?.occupation || "",
            address: parent?.address || "",
            city: parent?.city || "",
            state: parent?.state || "",
            country: parent?.country || "",
            password: parent ? undefined : generatePassword(),
        },
    });

    // Reset form when parent data changes
    useEffect(() => {
        if (parent) {
            form.reset({
                name: parent.name || "",
                email: parent.email || "",
                phone: parent.phone || "",
                alternatePhone: parent.alternatePhone || "",
                occupation: parent.occupation || "",
                address: parent.address || "",
                city: parent.city || "",
                state: parent.state || "",
                country: parent.country || "",
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

    const handleGeneratePassword = () => {
        const newPassword = generatePassword();
        form.setValue("password", newPassword);
    };

    const handleCopyPassword = () => {
        const password = form.getValues("password");
        if (password) {
            navigator.clipboard.writeText(password);
            toast.success("Password copied to clipboard");
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
            if (data.alternatePhone) formData.append("alternatePhone", data.alternatePhone);
            if (data.occupation) formData.append("occupation", data.occupation);
            if (data.address) formData.append("address", data.address);
            if (data.city) formData.append("city", data.city);
            if (data.state) formData.append("state", data.state);
            if (data.country) formData.append("country", data.country);
            if (data.password) formData.append("password", data.password);

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

            toast.success(parent ? "Parent updated" : "Parent created", {
                description: parent
                    ? `${data.name} has been updated successfully`
                    : `${data.name} has been added as a parent`,
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
            toast.error("Error", {
                description: error.message || "Something went wrong",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Parent
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent
                side="left"
                className="w-[45%] max-w-[600px] overflow-y-auto"
            >
                <SheetHeader className="mb-5">
                    <SheetTitle>{parent ? "Edit Parent" : "Add New Parent"}</SheetTitle>
                    <SheetDescription>
                        {parent
                            ? "Update the parent's information. Click save when you're done."
                            : "Add a new parent. They will receive an email with login credentials."}
                    </SheetDescription>
                </SheetHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
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

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                <TabsTrigger value="contact">Contact & Address</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4 mt-4">
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
                                    name="occupation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Occupation (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Doctor, Teacher, etc." {...field} />
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
                                            <div className="flex space-x-2">
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder={parent ? "New password" : "Password"}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="outline"
                                                    onClick={handleGeneratePassword}
                                                    title="Generate new password"
                                                >
                                                    <RefreshCw className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="outline"
                                                    onClick={handleCopyPassword}
                                                    title="Copy password"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {!parent && (
                                                <FormDescription>
                                                    A secure password will be generated and sent to the parent's email.
                                                </FormDescription>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>

                            <TabsContent value="contact" className="space-y-4 mt-4">
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
                                    name="alternatePhone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Alternate Phone (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., +1 234 567 890" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., 123 Main St" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., New York" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>State/Province (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., NY" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Country (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., United States" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>
                        </Tabs>

                        <SheetFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {parent ? "Updating..." : "Creating..."}
                                    </>
                                ) : parent ? (
                                    "Update Parent"
                                ) : (
                                    "Add Parent"
                                )}
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
} 