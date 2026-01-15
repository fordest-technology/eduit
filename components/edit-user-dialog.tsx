"use client"

import { useState } from "react"
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
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[540px] w-full overflow-y-auto" side="right">
                <SheetHeader className="mb-6">
                    <SheetTitle>Edit User</SheetTitle>
                    <SheetDescription>
                        Update user information and settings.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter user's name" {...field} />
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
                                        <Input placeholder="Enter user's email" type="email" {...field} />
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
                                    <FormLabel>Password (leave blank to keep current)</FormLabel>
                                    <FormControl>
                                        <PasswordInput placeholder="Enter new password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={UserRole.SCHOOL_ADMIN}>School Admin</SelectItem>
                                            <SelectItem value={UserRole.TEACHER}>Teacher</SelectItem>
                                            <SelectItem value={UserRole.STUDENT}>Student</SelectItem>
                                            <SelectItem value={UserRole.PARENT}>Parent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <SheetFooter className="pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update User
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
} 