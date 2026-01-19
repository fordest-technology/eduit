"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ResponsiveSheet } from "@/components/ui/responsive-sheet"
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
        <ResponsiveSheet 
            open={open} 
            onOpenChange={onOpenChange}
            title="Edit Faculty Record"
            description="Update the personal and professional credentials for this educator."
            className="sm:max-w-xl"
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Legal Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional Email</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Number</FormLabel>
                                    <FormControl>
                                        <Input {...field} value={field.value || ""} className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="employeeId"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Faculty ID</FormLabel>
                                    <FormControl>
                                        <Input {...field} value={field.value || ""} className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all uppercase" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gender Identity</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || "none"}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all">
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                                            <SelectItem value="none" className="font-bold">Not specified</SelectItem>
                                            <SelectItem value="MALE" className="font-bold">Male</SelectItem>
                                            <SelectItem value="FEMALE" className="font-bold">Female</SelectItem>
                                            <SelectItem value="OTHER" className="font-bold">Other</SelectItem>
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
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Academic Department</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || "none"}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all">
                                                <SelectValue placeholder="Select department" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                                            <SelectItem value="none" className="font-bold">General Faculty</SelectItem>
                                            {departments.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id} className="font-bold">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="qualifications"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Academic Credentials</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            value={field.value || ""}
                                            className="resize-none rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-sm font-medium transition-all p-4"
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
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expertise / Domain</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            value={field.value || ""}
                                            className="resize-none rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-sm font-medium transition-all p-4"
                                            rows={3}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-50">
                        <Button 
                            variant="ghost" 
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:text-slate-800"
                        >
                            Discard
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                            Sync Faculty Record
                        </Button>
                    </div>
                </form>
            </Form>
        </ResponsiveSheet>
    )
} 
