"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { toast } from "sonner";
import {
    Department,
    Class,
    User,
    AcademicSession,
    StudentClass
} from "@prisma/client";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

interface StudentWithRelations extends User {
    department: Department | null;
    studentClass: (StudentClass & {
        class: Class;
        session: AcademicSession;
    })[];
}

const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
];

const formSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    phone: z.string().optional(),
    address: z.string().optional(),
    dateOfBirth: z.date().optional(),
    gender: z.string().optional(),
    religion: z.string().optional(),
    rollNumber: z.string().optional(),
    departmentId: z.string().optional(),
    classId: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
});

interface StudentFormProps {
    student?: StudentWithRelations;
    departments: Department[];
    classes: Class[];
    currentSession: AcademicSession | null;
    isEdit?: boolean;
}

export function StudentForm({
    student,
    departments,
    classes,
    currentSession,
    isEdit = false,
}: StudentFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
        student?.profileImage || null
    );

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: student?.name || "",
            email: student?.email || "",
            phone: student?.phone || "",
            address: student?.address || "",
            dateOfBirth: student?.dateOfBirth ? new Date(student.dateOfBirth) : undefined,
            gender: student?.gender || undefined,
            religion: student?.religion || undefined,
            rollNumber: student?.studentClass[0]?.rollNumber || "",
            departmentId: student?.department?.id || undefined,
            classId: student?.studentClass[0]?.classId || undefined,
            state: student?.state || "",
            city: student?.city || "",
            country: student?.country || "",
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

    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            try {
                const formData = new FormData();

                // Append all form values
                Object.entries(values).forEach(([key, value]) => {
                    if (value !== undefined) {
                        if (key === 'dateOfBirth' && value) {
                            formData.append(key, (value as Date).toISOString());
                        } else {
                            formData.append(key, value as string);
                        }
                    }
                });

                // Append the profile image if it exists
                if (profileImage) {
                    formData.append('profileImage', profileImage);
                }

                // Add the current session ID if it exists
                if (currentSession) {
                    formData.append('sessionId', currentSession.id);
                }

                const url = isEdit
                    ? `/api/students/${student?.id}`
                    : '/api/students';

                const method = isEdit ? 'PATCH' : 'POST';

                const response = await fetch(url, {
                    method,
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to save student');
                }

                toast.success(`Student ${isEdit ? 'updated' : 'created'} successfully`);
                router.push('/dashboard/students');
                router.refresh();
            } catch (error) {
                console.error('Error submitting form:', error);
                toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
            }
        });
    }

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
                                    {student?.name?.charAt(0) || "?"}
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
                                            <FormLabel>Roll Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 101" {...field} />
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