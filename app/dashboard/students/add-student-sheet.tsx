"use client"

import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Loader2, Camera, Upload, X, CalendarIcon, Mail, Send } from "lucide-react"
import { UserRole } from "@prisma/client"
import { useRouter } from "next/navigation"
import { generatePassword } from "@/lib/utils"
import Image from "next/image"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useColors } from "@/contexts/color-context"

// Gender options array
const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
];

// Blood group options
const bloodGroupOptions = [
    { value: "A+", label: "A+" },
    { value: "A-", label: "A-" },
    { value: "B+", label: "B+" },
    { value: "B-", label: "B-" },
    { value: "AB+", label: "AB+" },
    { value: "AB-", label: "AB-" },
    { value: "O+", label: "O+" },
    { value: "O-", label: "O-" },
];

// Define the comprehensive form schema based on the Prisma schema
const formSchema = z.object({
    // User model fields
    name: z.string()
        .min(2, { message: "Name must be at least 2 characters." })
        .max(100, { message: "Name must not exceed 100 characters." })
        .transform(val => val.trim()),
    email: z.string()
        .email({ message: "Please enter a valid email address." })
        .transform(val => val.toLowerCase().trim()),
    password: z.string()
        .min(6, { message: "Password must be at least 6 characters." }),
    profileImage: z.any().optional(),

    // Student model fields
    admissionDate: z.date({
        required_error: "Admission date is required.",
        invalid_type_error: "Please select a valid date.",
    }),
    departmentId: z.string().optional(),
    address: z.string().min(1, "Address is required.").max(200, { message: "Address must not exceed 200 characters." }),
    city: z.string().min(1, "City is required.").max(50, { message: "City must not exceed 50 characters." }),
    state: z.string().min(1, "State is required.").max(50, { message: "State must not exceed 50 characters." }),
    country: z.string().min(1, "Country is required.").max(50, { message: "Country must not exceed 50 characters." }),
    phone: z.string().min(1, "Phone number is required.").regex(/^\+?[1-9]\d{1,14}$/, { message: "Please enter a valid phone number." }),
    dateOfBirth: z.date({
        required_error: "Date of birth is required.",
        invalid_type_error: "Please select a valid date.",
    }),
    gender: z.enum(["male", "female", "other"], {
        required_error: "Please select a gender.",
    }),
    religion: z.string().min(1, "Religion is required.").max(50, { message: "Religion must not exceed 50 characters." }),
    bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
        required_error: "Please select a blood group.",
    }),

    // Class assignment fields
    levelId: z.string().optional(),
    classId: z.string().optional(),
    sessionId: z.string().optional(),
    rollNumber: z.string().optional(),

    // Email settings
    sendCredentials: z.boolean().default(true),
    sendWelcomeEmail: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>

interface Department {
    id: string;
    name: string;
}

interface SchoolLevel {
    id: string;
    name: string;
}

interface Class {
    id: string;
    name: string;
    section?: string;
    levelId?: string;
}

interface AcademicSession {
    id: string;
    name: string;
    isCurrent: boolean;
}

interface AddStudentSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    studentToEdit?: any // For editing existing student
}

export function AddStudentSheet({
    open,
    onOpenChange,
    onSuccess,
    studentToEdit
}: AddStudentSheetProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isSendingCredentials, setIsSendingCredentials] = useState(false)
    const [profileImage, setProfileImage] = useState<File | null>(null)
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
    const [departments, setDepartments] = useState<Department[]>([])
    const [levels, setLevels] = useState<SchoolLevel[]>([])
    const [classes, setClasses] = useState<Class[]>([])
    const [sessions, setSessions] = useState<AcademicSession[]>([])
    const [filteredClasses, setFilteredClasses] = useState<Class[]>([])
    const [activeTab, setActiveTab] = useState("personal")
    const [isLoadingData, setIsLoadingData] = useState(false)
    const [dataError, setDataError] = useState<string | null>(null)
    const router = useRouter()
    const { colors } = useColors()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            // User fields
            name: "",
            email: "",
            password: generatePassword(),

            // Student fields
            admissionDate: new Date(),
            phone: "",
            address: "",
            city: "",
            state: "",
            country: "",
            dateOfBirth: new Date(),
            gender: "male",
            religion: "",
            bloodGroup: "A+",

            // Relationships
            departmentId: "none",
            levelId: "none",
            classId: "none",
            sessionId: "none",
            rollNumber: "",

            // Email settings
            sendCredentials: true,
            sendWelcomeEmail: true,
        },
    })

    // Set form values when editing a student
    useEffect(() => {
        if (studentToEdit && open) {
            form.reset({
                // User fields
                name: studentToEdit.name || "",
                email: studentToEdit.email || "",
                password: "", // Don't set password for editing

                // Student fields
                admissionDate: studentToEdit.admissionDate ? new Date(studentToEdit.admissionDate) : new Date(),
                phone: studentToEdit.phone || "",
                address: studentToEdit.address || "",
                city: studentToEdit.city || "",
                state: studentToEdit.state || "",
                country: studentToEdit.country || "",
                dateOfBirth: studentToEdit.dateOfBirth ? new Date(studentToEdit.dateOfBirth) : new Date(),
                gender: studentToEdit.gender || "male",
                religion: studentToEdit.religion || "",
                bloodGroup: studentToEdit.bloodGroup || "A+",

                // Relationships
                departmentId: studentToEdit.departmentId || "none",
                levelId: studentToEdit.levelId || studentToEdit.class?.levelId || "none",
                classId: studentToEdit.classId || "none",
                sessionId: studentToEdit.sessionId || "none",
                rollNumber: studentToEdit.rollNumber || "",

                // Email settings
                sendCredentials: false, // Don't send credentials when editing
                sendWelcomeEmail: false,
            });

            // If there's a profile image, set it
            if (studentToEdit.profileImage) {
                setProfileImageUrl(studentToEdit.profileImage);
            }
        }
    }, [studentToEdit, open, form]);

    // Fetch departments, levels, classes, and sessions
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoadingData(true);
                setDataError(null);

                const [deptResponse, levelResponse, classResponse, sessionResponse] = await Promise.all([
                    fetch("/api/departments"),
                    fetch("/api/school-levels"),
                    fetch("/api/classes"),
                    fetch("/api/academic-sessions")
                ]);

                if (deptResponse.ok) {
                    const deptData = await deptResponse.json();
                    // Transform the complex department data to simple format
                    const simplifiedDepts = deptData.map((dept: any) => ({
                        id: dept.id,
                        name: dept.name,
                    }));
                    setDepartments(simplifiedDepts);
                } else {
                    console.error("Failed to fetch departments:", deptResponse.status);
                }

                if (levelResponse.ok) {
                    const levelData = await levelResponse.json();
                    // Transform the complex level data to simple format
                    const simplifiedLevels = levelData.map((level: any) => ({
                        id: level.id,
                        name: level.name,
                    }));
                    setLevels(simplifiedLevels);
                } else {
                    console.error("Failed to fetch levels:", levelResponse.status);
                }

                if (classResponse.ok) {
                    const classData = await classResponse.json();
                    // Transform the complex class data to simple format expected by the form
                    const simplifiedClasses = classData.map((cls: any) => ({
                        id: cls.id,
                        name: cls.name,
                        section: cls.section,
                        levelId: cls.level?.id || null,
                    }));
                    setClasses(simplifiedClasses);
                } else {
                    console.error("Failed to fetch classes:", classResponse.status);
                }

                if (sessionResponse.ok) {
                    const sessionData = await sessionResponse.json();
                    // Transform the complex session data to simple format
                    const simplifiedSessions = sessionData.map((session: any) => ({
                        id: session.id,
                        name: session.name,
                        isCurrent: session.isCurrent,
                    }));
                    setSessions(simplifiedSessions);
                } else {
                    console.error("Failed to fetch sessions:", sessionResponse.status);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setDataError("Failed to load form data. Please try again.");
                toast.error("⚠️ Failed to Load Form Data", {
                    description: "Unable to load departments, classes, and other form data. Please refresh the page.",
                    duration: 5000
                });
            } finally {
                setIsLoadingData(false);
            }
        };

        if (open) {
            fetchData();
        }
    }, [open]);

    // Filter classes based on selected level
    useEffect(() => {
        const levelId = form.watch("levelId");
        if (levelId && levelId !== "none") {
            const filtered = classes.filter(cls => cls.levelId === levelId);
            setFilteredClasses(filtered);
        } else {
            setFilteredClasses(classes);
        }
    }, [form.watch("levelId"), classes]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfileImage(file);
            setProfileImageUrl(URL.createObjectURL(file));
        }
    };

    const clearImage = () => {
        setProfileImage(null);
        setProfileImageUrl(null);
    };

    const generateNewPassword = () => {
        const newPassword = generatePassword();
        form.setValue("password", newPassword);
    };

    const sendCredentialsEmail = async (studentData: any) => {
        try {
            setIsSendingCredentials(true);

            const response = await fetch("/api/send-credentials", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: studentData.name,
                    email: studentData.email,
                    role: "student",
                    schoolName: "Your School", // This should come from context
                    password: studentData.password,
                    schoolId: "school-id", // This should come from context
                    schoolUrl: window.location.origin,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send credentials");
            }

            toast.success("📧 Credentials Sent Successfully!", {
                description: `Login credentials have been sent to ${studentData.email}`,
                duration: 4000
            });
        } catch (error) {
            console.error("Error sending credentials:", error);
            toast.error("❌ Failed to Send Credentials", {
                description: "Unable to send login credentials to student email. Please try again.",
                duration: 5000
            });
        } finally {
            setIsSendingCredentials(false);
        }
    };

    const onSubmit = async (values: FormValues) => {
        try {
            setIsLoading(true);
            console.log("Submitting form with values:", values);

            // Create FormData object
            const formData = new FormData();

            // Append all form values
            Object.entries(values).forEach(([key, value]) => {
                if (value instanceof Date) {
                    formData.append(key, value.toISOString());
                } else if (value !== undefined && value !== null) {
                    // Convert "none" values to empty strings for API
                    const finalValue = value === "none" ? "" : value.toString();
                    formData.append(key, finalValue);
                }
            });

            // Append profile image if exists
            if (profileImage) {
                formData.append("profileImage", profileImage);
            }

            console.log("FormData entries:");
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }

            // Make API request
            const response = await fetch("/api/students", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            console.log("API response:", { status: response.status, data });

            if (!response.ok) {
                // Handle validation errors
                if (response.status === 400 && data.errors) {
                    const errorMessages = Object.entries(data.errors)
                        .map(([field, message]) => `${field}: ${message}`)
                        .join('\n');
                    throw new Error(`Validation failed:\n${errorMessages}`);
                }
                throw new Error(data.message || "Failed to create student");
            }

            // Send credentials email if requested
            if (values.sendCredentials) {
                await sendCredentialsEmail({
                    name: values.name,
                    email: values.email,
                    password: values.password,
                });
            }

            // Show a prominent success toast
            if (studentToEdit) {
                toast.success("✅ Student Updated Successfully!", {
                    description: `${values.name}'s information has been updated successfully.`,
                    duration: 4000,
                    action: {
                        label: "View Students",
                        onClick: () => router.push("/dashboard/students")
                    }
                });
            } else {
                toast.success("🎉 Student Created Successfully!", {
                    description: `${values.name} has been added to the system successfully.`,
                    duration: 5000, // Show for 5 seconds
                    action: {
                        label: "View Students",
                        onClick: () => router.push("/dashboard/students")
                    }
                });
            }

            onSuccess?.();
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            console.error("Error creating student:", error);
            toast.error("❌ Failed to Create Student", {
                description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
                duration: 6000
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[600px] sm:max-w-[600px] md:max-w-[500px] lg:max-w-[600px] overflow-y-auto">
                <SheetHeader className="space-y-4">
                    <SheetTitle className="text-2xl font-bold">
                        {studentToEdit ? "Edit Student" : "Add New Student"}
                    </SheetTitle>
                    <SheetDescription className="text-base">
                        {studentToEdit
                            ? "Update student details and academic information."
                            : "Enter comprehensive student details to add them to the system."
                        }
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6">
                    {isLoadingData && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Loading form data...</span>
                        </div>
                    )}

                    {dataError && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                            <p className="text-destructive text-sm">{dataError}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => window.location.reload()}
                            >
                                Retry
                            </Button>
                        </div>
                    )}

                    {!isLoadingData && !dataError && (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
                                <TabsTrigger
                                    value="personal"
                                    className="data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:font-bold text-sm md:text-base"
                                >
                                    Personal
                                </TabsTrigger>
                                <TabsTrigger
                                    value="academic"
                                    className="data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:font-bold text-sm md:text-base"
                                >
                                    Academic
                                </TabsTrigger>
                                <TabsTrigger
                                    value="contact"
                                    className="data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:font-bold text-sm md:text-base"
                                >
                                    Contact
                                </TabsTrigger>
                                <TabsTrigger
                                    value="settings"
                                    className="data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:font-bold text-sm md:text-base"
                                >
                                    Settings
                                </TabsTrigger>
                            </TabsList>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                                    {/* Personal Information Tab */}
                                    <TabsContent value="personal" className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Camera className="h-5 w-5" />
                                                    Profile Information
                                                </CardTitle>
                                                <CardDescription>
                                                    Basic student profile and personal details
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                {/* Profile Image */}
                                                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                                                    <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                                                        {profileImageUrl ? (
                                                            <>
                                                                <Image
                                                                    src={profileImageUrl}
                                                                    alt="Profile"
                                                                    width={96}
                                                                    height={96}
                                                                    className="object-cover"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={clearImage}
                                                                    className="absolute top-0 right-0 bg-red-500 p-1 rounded-full"
                                                                >
                                                                    <X className="h-3 w-3 text-white" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full bg-muted">
                                                                <Camera className="h-8 w-8 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <Label htmlFor="profileImage" className="text-sm font-medium">
                                                            Profile Image
                                                        </Label>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => document.getElementById('profileImage')?.click()}
                                                            >
                                                                <Upload className="h-4 w-4 mr-2" />
                                                                Upload Image
                                                            </Button>
                                                            <input
                                                                id="profileImage"
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleImageChange}
                                                                className="hidden"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Name and Email */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="name"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Full Name</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Enter full name" {...field} />
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
                                                                    <Input placeholder="Enter email address" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                {/* Password */}
                                                <div className="flex flex-col sm:flex-row items-center gap-2">
                                                    <FormField
                                                        control={form.control}
                                                        name="password"
                                                        render={({ field }) => (
                                                            <FormItem className="flex-1">
                                                                <FormLabel>Password</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="password"
                                                                        placeholder="Enter password"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={generateNewPassword}
                                                        className="mt-4 sm:mt-8 w-full sm:w-auto"
                                                    >
                                                        Generate
                                                    </Button>
                                                </div>

                                                {/* Personal Details */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="dateOfBirth"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Date of Birth</FormLabel>
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <FormControl>
                                                                            <Button
                                                                                variant="outline"
                                                                                className={cn(
                                                                                    "w-full pl-3 text-left font-normal",
                                                                                    !field.value && "text-muted-foreground"
                                                                                )}
                                                                            >
                                                                                {field.value ? (
                                                                                    format(field.value, "PPP")
                                                                                ) : (
                                                                                    <span>Pick a date</span>
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
                                                                                date > new Date() || date < new Date("1900-01-01")
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
                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select gender" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        {genderOptions.map((option) => (
                                                                            <SelectItem key={option.value} value={option.value}>
                                                                                {option.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="religion"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Religion</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Enter religion" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="bloodGroup"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Blood Group</FormLabel>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select blood group" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        {bloodGroupOptions.map((option) => (
                                                                            <SelectItem key={option.value} value={option.value}>
                                                                                {option.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* Academic Information Tab */}
                                    <TabsContent value="academic" className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <CalendarIcon className="h-5 w-5" />
                                                    Academic Information
                                                </CardTitle>
                                                <CardDescription>
                                                    Academic details and class assignment
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="admissionDate"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Admission Date</FormLabel>
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <FormControl>
                                                                            <Button
                                                                                variant="outline"
                                                                                className={cn(
                                                                                    "w-full pl-3 text-left font-normal",
                                                                                    !field.value && "text-muted-foreground"
                                                                                )}
                                                                            >
                                                                                {field.value ? (
                                                                                    format(field.value, "PPP")
                                                                                ) : (
                                                                                    <span>Pick a date</span>
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
                                                                                date > new Date() || date < new Date("1900-01-01")
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
                                                        name="departmentId"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Department</FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select department" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="none">No Department</SelectItem>
                                                                        {departments.map((dept) => (
                                                                            <SelectItem key={dept.id} value={dept.id}>
                                                                                {dept.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="levelId"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>School Level</FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select level" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="none">No Level</SelectItem>
                                                                        {levels.map((level) => (
                                                                            <SelectItem key={level.id} value={level.id}>
                                                                                {level.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="classId"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Class</FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select class" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="none">No Class</SelectItem>
                                                                        {filteredClasses.map((cls) => (
                                                                            <SelectItem key={cls.id} value={cls.id}>
                                                                                {cls.name} {cls.section && `(${cls.section})`}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="sessionId"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Academic Session</FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select session" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        {sessions.map((session) => (
                                                                            <SelectItem key={session.id} value={session.id}>
                                                                                {session.name}
                                                                                {session.isCurrent && (
                                                                                    <Badge variant="secondary" className="ml-2">
                                                                                        Current
                                                                                    </Badge>
                                                                                )}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="rollNumber"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Roll Number</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Enter roll number" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* Contact Information Tab */}
                                    <TabsContent value="contact" className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Mail className="h-5 w-5" />
                                                    Contact Information
                                                </CardTitle>
                                                <CardDescription>
                                                    Address and contact details
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <FormField
                                                    control={form.control}
                                                    name="phone"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Phone Number</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Enter phone number" {...field} />
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
                                                                <Textarea
                                                                    placeholder="Enter full address"
                                                                    className="resize-none"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="city"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>City</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Enter city" {...field} />
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
                                                                    <Input placeholder="Enter state" {...field} />
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
                                                                    <Input placeholder="Enter country" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* Settings Tab */}
                                    <TabsContent value="settings" className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Send className="h-5 w-5" />
                                                    Email Settings
                                                </CardTitle>
                                                <CardDescription>
                                                    Configure email notifications for the student
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-0.5">
                                                        <Label>Send Login Credentials</Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            Send login credentials to the student's email address
                                                        </p>
                                                    </div>
                                                    <FormField
                                                        control={form.control}
                                                        name="sendCredentials"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Switch
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                        className="data-[state=checked]:bg-primary-custom data-[state=unchecked]:bg-gray-400"
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <Separator />

                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-0.5">
                                                        <Label>Send Welcome Email</Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            Send a welcome email with school information
                                                        </p>
                                                    </div>
                                                    <FormField
                                                        control={form.control}
                                                        name="sendWelcomeEmail"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Switch
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                        className="data-[state=checked]:bg-primary-custom data-[state=unchecked]:bg-gray-400"
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <SheetFooter className="flex flex-col sm:flex-row gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => onOpenChange(false)}
                                            className="w-full sm:w-auto"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isLoading || isSendingCredentials}
                                            className="w-full sm:w-auto"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    {studentToEdit ? "Updating..." : "Adding..."}
                                                </>
                                            ) : isSendingCredentials ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Sending Credentials...
                                                </>
                                            ) : (
                                                studentToEdit ? "Update Student" : "Add Student"
                                            )}
                                        </Button>
                                    </SheetFooter>
                                </form>
                            </Form>
                        </Tabs>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
} 