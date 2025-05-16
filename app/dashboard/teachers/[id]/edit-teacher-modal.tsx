"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { UserRole } from "@prisma/client"

interface Department {
    id: string
    name: string
}

interface TeacherData {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
    phone: string | null;
    employeeId: string | null;
    qualifications: string | null;
    specialization: string | null;
    joiningDate: Date | null;
    departmentId: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    dateOfBirth: Date | null;
    gender: string | null;
    emergencyContact: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: {
        id: string;
        name: string;
        email: string;
        profileImage: string | null;
    };
    department?: Department;
    stats: {
        totalClasses: number;
        totalStudents: number;
        totalSubjects: number;
    };
    subjects: Array<{
        id: string;
        name: string;
        code: string;
        department: Department;
    }>;
    classes: Array<{
        id: string;
        name: string;
        section: string;
        level: {
            id: string;
            name: string;
        };
        studentCount: number;
    }>;
}

interface EditTeacherModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teacher: TeacherData;
    departments: Department[];
}

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    phone: z.string().optional(),
    employeeId: z.string().optional(),
    qualifications: z.string().optional(),
    specialization: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER", "none"]).optional(),
    departmentId: z.string().optional(),
})

export function EditTeacherModal({
    open,
    onOpenChange,
    teacher,
    departments,
}: EditTeacherModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: teacher.name,
            email: teacher.email,
            phone: teacher.phone || undefined,
            employeeId: teacher.employeeId || undefined,
            qualifications: teacher.qualifications || undefined,
            specialization: teacher.specialization || undefined,
            gender: "none", // Will need to add back to interface if needed
            departmentId: teacher.department?.id || "none",
        },
    })

    // Force form reset when teacher data changes
    useEffect(() => {
        form.reset({
            name: teacher.name,
            email: teacher.email,
            phone: teacher.phone || undefined,
            employeeId: teacher.employeeId || undefined,
            qualifications: teacher.qualifications || undefined,
            specialization: teacher.specialization || undefined,
            gender: "none", // Will need to add back to interface if needed
            departmentId: teacher.department?.id || "none",
        });
    }, [teacher, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsLoading(true)

            // Convert "none" values to null
            const formData = {
                ...values,
                gender: values.gender === "none" ? null : values.gender,
                departmentId: values.departmentId === "none" ? null : values.departmentId
            }

            const response = await fetch(`/api/teachers/${teacher.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                const error = await response.text()
                throw new Error(error || "Failed to update teacher")
            }

            toast.success("Teacher updated successfully")
            router.refresh()
            onOpenChange(false)
        } catch (error) {
            console.error("Failed to update teacher:", error)
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("An unexpected error occurred")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Teacher</DialogTitle>
                    <DialogDescription>
                        Update the teacher's information.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
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
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="employeeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Employee ID</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gender</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value || "none"}
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
                                name="departmentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Department</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value || "none"}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select department" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="qualifications"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Qualifications</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                value={field.value || ""}
                                                className="resize-none"
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="specialization"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Specialization</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                value={field.value || ""}
                                                className="resize-none"
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
} 