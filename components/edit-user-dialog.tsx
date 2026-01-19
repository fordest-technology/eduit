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
})

interface EditUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: {
        id: string
        name: string
        email: string
        role: UserRole
        schoolId?: string | null
    }
    onSuccess?: () => void
}

export function EditUserDialog({
    open,
    onOpenChange,
    user,
    onSuccess,
}: EditUserDialogProps) {
    const [loading, setLoading] = useState(false)
    const [schools, setSchools] = useState<any[]>([])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: user.name,
            email: user.email,
            password: "",
            role: user.role,
            schoolId: user.schoolId || undefined,
        },
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setLoading(true)
            const response = await fetch(`/api/users/${user.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            })

            if (!response.ok) {
                throw new Error("Failed to update user")
            }

            toast.success("User updated successfully")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Error updating user:", error)
            toast.error("Failed to update user")
        } finally {
            setLoading(false)
        }
    }

    return (
        <ResponsiveSheet 
            open={open} 
            onOpenChange={onOpenChange}
            title="Profile Synchronization"
            description="Update the academic and security credentials for this institutional member."
            className="sm:max-w-xl"
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Credential (Update)</FormLabel>
                                <FormControl>
                                    <PasswordInput placeholder="Leave blank to maintain current" {...field} className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all" />
                                </FormControl>
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
                            Sync Member Profile
                        </Button>
                    </div>
                </form>
            </Form>
        </ResponsiveSheet>
    )
} 
