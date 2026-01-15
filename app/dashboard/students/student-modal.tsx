"use client"

import { useState, useEffect } from "react"
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
    SheetTrigger,
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
import { PasswordInput } from "@/components/ui/password-input"
import { Button } from "@/components/ui/button"
import { Loader2, User, Phone, Mail, Calendar, Home, MapPin, GraduationCap } from "lucide-react"
import { User as PrismaUser } from "@prisma/client"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import ImageUpload from "@/components/image-upload"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const formSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters long" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }).optional().or(z.literal("")),
    password: z.string().min(6).optional().or(z.literal("")),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    dateOfBirth: z.date().optional(),
    address: z.string().optional().or(z.literal("")),
    city: z.string().optional().or(z.literal("")),
    state: z.string().optional().or(z.literal("")),
    country: z.string().optional().or(z.literal("")),
    religion: z.string().optional().or(z.literal("")),
    departmentId: z.string().optional().or(z.literal("")),
    profileImage: z.string().optional().or(z.literal("")),
})

type FormValues = z.infer<typeof formSchema>

interface Department {
    id: string
    name: string
}

// Extended student type including all the fields we need
interface StudentWithDetails {
    id: string
    name: string
    email: string
    profileImage?: string | null
    phone?: string | null
    gender?: string | null
    dateOfBirth?: Date | string | null
    address?: string | null
    city?: string | null
    state?: string | null
    country?: string | null
    religion?: string | null
    department?: Department | null
}

interface StudentModalProps {
    student?: StudentWithDetails;
    departments: Department[];
    trigger?: React.ReactNode;
    onSuccess?: () => void;
    isOpen?: boolean;
}

export default function StudentModal({
    student,
    departments,
    trigger,
    onSuccess,
    isOpen
}: StudentModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [open, setOpen] = useState(isOpen || false)
    const [activeTab, setActiveTab] = useState("personal")
    const router = useRouter()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            password: "",
            gender: "MALE" as const,
            dateOfBirth: undefined,
            address: "",
            city: "",
            state: "",
            country: "",
            religion: "",
            departmentId: Array.isArray(departments) && departments.length > 0 ? departments[0]?.id : "no-department",
            profileImage: "",
        },
    })

    // Update open state when isOpen prop changes
    useEffect(() => {
        if (isOpen !== undefined) {
            setOpen(isOpen);
        }
    }, [isOpen]);

    // Notify parent component when dialog is closed via the UI
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen && onSuccess) {
            onSuccess();
        }
    };

    useEffect(() => {
        if (student) {
            form.reset({
                name: student.name || "",
                email: student.email || "",
                phone: student.phone || "",
                password: "", // Don't populate password
                gender: (student.gender as "MALE" | "FEMALE" | "OTHER") || "MALE",
                dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : undefined,
                address: student.address || "",
                city: student.city || "",
                state: student.state || "",
                country: student.country || "",
                religion: student.religion || "",
                departmentId: student.department?.id || (Array.isArray(departments) && departments.length > 0 ? departments[0].id : "no-department"),
                profileImage: student.profileImage || "",
            });
        }
    }, [student, departments, form]);

    const onSubmit = async (values: FormValues) => {
        try {
            setIsLoading(true)

            // Create FormData for image upload
            const formData = new FormData();
            Object.keys(values).forEach(key => {
                const value = values[key as keyof typeof values];

                // Skip empty password
                if (key === 'password' && (!value || value === '')) {
                    return;
                }

                // Handle date properly
                if (key === 'dateOfBirth' && value) {
                    formData.append(key, (value as Date).toISOString());
                } else if (value !== undefined && value !== null && value !== '') {
                    formData.append(key, String(value));
                }
            });

            const response = await fetch(`/api/students/${student?.id}`, {
                method: "PATCH",
                body: formData,
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Failed to update student")
            }

            toast.success("Student updated successfully")
            setOpen(false)
            if (onSuccess) {
                onSuccess()
            }
            router.refresh()
        } catch (error) {
            console.error("Error updating student:", error)
            const errorMessage = error instanceof Error ? error.message : "Failed to update student"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
                {trigger || <Button>Edit Student</Button>}
            </SheetTrigger>
            <SheetContent className="sm:max-w-2xl w-full overflow-y-auto" side="right">
                <SheetHeader className="px-6 pt-6 pb-2">
                    <SheetTitle className="text-2xl font-bold">Edit Student Profile</SheetTitle>
                    <SheetDescription className="text-muted-foreground">
                        Update student information and academic details
                    </SheetDescription>
                </SheetHeader>

                <Separator className="my-2" />

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-6 pb-6">
                        {/* Profile Image at the top */}
                        <div className="flex justify-center -mt-2 mb-4">
                            <FormField
                                control={form.control}
                                name="profileImage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <ImageUpload
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                label="Upload profile image"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid grid-cols-3 mb-6">
                                <TabsTrigger value="personal" className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Personal Info
                                </TabsTrigger>
                                <TabsTrigger value="contact" className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    Contact Info
                                </TabsTrigger>
                                <TabsTrigger value="academic" className="flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4" />
                                    Academic Info
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="personal" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name */}
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name*</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Enter full name" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Gender */}
                                    <FormField
                                        control={form.control}
                                        name="gender"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gender*</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select gender" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="MALE">Male</SelectItem>
                                                        <SelectItem value="FEMALE">Female</SelectItem>
                                                        <SelectItem value="OTHER">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Date of Birth */}
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
                                                                className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"
                                                                    }`}
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
                                                        <CalendarComponent
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

                                    {/* Religion */}
                                    <FormField
                                        control={form.control}
                                        name="religion"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Religion</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Enter religion" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="contact" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Email */}
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email*</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="email" placeholder="Enter email" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Phone */}
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Enter phone number" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Address */}
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Address</FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} placeholder="Enter address" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* City */}
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Enter city" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* State */}
                                    <FormField
                                        control={form.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>State/Province</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Enter state/province" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Country */}
                                    <FormField
                                        control={form.control}
                                        name="country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Country</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Enter country" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="academic" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Department */}
                                    <FormField
                                        control={form.control}
                                        name="departmentId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Department</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select department" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {Array.isArray(departments) && departments.length > 0 ? (
                                                            departments.map((dept) => (
                                                                <SelectItem key={dept.id} value={dept.id}>
                                                                    {dept.name}
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <SelectItem value="no-department">No departments available</SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Password */}
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password (leave empty to keep current)</FormLabel>
                                                <FormControl>
                                                    <PasswordInput {...field} placeholder="New password" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>

                        <Separator className="my-4" />

                        <SheetFooter className="px-0 gap-2 mt-6">
                            <Button variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading} className="gap-2">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <User className="h-4 w-4" />
                                        Update Student
                                    </>
                                )}
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
} 