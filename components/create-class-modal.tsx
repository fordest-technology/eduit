"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
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

const formSchema = z.object({
    name: z.string().min(1, "Class name is required"),
    section: z.string().optional(),
    teacherId: z.string().optional(),
    levelId: z.string().optional(),
});

interface Teacher {
    id: string;
    user: {
        name: string;
        email: string;
        profileImage: string | null;
    };
    department: {
        id: string;
        name: string;
    } | null;
    specialization: string | null;
}

interface SchoolLevel {
    id: string;
    name: string;
}

interface CreateClassModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreateClassModal({
    open,
    onOpenChange,
    onSuccess,
}: CreateClassModalProps) {
    const [loading, setLoading] = useState(false);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [levels, setLevels] = useState<SchoolLevel[]>([]);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            section: "",
            teacherId: "",
            levelId: "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                name: "",
                section: "",
                teacherId: "",
                levelId: "",
            });
            fetchTeachers();
            fetchLevels();
            setError(null);
        }
    }, [open, form]);

    const fetchTeachers = async () => {
        try {
            const response = await fetch("/api/teachers/available");
            if (!response.ok) {
                throw new Error("Failed to fetch teachers");
            }
            const data = await response.json();
            setTeachers(data.teachers || []);
        } catch (error) {
            console.error("Error fetching teachers:", error);
            toast.error("Failed to load teachers");
        }
    };

    const fetchLevels = async () => {
        try {
            const response = await fetch("/api/school-levels");
            if (!response.ok) {
                throw new Error("Failed to fetch school levels");
            }
            const data = await response.json();
            const formattedLevels = Array.isArray(data)
                ? data.map(level => ({
                    id: level.id,
                    name: level.name
                }))
                : [];
            setLevels(formattedLevels);
        } catch (error) {
            console.error("Error fetching school levels:", error);
            toast.error("Failed to load school levels");
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch("/api/classes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const data = await response.json();
                if (data.errors) {
                    // Handle validation errors
                    data.errors.forEach((err: { field: string; message: string }) => {
                        form.setError(err.field as any, {
                            type: "manual",
                            message: err.message,
                        });
                    });
                    throw new Error("Validation failed");
                }
                throw new Error(data.error || "Failed to create class");
            }

            toast.success("Class created successfully");
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error("Error creating class:", error);
            setError(error instanceof Error ? error.message : "Failed to create class");
            toast.error("Failed to create class");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Class</DialogTitle>
                    <DialogDescription>
                        Add a new class to your school. Fill in the details below.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Class Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter class name"
                                            {...field}
                                            disabled={loading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="section"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Section (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter section"
                                            {...field}
                                            disabled={loading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="levelId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>School Level</FormLabel>
                                    <Select
                                        disabled={loading}
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a level" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {levels.map((level) => (
                                                <SelectItem
                                                    key={level.id}
                                                    value={level.id}
                                                >
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
                            name="teacherId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teacher</FormLabel>
                                    <Select
                                        disabled={loading}
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a teacher" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {teachers.map((teacher) => (
                                                <SelectItem
                                                    key={teacher.id}
                                                    value={teacher.id}
                                                >
                                                    {teacher.user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {error && (
                            <div className="text-sm text-destructive">{error}</div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Create Class
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
} 