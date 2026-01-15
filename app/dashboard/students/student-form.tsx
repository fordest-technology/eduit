"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as z from "zod";
import { Student, Class, Department, StudentClass, AcademicSession } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import Image from "next/image";

interface StudentWithUser extends Omit<Student, 'user'> {
    user: {
        id: string;
        name: string;
        email: string;
        profileImage?: string | null;
    };
    studentClass: Array<StudentClass & {
        class: Class & {
            level: { name: string };
        };
        session: AcademicSession;
    }>;
}

interface StudentFormProps {
    student?: StudentWithUser;
    classes?: (Class & {
        level: { name: string };
    })[];
    departments?: Department[];
    currentSession?: { id: string };
}

const genderOptions = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
];

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

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    password: z.string().min(6, {
        message: "Password must be at least 6 characters.",
    }).optional(),
    departmentId: z.string().optional(),
    classId: z.string().optional(),
    rollNumber: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER", "none"], {
        required_error: "Please select a gender",
    }).optional(),
    dateOfBirth: z.date().optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, {
        message: "Please enter a valid phone number"
    }).optional(),
    address: z.string().max(255, {
        message: "Address must not exceed 255 characters"
    }).optional(),
    city: z.string().max(100, {
        message: "City must not exceed 100 characters"
    }).optional(),
    state: z.string().max(100, {
        message: "State must not exceed 100 characters"
    }).optional(),
    country: z.string().max(100, {
        message: "Country must not exceed 100 characters"
    }).optional(),
    bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
        required_error: "Please select a blood group",
    }).optional(),
    religion: z.string().max(50, {
        message: "Religion must not exceed 50 characters"
    }).optional(),
    profileImage: z.any().optional(),
});

export const StudentForm = ({
    student,
    classes = [],
    departments = [],
    currentSession,
}: StudentFormProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
        student?.user?.profileImage || null
    );
    const isEdit = !!student;

    // Initialize form with default values
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: student?.user?.name || "",
            email: student?.user?.email || "",
            phone: student?.phone || "",
            address: student?.address || "",
            dateOfBirth: student?.dateOfBirth ? new Date(student.dateOfBirth) : undefined,
            gender: (student?.gender as "MALE" | "FEMALE" | "OTHER" | "none") || "none",
            religion: student?.religion || "",
            rollNumber: student?.studentClass?.[0]?.rollNumber || "",
            departmentId: student?.departmentId || undefined,
            classId: student?.studentClass?.[0]?.classId || undefined,
            state: student?.state || "",
            city: student?.city || "",
            country: student?.country || "",
            bloodGroup: (student?.bloodGroup as "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-") || undefined,
        },
    });

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImage(file);
            const imageUrl = URL.createObjectURL(file);
            setProfileImageUrl(imageUrl);
        }
    }

    function clearImage() {
        setProfileImage(null);
        setProfileImageUrl(null);
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setIsLoading(true);
            await new Promise<void>((resolve, reject) => {
                startTransition(async () => {
                    try {
                        // Remove undefined values and convert dates to ISO strings
                        const cleanedValues = Object.entries(values).reduce((acc, [key, value]) => {
                            if (value !== undefined) {
                                if (value instanceof Date) {
                                    acc[key] = value.toISOString();
                                } else if (!(value instanceof File)) {
                                    acc[key] = value;
                                }
                            }
                            return acc;
                        }, {} as Record<string, any>);

                        // Handle file upload if present
                        if (profileImage) {
                            const formData = new FormData();
                            formData.append('profileImage', profileImage);

                            // Upload profile image first
                            const uploadResponse = await fetch('/api/upload', {
                                method: 'POST',
                                body: formData
                            });

                            if (!uploadResponse.ok) {
                                throw new Error('Failed to upload profile image');
                            }

                            const { url } = await uploadResponse.json();
                            cleanedValues.profileImage = url;
                        }

                        // Add current session if available
                        if (currentSession) {
                            cleanedValues.sessionId = currentSession.id;
                        }

                        const response = await fetch(
                            isEdit ? `/api/students/${student?.id}` : '/api/students',
                            {
                                method: isEdit ? 'PATCH' : 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(cleanedValues),
                            }
                        );

                        if (!response.ok) {
                            const error = await response.text();
                            throw new Error(error || 'Failed to save student');
                        }

                        toast.success(
                            isEdit ? 'Student updated successfully' : 'Student created successfully'
                        );
                        router.refresh();
                        router.push('/dashboard/students');
                        resolve();
                    } catch (error) {
                        console.error('Error:', error);
                        toast.error(error instanceof Error ? error.message : 'An error occurred');
                        reject(error);
                    }
                });
            });
        } catch (error) {
            console.error('Error:', error);
            toast.error(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const currentClassId = student?.studentClass[0]?.classId;
    const currentClass = classes.find((c) => c.id === currentClassId);

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>{isEdit ? "Edit Student" : "Add New Student"}</CardTitle>
                <CardDescription>
                    {isEdit
                        ? "Update the student information in the system."
                        : "Enter the details to add a new student to the system."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-6">
                    <div className="flex items-center gap-6">
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
                                        <X className="h-4 w-4 text-white" />
                                    </button>
                                </>
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    {student?.user?.name?.charAt(0) || "?"}
                                </div>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="profileImage">Profile Picture</Label>
                            <Input
                                id="profileImage"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="mt-1"
                            />
                        </div>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-medium">Basic Information</h3>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name *</FormLabel>
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
                                            <FormLabel>Email *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="john.doe@example.com" {...field} />
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
                                            <FormLabel>Phone Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+1234567890" {...field} />
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
                                                        disabled={(date: Date) =>
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

                            {/* Academic Information */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-medium">Academic Information</h3>

                                <FormField
                                    control={form.control}
                                    name="departmentId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Department</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select department" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
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

                                <FormField
                                    control={form.control}
                                    name="classId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Class</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select class" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {classes.map((cls) => (
                                                        <SelectItem key={cls.id} value={cls.id}>
                                                            {cls.name} {cls.section ? `(${cls.section})` : ""}
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
                                            <FormLabel>Roll Number (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 101 (Optional)" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="religion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Religion</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Christianity" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Contact Information */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                                <div className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. New York" {...field} />
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
                                                <FormLabel>State/Province</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. New York" {...field} />
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
                                                    <Input placeholder="e.g. United States" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        <CardFooter className="flex justify-between px-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Saving..." : isEdit ? "Update Student" : "Create Student"}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
} 