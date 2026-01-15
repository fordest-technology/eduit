"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Button } from "@/components/ui/button"
import { Loader2, Mail, CheckCircle, AlertCircle, X, Upload, Copy, RefreshCw } from "lucide-react"
import { generatePassword } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Parent } from "./types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const createFormSchema = (isEditMode: boolean) => z.object({
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
}).refine(data => isEditMode || !!data.password, {
    message: "Password is required for new parents",
    path: ["password"],
});

interface AddParentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    parentToEdit?: Parent | null
}

export function AddParentModal({
    open,
    onOpenChange,
    onSuccess,
    parentToEdit
}: AddParentModalProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [image, setImage] = useState<string | null>(null)
    const [session, setSession] = useState<any>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [emailError, setEmailError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>("basic");
    const isEditMode = Boolean(parentToEdit);

    const formSchema = createFormSchema(isEditMode);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            alternatePhone: "",
            occupation: "",
            address: "",
            city: "",
            state: "",
            country: "",
            password: isEditMode ? "" : generatePassword(),
        },
    })

    useEffect(() => {
        async function fetchSession() {
            try {
                const response = await fetch('/api/auth/session');
                if (response.ok) setSession(await response.json());
            } catch (error) {
                console.error('Error fetching session:', error);
            }
        }
        fetchSession();
    }, []);

    useEffect(() => {
        if (open) {
            if (parentToEdit) {
                form.reset({
                    name: parentToEdit.name || "",
                    email: parentToEdit.email || "",
                    phone: parentToEdit.phone || "",
                    alternatePhone: parentToEdit.alternatePhone || "",
                    occupation: parentToEdit.occupation || "",
                    address: parentToEdit.address || "",
                    city: parentToEdit.city || "",
                    state: parentToEdit.state || "",
                    country: parentToEdit.country || "",
                    password: "",
                });
                setImage(parentToEdit.profileImage || null);
            } else {
                form.reset({
                    name: "",
                    email: "",
                    phone: "",
                    alternatePhone: "",
                    occupation: "",
                    address: "",
                    city: "",
                    state: "",
                    country: "",
                    password: generatePassword()
                });
                setImage(null);
            }
            setEmailStatus('idle');
            setEmailError(null);
            setActiveTab("basic");
        }
    }, [parentToEdit, open, form]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result as string);
            reader.readAsDataURL(file);
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

    async function sendLoginCredentials(parentName: string, parentEmail: string, userPassword: string) {
        setEmailStatus('sending');
        setEmailError(null);

        try {
            // Get school information
            let schoolName = "School";
            let schoolId = session?.schoolId;
            let schoolUrl = window.location.origin;

            try {
                if (schoolId) {
                    const schoolResponse = await fetch(`/api/schools/${schoolId}`);
                    if (schoolResponse.ok) {
                        const schoolData = await schoolResponse.json();
                        schoolName = schoolData.name || schoolName;
                        if (schoolData.subdomain) {
                            schoolUrl = `https://${schoolData.subdomain}.eduit.app`;
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching school info:", err);
            }

            const response = await fetch("/api/send-credentials", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: parentName,
                    email: parentEmail,
                    password: userPassword,
                    role: "parent",
                    schoolName: schoolName,
                    schoolId: schoolId,
                    schoolUrl: schoolUrl,
                    revalidate: true,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || "Failed to send login credentials");
            }

            setEmailStatus('success');
            return true;
        } catch (error) {
            console.error("Failed to send email:", error);
            setEmailStatus('error');
            if (error instanceof Error) {
                setEmailError(error.message);
            } else {
                setEmailError("Failed to send login credentials");
            }
            return false;
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);

        try {
            const formData = new FormData();

            // Basic information
            formData.append("name", values.name);
            formData.append("email", values.email);
            formData.append("password", values.password || "");

            // Contact information
            if (values.phone) formData.append("phone", values.phone);
            if (values.alternatePhone) formData.append("alternatePhone", values.alternatePhone);

            // Professional information
            if (values.occupation) formData.append("occupation", values.occupation);

            // Address information
            if (values.address) formData.append("address", values.address);
            if (values.city) formData.append("city", values.city);
            if (values.state) formData.append("state", values.state);
            if (values.country) formData.append("country", values.country);

            // Add image if available
            if (image && image.startsWith('data:')) {
                const response = await fetch(image);
                const blob = await response.blob();
                formData.append("profileImage", blob, "profile.jpg");
            }

            let apiResponse;

            if (isEditMode && parentToEdit) {
                // Update existing parent
                apiResponse = await fetch(`/api/parents/${parentToEdit.id}`, {
                    method: "PATCH",
                    body: formData,
                });
            } else {
                // Create new parent
                apiResponse = await fetch("/api/parents", {
                    method: "POST",
                    body: formData,
                });
            }

            const result = await apiResponse.json();

            if (!apiResponse.ok) {
                if (result.code === "EMAIL_EXISTS") {
                    form.setError("email", {
                        type: "manual",
                        message: "This email is already registered. Please use a different email."
                    });
                    setIsLoading(false);
                    return;
                }
                throw new Error(result.error || "Failed to save parent");
            }

            // If creating a new parent, send login credentials
            if (!isEditMode) {
                await sendLoginCredentials(values.name, values.email, values.password || "");
            }

            toast.success(isEditMode
                ? `Parent ${values.name} updated successfully`
                : `Parent ${values.name} created successfully`
            );

            // Immediate data refresh
            router.refresh();

            // Close modal and trigger additional success callback
            setTimeout(() => {
                if (onSuccess) onSuccess();
                onOpenChange(false);
            }, 100);

        } catch (error: any) {
            toast.error(error.message || "An error occurred");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-[550px] sm:w-[600px] lg:w-[650px] overflow-y-auto"
            >
                <SheetHeader className="mb-6 border-b pb-4">
                    <SheetTitle className="text-xl font-semibold">
                        {isEditMode ? 'Edit Parent Account' : 'Add New Parent'}
                    </SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">
                        {isEditMode
                            ? "Update the parent's information and save changes when done."
                            : "Create a new parent account. Login credentials will be sent automatically via email."}
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Image Upload Section */}
                        <div className="flex flex-col items-center mb-6">
                            <Avatar className="w-24 h-24 mb-2 border-2 border-primary/20">
                                <AvatarImage src={image || ""} alt="Profile" />
                                <AvatarFallback className="text-lg bg-primary/10">
                                    {form.getValues("name")
                                        ? form.getValues("name")
                                            .split(" ")
                                            .map((n: string) => n[0])
                                            .join("")
                                            .toUpperCase()
                                        : "P"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="mt-2 text-center">
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mb-1"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {image ? "Change Photo" : "Upload Photo"}
                                </Button>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Recommended: Square image, max 2MB
                                </p>
                            </div>
                        </div>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-2 bg-muted/50 p-1 rounded-lg">
                                <TabsTrigger
                                    value="basic"
                                    className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:shadow-sm rounded-md"
                                >
                                    Basic Info
                                </TabsTrigger>
                                <TabsTrigger
                                    value="contact"
                                    className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:shadow-sm rounded-md"
                                >
                                    Contact Info
                                </TabsTrigger>
                                <TabsTrigger
                                    value="address"
                                    className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:shadow-sm rounded-md"
                                >
                                    Address
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4 mt-4 p-4 border rounded-lg bg-white">
                                {/* Name Field */}
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center">
                                                Full Name <span className="text-red-500 ml-1">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Jane Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Email Field */}
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center">
                                                Email Address <span className="text-red-500 ml-1">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="e.g., jane.doe@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Occupation Field */}
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

                                {/* Password Field */}
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center">
                                                {isEditMode ? "New Password (leave blank to keep current)" : "Password"}
                                                {!isEditMode && <span className="text-red-500 ml-1">*</span>}
                                            </FormLabel>
                                            <div className="flex space-x-2">
                                                <FormControl>
                                                    <PasswordInput {...field} />
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
                                            {!isEditMode && (
                                                <FormDescription>
                                                    A secure password will be generated and sent to the parent's email.
                                                </FormDescription>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>

                            <TabsContent value="contact" className="space-y-4 mt-4 p-4 border rounded-lg bg-white">
                                {/* Phone Field */}
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., +1 234 567 890" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Alternate Phone Field */}
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
                            </TabsContent>

                            <TabsContent value="address" className="space-y-4 mt-4 p-4 border rounded-lg bg-white">
                                {/* Address Field */}
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
                                    {/* City Field */}
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

                                    {/* State Field */}
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

                                {/* Country Field */}
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

                        {/* Required Fields Note */}
                        <div className="text-xs text-muted-foreground mt-2 mb-4">
                            <span className="text-red-500">*</span> Required fields
                        </div>

                        {/* Email Sending Info */}
                        {!isEditMode && (
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-md">
                                <div className="flex items-center text-sm text-blue-700">
                                    <Mail className="h-4 w-4 mr-2 text-blue-500" />
                                    <p className="font-medium">A welcome email with login credentials will be sent automatically.</p>
                                </div>
                                {emailStatus === 'sending' && (
                                    <div className="flex items-center mt-2 text-sm text-amber-600">
                                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                        <p>Sending login credentials to email...</p>
                                    </div>
                                )}
                                {emailStatus === 'success' && (
                                    <div className="flex items-center mt-2 text-sm text-green-600">
                                        <CheckCircle className="h-3 w-3 mr-2" />
                                        <p>Login credentials sent successfully!</p>
                                    </div>
                                )}
                                {emailStatus === 'error' && (
                                    <div className="flex items-center mt-2 text-sm text-red-600">
                                        <AlertCircle className="h-3 w-3 mr-2" />
                                        <p>{emailError || "Failed to send email with credentials."}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <SheetFooter className="pt-6 border-t mt-6 flex justify-between sm:justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="w-[120px]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-[150px]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isEditMode ? 'Saving...' : 'Creating...'}
                                    </>
                                ) : (
                                    isEditMode ? 'Save Changes' : 'Create Parent'
                                )}
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
} 