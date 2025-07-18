"use client"

import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Camera, Upload, X, Mail, CheckCircle, AlertCircle, XCircle, Copy, RefreshCw } from "lucide-react"
import { UserRole } from "@prisma/client"
import { useRouter } from "next/navigation"
import { generatePassword } from "@/lib/utils"
import Image from "next/image"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Teacher } from "./columns"

// Enhanced form schema with date of birth and password
const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
    employeeId: z.string().optional(),
    qualifications: z.string().optional(),
    specialization: z.string().optional(),
    dateOfBirth: z.date().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER", "none"]).default("none"),
    address: z.string().optional(),
    password: z.string().min(6, "Password is required and must be at least 6 characters"),
})

interface AddTeacherModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    teacherToEdit?: Teacher | null
}

export function AddTeacherModal({
    open,
    onOpenChange,
    onSuccess,
    teacherToEdit
}: AddTeacherModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [image, setImage] = useState<string | null>(null)
    const [session, setSession] = useState<any>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [emailError, setEmailError] = useState<string | null>(null);
    const [emailRetryCount, setEmailRetryCount] = useState(0);
    const MAX_RETRIES = 3;
    const isEditMode = Boolean(teacherToEdit);
    const [copySuccess, setCopySuccess] = useState(false);

    // Fetch session on component mount
    useEffect(() => {
        async function fetchSession() {
            try {
                const response = await fetch('/api/auth/session');
                if (response.ok) {
                    const data = await response.json();
                    setSession(data);
                }
            } catch (error) {
                console.error('Error fetching session:', error);
            }
        }
        fetchSession();
    }, []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: teacherToEdit?.name || "",
            email: teacherToEdit?.email || "",
            phone: teacherToEdit?.phone || "",
            employeeId: "",
            qualifications: "",
            specialization: "",
            address: "",
            gender: "none",
            password: "",
        },
    })

    // Update form values when teacherToEdit changes
    useEffect(() => {
        if (teacherToEdit) {
            form.reset({
                name: teacherToEdit.name || "",
                email: teacherToEdit.email || "",
                phone: teacherToEdit.phone || "",
                employeeId: "",
                qualifications: "",
                specialization: "",
                address: "",
                gender: "none",
            });

            // If teacher has a profile image, set it
            if (teacherToEdit.profileImage) {
                setImage(teacherToEdit.profileImage);
            }
        } else {
            // Reset form when not in edit mode
            form.reset({
                name: "",
                email: "",
                phone: "",
                employeeId: "",
                qualifications: "",
                specialization: "",
                address: "",
                gender: "none",
                password: "",
            });
            setImage(null);
        }
    }, [teacherToEdit, form]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setImage(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleCopyPassword = async () => {
        try {
            await navigator.clipboard.writeText(form.getValues("password"));
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 1500);
        } catch {
            setCopySuccess(false);
        }
    };

    async function sendLoginCredentials(result: any, userPassword: string) {
        try {
            setEmailStatus('sending');
            setEmailError(null);

            // Get school information including name and URL
            let schoolName = "School";
            const schoolId = session?.schoolId;
            let schoolUrl = window.location.origin;

            try {
                // Try to get school info from the session's schoolId
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

            // Ensure all required fields are included
            const emailPayload = {
                name: result.name,
                email: result.email,
                password: userPassword,
                role: "teacher",
                schoolName: schoolName,
                schoolId: schoolId,
                schoolUrl: schoolUrl,
            };

            console.log("Sending credentials payload:", emailPayload);

            const emailResponse = await fetch("/api/send-credentials", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(emailPayload),
            });

            const responseData = await emailResponse.json();
            console.log("Send credentials response:", responseData);

            if (!emailResponse.ok) {
                throw new Error(responseData.error || "Failed to send login credentials");
            }

            setEmailStatus('success');
            setEmailRetryCount(0);
            return true;
        } catch (emailError) {
            console.error("Failed to send email:", emailError);
            setEmailStatus('error');
            if (emailError instanceof Error) {
                setEmailError(emailError.message);
            } else {
                setEmailError("Failed to send login credentials");
            }
            return false;
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsLoading(true);
            setEmailStatus('idle');
            setEmailError(null);

            // Create FormData to handle file uploads
            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("email", values.email);
            formData.append("phone", values.phone || "");
            formData.append("password", values.password);

            if (values.employeeId) formData.append("employeeId", values.employeeId);
            if (values.qualifications) formData.append("qualifications", values.qualifications);
            if (values.specialization) formData.append("specialization", values.specialization);
            if (values.dateOfBirth) formData.append("dateOfBirth", values.dateOfBirth.toISOString());
            if (values.gender !== "none") formData.append("gender", values.gender);
            if (values.address) formData.append("address", values.address);

            // If we have a new image, append it to the form
            if (image && image.startsWith("data:")) {
                const blob = await (await fetch(image)).blob();
                formData.append("profileImage", blob, "profile.jpg");
            }

            // Set the teacher role
            formData.append("role", "TEACHER");

            // Add the current session's school ID
            try {
                const sessionResponse = await fetch('/api/auth/session');
                if (sessionResponse.ok) {
                    const sessionData = await sessionResponse.json();
                    if (sessionData.schoolId) {
                        formData.append("schoolId", sessionData.schoolId);
                    }
                }
            } catch (err) {
                console.error("Error getting current session:", err);
            }

            const response = await fetch("/api/teachers", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || "Failed to create teacher");
            }

            // Get the result from the response
            const result = await response.json();

            // Send email credentials if it's a new teacher
            if (!isEditMode) {
                const emailSent = await sendLoginCredentials(result, values.password);
                if (!emailSent) {
                    toast.warning("Teacher created but failed to send login credentials. Please try sending them again.");
                }
            }

            toast.success(`Teacher ${isEditMode ? 'updated' : 'created'} successfully!`);

            // Refresh the page data
            router.refresh();

            // Reset form if not in edit mode
            if (!isEditMode) {
                form.reset({
                    name: "",
                    email: "",
                    phone: "",
                    employeeId: "",
                    qualifications: "",
                    specialization: "",
                    dateOfBirth: undefined,
                    gender: "none",
                    address: "",
                    password: "",
                });
                setImage(null);
            }

            // Close the modal
            onOpenChange(false);

            // Call onSuccess callback if provided
            if (onSuccess) {
                onSuccess();
            }

            // Force an immediate refresh of the teachers list
            router.push('/dashboard/teachers');

        } catch (error) {
            console.error("Failed to save teacher:", error);
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[725px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditMode ? 'Edit Teacher' : 'Add New Teacher'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditMode
                            ? 'Update the teacher\'s information. When you\'re done, click save.'
                            : 'Add a new teacher to your school. They will receive an email with login credentials.'
                        }
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="flex justify-center mb-6">
                            {image ? (
                                <div className="relative">
                                    <Image
                                        src={image}
                                        alt="Profile"
                                        width={120}
                                        height={120}
                                        className="rounded-full object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2"
                                        onClick={() => setImage(null)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Profile Photo
                                    </Button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {/* Personal Information Section */}
                            <div className="border p-4 rounded-md">
                                <h3 className="font-medium mb-3">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter teacher's full name (e.g., John Smith)" {...field} />
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
                                                    <Input type="email" placeholder="Enter professional email address" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="dateOfBirth"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Date of Birth</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP")
                                                                ) : (
                                                                    <span>Select date of birth</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) =>
                                                                date > new Date() || date < new Date("1940-01-01")
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="gender"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gender</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select gender" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="none">Not specified</SelectItem>
                                                        <SelectItem value="MALE">Male</SelectItem>
                                                        <SelectItem value="FEMALE">Female</SelectItem>
                                                        <SelectItem value="OTHER">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter contact number with country code" {...field} />
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
                                                <FormLabel>Address</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter residential address" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Professional Information Section */}
                            <div className="border p-4 rounded-md">
                                <h3 className="font-medium mb-3">Professional Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="employeeId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    Employee ID
                                                    <span className="text-xs text-muted-foreground">(Auto-generated)</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        value={field.value || ""}
                                                        disabled
                                                        className="bg-muted cursor-not-allowed"
                                                        placeholder="Will be automatically assigned"
                                                    />
                                                </FormControl>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    A unique ID will be automatically generated when you save
                                                </p>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="qualifications"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Qualifications</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter academic qualifications (e.g., BSc, MSc, PhD)" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="specialization"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>Specialization</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter teaching specialization (e.g., Mathematics, Physics)" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Password Field (only for add mode) */}
                            {!isEditMode && (
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <Input
                                                type="text"
                                                placeholder="Set a password for the teacher"
                                                {...field}
                                                required
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <div className="bg-muted/50 p-4 rounded-md mt-4">
                                <div className="flex items-center text-sm">
                                    <Mail className="h-4 w-4 mr-2" />
                                    <p>A welcome email with login credentials will be sent automatically to the provided email address.</p>
                                </div>

                                {emailStatus === 'sending' && (
                                    <div className="flex items-center mt-2 text-sm text-amber-600">
                                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                        <p>Sending login credentials to {form.getValues("email")}...</p>
                                    </div>
                                )}

                                {emailStatus === 'success' && (
                                    <div className="flex items-center mt-2 text-sm text-green-600">
                                        <CheckCircle className="h-3 w-3 mr-2" />
                                        <p>Login credentials sent successfully to {form.getValues("email")}!</p>
                                    </div>
                                )}

                                {emailStatus === 'error' && (
                                    <div className="space-y-2 mt-2">
                                        <div className="flex items-center text-sm text-red-600">
                                            <AlertCircle className="h-3 w-3 mr-2" />
                                            <p>Failed to send login credentials: {emailError}</p>
                                        </div>
                                        {emailRetryCount < MAX_RETRIES && (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEmailRetryCount(prev => prev + 1);
                                                        sendLoginCredentials(
                                                            {
                                                                name: form.getValues("name"),
                                                                email: form.getValues("email"),
                                                                schoolId: session?.schoolId
                                                            },
                                                            form.getValues("password")
                                                        );
                                                    }}
                                                >
                                                    <Mail className="h-3 w-3 mr-2" />
                                                    Retry Sending
                                                </Button>
                                                <p className="text-xs text-muted-foreground">
                                                    Attempt {emailRetryCount + 1} of {MAX_RETRIES}
                                                </p>
                                            </div>
                                        )}
                                        {emailRetryCount >= MAX_RETRIES && (
                                            <div className="text-xs text-muted-foreground">
                                                Please contact the teacher directly to provide their login credentials:
                                                <br />
                                                Email: {form.getValues("email")}
                                                <br />
                                                Password: {form.getValues("password")}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="relative"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isEditMode ? 'Saving...' : 'Adding...'}
                                    </>
                                ) : (
                                    <>
                                        {isEditMode ? 'Save Changes' : 'Add Teacher'}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
} 