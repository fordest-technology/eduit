"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { ResponsiveSheet } from "@/components/ui/responsive-sheet"
import { Sparkles } from "lucide-react"
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
import { Loader2 } from "lucide-react"
import { UserRole } from "@prisma/client"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    role: z.nativeEnum(UserRole),
    schoolId: z.string().optional(),
    gender: z.string().optional(),
    dateOfBirth: z.string().optional(),
    religion: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
})

interface AddUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialRole?: UserRole | null
    user?: {
        id: string
        name: string
        email: string
        role: UserRole
        schoolId?: string | null
        gender?: string
        dateOfBirth?: string
        religion?: string
        address?: string
        phone?: string
        country?: string
        city?: string
        state?: string
    }
    onSuccess?: () => void
}

export function AddUserDialog({
    open,
    onOpenChange,
    initialRole,
    user,
    onSuccess,
}: AddUserDialogProps) {
    const [loading, setLoading] = useState(false)
    const [schools, setSchools] = useState<any[]>([])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: user?.name || "",
            email: user?.email || "",
            password: "",
            role: user?.role || initialRole || UserRole.STUDENT,
            schoolId: user?.schoolId || undefined,
            gender: user?.gender || "",
            dateOfBirth: user?.dateOfBirth || "",
            religion: user?.religion || "",
            address: user?.address || "",
            phone: user?.phone || "",
            country: user?.country || "",
            city: user?.city || "",
            state: user?.state || "",
        },
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setLoading(true)
            const url = user ? `/api/users/${user.id}` : "/api/users"
            const method = user ? "PUT" : "POST"

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            })

            if (!response.ok) {
                throw new Error(user ? "Failed to update user" : "Failed to create user")
            }

            toast.success(user ? "User updated successfully" : "User created successfully")
            onSuccess?.()
            onOpenChange(false)
            form.reset()
        } catch (error) {
            console.error("Error saving user:", error)
            toast.error(user ? "Failed to update user" : "Failed to create user")
        } finally {
            setLoading(false)
        }
    }

    const generatePassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
        let password = ""
        for (let i = 0; i < 10; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        form.setValue("password", password)
    }

    return (
        <ResponsiveSheet 
            open={open} 
            onOpenChange={onOpenChange}
            title={user ? "Faculty Record Synchronization" : "Personnel Onboarding"}
            description={user ? "Update credentials and security parameters for this institutional member." : "Provision a new academic or administrative account for your institution."}
            className="sm:max-w-2xl"
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Legal Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter user's name" {...field} className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all" />
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
                                        <Input placeholder="Enter user's email" type="email" {...field} className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">{user ? "Security Credential (Update)" : "Security Credential"}</FormLabel>
                                    <div className="flex gap-2">
                                        <FormControl>
                                            <PasswordInput placeholder="Enter password" {...field} className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all flex-1" />
                                        </FormControl>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            className="h-14 px-4 rounded-2xl border-dashed border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50"
                                            onClick={generatePassword}
                                        >
                                            Renew
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional Rank</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={!!initialRole}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all">
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                                            <SelectItem value={UserRole.SCHOOL_ADMIN} className="font-bold">School Admin</SelectItem>
                                            <SelectItem value={UserRole.TEACHER} className="font-bold">Teacher</SelectItem>
                                            <SelectItem value={UserRole.STUDENT} className="font-bold">Student</SelectItem>
                                            <SelectItem value={UserRole.PARENT} className="font-bold">Parent</SelectItem>
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
                            name="gender"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gender Identity</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all">
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
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
                            name="dateOfBirth"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Birth Registry</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all uppercase" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="religion"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Faith / Religion</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter religion" {...field} className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Direct Contact Line</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter phone number" {...field} className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Residential Address</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter full address" {...field} className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nationality</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Country" {...field} className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Administrative State</FormLabel>
                                    <FormControl>
                                        <Input placeholder="State" {...field} className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Metropolis / City</FormLabel>
                                    <FormControl>
                                        <Input placeholder="City" {...field} className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-50">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:text-slate-800"
                        >
                            Discard
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            {user ? "Sync Member Record" : "Finalize Onboarding"}
                        </Button>
                    </div>
                </form>
            </Form>
        </ResponsiveSheet>
    )
} 
