"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { BookOpen, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Subject name must be at least 2 characters.",
    }),
    code: z.string().optional(),
    description: z.string().optional(),
    departmentId: z.string().optional(),
    levelId: z.string({
        required_error: "Please select a level.",
    }),
    autoAssignClasses: z.boolean().default(true),
    autoAssignStudents: z.boolean().default(true),
})

interface SubjectsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    departments: {
        id: string
        name: string
    }[]
    levels: {
        id: string
        name: string
    }[]
}

export function SubjectsDialog({
    open,
    onOpenChange,
    departments,
    levels,
}: SubjectsDialogProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            code: "",
            description: "",
            autoAssignClasses: true,
            autoAssignStudents: true,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)

        try {
             const response = await fetch("/api/subjects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                 const error = await response.json();
                 throw new Error(error.message || "Failed to create subject");
            }
            
            toast.success("Subject created successfully");
            form.reset();
            router.refresh();
            onOpenChange(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create subject");
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <ResponsiveModal 
            open={open} 
            onOpenChange={onOpenChange}
            title="Add New Subject"
            description="Create a new specific subject and assign it to a level."
        >
             <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto pr-2 pb-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            
                            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-6">
                                <div className="flex items-start gap-3">
                                    <BookOpen className="h-5 w-5 text-indigo-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-indigo-900 text-sm">Automated Assignment</h4>
                                        <p className="text-xs text-indigo-700 mt-1">
                                            Subjects will be automatically assigned to all classes in the selected level.
                                            If a department is selected, only students in that department will be enrolled.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subject Name <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input disabled={isLoading} placeholder="e.g. Physics" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subject Code (Optional)</FormLabel>
                                            <FormControl>
                                                <Input disabled={isLoading} placeholder="e.g. PHY101" {...field} />
                                            </FormControl>
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
                                            <FormLabel>Level <span className="text-red-500">*</span></FormLabel>
                                            <Select disabled={isLoading} onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Level" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {levels.map((level) => (
                                                        <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
                                                    ))}
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
                                            <FormLabel>Department (Optional)</FormLabel>
                                            <Select disabled={isLoading} onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="All Departments" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                     {departments.map((department) => (
                                                        <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription className="text-xs">
                                                Leave empty for general subjects (e.g. English, Math)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                disabled={isLoading}
                                                placeholder="Enter subject description..."
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                             <div className="space-y-4 pt-4 border-t">
                                <FormField
                                    control={form.control}
                                    name="autoAssignClasses"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-slate-50">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Auto-assign to Classes</FormLabel>
                                                <FormDescription>
                                                    Automatically adds this subject to all classes in the selected level.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="autoAssignStudents"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-slate-50">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Auto-enroll Students</FormLabel>
                                                <FormDescription>
                                                    Enroll all eligible students (matching level & department).
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                        </form>
                    </Form>
                </div>
                 <div className="pt-4 border-t mt-4 flex justify-end gap-3">
                     <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                     <Button 
                        onClick={form.handleSubmit(onSubmit)} 
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                     >
                        {isLoading ? "Creating..." : "Create Subject"}
                     </Button>
                </div>
             </div>
        </ResponsiveModal>
    )
}