"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
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
import { Loader2, Mail, CheckCircle, AlertCircle, Upload, Copy, RefreshCw, ArrowRight, ArrowLeft } from "lucide-react"
import { generatePassword } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Parent } from "./types"
import { Stepper } from "@/components/ui/stepper"

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

const STEPS = [
    { id: "basic", label: "Basic Info", fields: ["name", "email", "occupation", "password"] },
    { id: "contact", label: "Contact", fields: ["phone", "alternatePhone"] },
    { id: "address", label: "Address", fields: ["address", "city", "state", "country"] },
];

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
    const [currentStep, setCurrentStep] = useState(0);
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
            setCurrentStep(0);
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

    const nextStep = async () => {
        const fields = STEPS[currentStep].fields as any[];
        const isValid = await form.trigger(fields);
        if (isValid) {
            setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
        }
    };

    const prevStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };



    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("email", values.email);
            formData.append("password", values.password || "");
            if (values.phone) formData.append("phone", values.phone);
            if (values.alternatePhone) formData.append("alternatePhone", values.alternatePhone);
            if (values.occupation) formData.append("occupation", values.occupation);
            if (values.address) formData.append("address", values.address);
            if (values.city) formData.append("city", values.city);
            if (values.state) formData.append("state", values.state);
            if (values.country) formData.append("country", values.country);

            if (image && image.startsWith('data:')) {
                const parts = image.split(',');
                const byteString = atob(parts[1]);
                const mimeString = parts[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: mimeString });
                formData.append("profileImage", blob, "profile.jpg");
            }

            const promise = (async () => {
                const apiResponse = await fetch(isEditMode && parentToEdit ? `/api/parents/${parentToEdit.id}` : "/api/parents", {
                    method: isEditMode ? "PATCH" : "POST",
                    body: formData,
                });

                const result = await apiResponse.json();

                if (!apiResponse.ok) {
                    if (result.code === "EMAIL_EXISTS") {
                        form.setError("email", {
                            type: "manual",
                            message: "This email is already registered. Please use a different email."
                        });
                        throw new Error("Email already in use");
                    }
                    throw new Error(result.error || "Failed to save parent");
                }

                // Check if email was sent by the API for new parents
                if (!isEditMode) {
                    if (result.emailSent) {
                        setEmailStatus('success');
                    } else {
                        setEmailStatus('error');
                        setEmailError("Email delivery failed");
                    }
                }

                router.refresh();
                return result;
            })();

            toast.promise(promise, {
                loading: isEditMode ? 'Synchronizing parent profile...' : 'Registering parent into institutional database...',
                success: () => {
                    setTimeout(() => {
                        if (onSuccess) onSuccess();
                        onOpenChange(false);
                    }, 100);
                    return `✅ Parent "${values.name}" ${isEditMode ? 'updated' : 'registered'} successfully!`
                },
                error: (err) => err instanceof Error ? err.message : '❌ Operation failed',
            })

            await promise;
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <ResponsiveModal 
            open={open} 
            onOpenChange={onOpenChange}
            title={isEditMode ? 'Edit Parent Profile' : 'Parent Onboarding'}
            description={isEditMode
                ? "Update parent details and contact information."
                : "Complete the 3-step process to register a new parent."}
        >
            <div className="flex flex-col h-full">
                {!isEditMode && (
                    <div className="mb-6">
                        <Stepper steps={STEPS} currentStep={currentStep} />
                    </div>
                )}

                <div className="flex-1 overflow-y-auto pr-2">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {(currentStep === 0 || isEditMode) && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex flex-col items-center mb-6">
                                        <Avatar className="w-24 h-24 mb-3 border-4 border-white shadow-lg">
                                            <AvatarImage src={image || ""} alt="Profile" />
                                            <AvatarFallback className="text-2xl bg-indigo-50 text-indigo-600 font-bold">
                                                {form.getValues("name")
                                                    ? form.getValues("name").charAt(0).toUpperCase()
                                                    : "P"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-center">
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
                                                className="rounded-full"
                                            >
                                                <Upload className="h-3 w-3 mr-2" />
                                                {image ? "Change Photo" : "Upload Photo"}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. John Doe" {...field} />
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
                                                    <FormLabel>Email Address <span className="text-red-500">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="occupation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Occupation (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Software Engineer" {...field} />
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
                                                <FormLabel className="flex items-center">
                                                    {isEditMode ? "Change Password" : "Password"}
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
                                                        A random password is generated by default.
                                                    </FormDescription>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {(currentStep === 1 || isEditMode) && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h3 className={`font-semibold text-lg ${isEditMode ? 'pt-4 border-t' : ''}`}>
                                        Contact Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Phone Number</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="+1 234 567 890" {...field} />
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
                                                        <Input placeholder="+1 234 567 890" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    
                                    {!isEditMode && (
                                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                                            <div className="flex items-center text-sm text-blue-700">
                                                <Mail className="h-4 w-4 mr-2 text-blue-500" />
                                                <p className="font-medium">Credentials will be sent via email upon completion.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {(currentStep === 2 || isEditMode) && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h3 className={`font-semibold text-lg ${isEditMode ? 'pt-4 border-t' : ''}`}>
                                        Address Details
                                    </h3>
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Street Address</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="123 Main St" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="city"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>City</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="New York" {...field} />
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
                                                    <FormLabel>State</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="NY" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="country"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Country</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="USA" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}
                        </form>
                    </Form>
                </div>

                <div className="pt-4 border-t mt-4">
                    <div className="flex justify-between items-center">
                        {currentStep > 0 && !isEditMode ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={prevStep}
                                className="rounded-xl"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Previous
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                        )}

                        {!isEditMode && currentStep < STEPS.length - 1 ? (
                            <Button
                                type="button"
                                onClick={nextStep}
                                className="rounded-xl"
                            >
                                Next Step
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={form.handleSubmit(onSubmit)}
                                disabled={isLoading}
                                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 min-w-[120px]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isEditMode ? 'Saving...' : 'Registering...'}
                                    </>
                                ) : (
                                    isEditMode ? 'Save Changes' : 'Complete Registration'
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </ResponsiveModal>
    );
}