"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ResponsiveSheet } from "@/components/ui/responsive-sheet"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar, MoreHorizontal, Plus, AlertCircle, Trash2, Calendar as CalendarIcon } from "lucide-react"
import { useForm, useFieldArray } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { format, isValid, parseISO } from "date-fns"
import { useRouter } from "next/navigation"
import { DatePicker } from "@/components/ui/date-picker"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ColumnFiltersState } from "@tanstack/react-table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Calendar as DateCalendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { useEffect } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Define types for our data
interface School {
    id: string
    name: string
}

interface Session {
    id: string
    name: string
    startDate: string
    endDate: string
    isActive: boolean
    schoolId: string
    school: School
    resultConfigurations: {
        periods: {
            id: string
            name: string
            weight: number
        }[]
    }[]
    _count: {
        studentClasses: number
        attendance: number
        results: number
        classes: number
    }
    createdAt: string
    updatedAt: string
}

interface SessionsTableProps {
    initialSessions: Session[]
    schools: School[]
    userRole: string
    userSchoolId: string
}

// Define form schema
const formSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters" }),
    schoolId: z.string().min(1, { message: "School is required" }),
    startDate: z.date({ required_error: "Start date is required" }),
    endDate: z.date({ required_error: "End date is required" }),
    terms: z.array(z.object({
        name: z.string().min(1, { message: "Term name is required" })
    })).min(1, { message: "At least one term is required" })
}).refine(
    (data) => {
        return data.endDate > data.startDate;
    },
    {
        message: "End date must be after start date",
        path: ["endDate"],
    }
);

// Safely parse and format a date, handling various formats
function formatDate(dateValue: string | Date | null | undefined): string {
    if (!dateValue) return "N/A";

    let date: Date;
    if (typeof dateValue === 'string') {
        date = parseISO(dateValue);
    } else {
        date = dateValue;
    }

    return isValid(date) ? format(date, "MMM d, yyyy") : "N/A";
}

export function SessionsTable({ initialSessions, schools, userRole, userSchoolId }: SessionsTableProps) {
    const [sessions, setSessions] = useState<Session[]>(initialSessions)
    const [isLoading, setIsLoading] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [selectedSession, setSelectedSession] = useState<Session | null>(null)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    // Important: Keep internal state in sync with props from the parent
    useEffect(() => {
        if (initialSessions) {
            setSessions(initialSessions)
        }
    }, [initialSessions])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            schoolId: userRole === "school_admin" ? userSchoolId : "",
            startDate: new Date(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 10)),
            terms: [
                { name: "First Term" },
                { name: "Second Term" },
                { name: "Third Term" },
            ]
        }
    })

    const editForm = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            schoolId: "",
            startDate: new Date(),
            endDate: new Date(),
            terms: [{ name: "Standard Term" }] // Just a placeholder
        }
    })

    // Reset edit form when selected session changes
    useEffect(() => {
        if (selectedSession && isEditDialogOpen) {
            editForm.reset({
                name: selectedSession.name,
                schoolId: selectedSession.schoolId,
                startDate: new Date(selectedSession.startDate),
                endDate: new Date(selectedSession.endDate),
                terms: selectedSession.resultConfigurations?.[0]?.periods?.map(p => ({ name: p.name })) || [{ name: "First Term" }]
            })
        }
    }, [selectedSession, isEditDialogOpen, editForm])

    const { fields: termFields, append: appendTerm, remove: removeTerm } = useFieldArray({
        control: form.control,
        name: "terms",
    })

    async function toggleActive(id: string) {
        setIsLoading(true)
        try {
            const session = sessions.find(s => s.id === id)
            if (!session) throw new Error("Session not found")

            const response = await fetch(`/api/sessions/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ isCurrent: !session.isActive })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to update session")
            }

            const updatedSession = await response.json()
            setSessions(prev =>
                prev.map(s => s.id === id ? { ...s, isActive: updatedSession.isActive } : s)
            )
            toast.success(`Session ${!session.isActive ? "activated" : "deactivated"} successfully`)
        } catch (err: any) {
            toast.error(err.message || "Failed to update session status")
        } finally {
            setIsLoading(false)
        }
    }

    const columns = [
        {
            accessorKey: "name",
            header: "Session Name",
            cell: ({ row }: { row: any }) => (
                <div className="font-medium">{row.getValue("name")}</div>
            )
        },
        ...(userRole === "super_admin" ? [{
            accessorKey: "school.name",
            header: "School",
            cell: ({ row }: { row: any }) => (
                <div>{row.original.school.name}</div>
            )
        }] : []),
        {
            accessorKey: "startDate",
            header: "Start Date",
            cell: ({ row }: { row: any }) => {
                const session = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(session.startDate)}
                    </div>
                );
            }
        },
        {
            accessorKey: "_count.classes",
            header: "Total Classes",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                        {row.original._count?.classes || 0}
                    </Badge>
                </div>
            ),
        },
        {
            accessorKey: "_count.studentClasses",
            header: "Enrolled Students",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                        {row.original._count?.studentClasses || 0}
                    </Badge>
                </div>
            ),
        },
        {
            accessorKey: "endDate",
            header: "End Date",
            cell: ({ row }: { row: any }) => {
                const session = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(session.endDate)}
                    </div>
                );
            }
        },
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }: { row: any }) => {
                const session = row.original;
                const isActive = session.isActive || session.isCurrent;
                return (
                    <Badge
                        variant={isActive ? "default" : "secondary"}
                        className={isActive
                            ? "bg-green-600 hover:bg-green-700 text-white font-semibold"
                            : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                        }
                    >
                        {isActive ? "Active" : "Inactive"}
                    </Badge>
                )
            }
        },
        {
            accessorKey: "_count.studentClasses",
            header: "Classes",
            cell: ({ row }: { row: any }) => (
                <div>{row.original._count.studentClasses}</div>
            )
        },
        {
            id: "terms",
            header: "Terms",
            cell: ({ row }: { row: any }) => {
                const session = row.original
                const terms = session.resultConfigurations?.[0]?.periods || []
                return (
                    <div className="flex flex-wrap gap-1">
                        {terms.length > 0 ? (
                            terms.map((term: any) => (
                                <Badge key={term.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {term.name}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-[10px] text-muted-foreground italic">No terms set</span>
                        )}
                    </div>
                )
            }
        },
        {
            id: "actions",
            cell: ({ row }: { row: any }) => {
                const session = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => toggleActive(session.id)}>
                                {session.isActive ? "Set Inactive" : "Set Active"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                                setSelectedSession(session)
                                setIsDetailsOpen(true)
                            }}>
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/dashboard/classes')}>
                                Manage Classes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                                setSelectedSession(session)
                                setIsEditDialogOpen(true)
                            }}>
                                Edit Session
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                onClick={() => {
                                    setSelectedSession(session)
                                    setIsDeleteDialogOpen(true)
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Session
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            }
        }
    ]

    async function onEditSubmit(values: z.infer<typeof formSchema>) {
        if (!selectedSession) return
        setIsLoading(true)
        setError(null)
        try {
            const submissionValues = {
                name: values.name,
                startDate: values.startDate.toISOString(),
                endDate: values.endDate.toISOString(),
                isCurrent: selectedSession.isActive || (selectedSession as any).isCurrent
            }

            const response = await fetch(`/api/sessions/${selectedSession.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submissionValues),
                credentials: 'include'
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to update session")
            }

            const updatedSession = await response.json()
            toast.success("Academic session updated successfully")
            setSessions(prev =>
                prev.map(s => s.id === selectedSession.id ? { ...s, ...updatedSession } : s)
            )
            setIsEditDialogOpen(false)
            router.refresh()
        } catch (err: any) {
            setError(err.message || "An error occurred")
            toast.error("Failed to update session")
        } finally {
            setIsLoading(false)
        }
    }
    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        setError(null)
        try {
            const submissionValues = {
                ...values,
                schoolId: userRole === "school_admin" ? userSchoolId : values.schoolId,
                startDate: values.startDate.toISOString(),
                endDate: values.endDate.toISOString(),
                terms: values.terms.map(t => t.name)
            }

            const response = await fetch("/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submissionValues),
                credentials: 'include'
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to create session")
            }

            const newSession = await response.json()
            toast.success("Academic session created successfully")
            setSessions([newSession, ...sessions])
            form.reset()
            setIsDialogOpen(false)
            router.refresh()
        } catch (err: any) {
            setError(err.message || "An error occurred")
            toast.error("Failed to create session")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDelete() {
        if (!selectedSession) return
        setIsLoading(true)
        try {
            const response = await fetch(`/api/sessions/${selectedSession.id}`, {
                method: "DELETE",
                credentials: 'include'
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to delete session")
            }

            toast.success("Academic session deleted successfully")
            setSessions(prev => prev.filter(s => s.id !== selectedSession.id))
            setIsDeleteDialogOpen(false)
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || "Failed to delete session")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Academic Sessions</h2>
                    <p className="text-sm text-muted-foreground">Manage your academic sessions and terms</p>
                </div>

            {/* Add Session ResponsiveSheet */}
            <ResponsiveSheet 
                open={isDialogOpen} 
                onOpenChange={setIsDialogOpen}
                title="Create New Academic Session"
                description="Add a new academic session or term to your school calendar."
                className="sm:max-w-xl"
            >
                <div className="flex flex-col gap-6">
                    {error && (
                        <Alert variant="destructive" className="rounded-2xl border-red-100 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertTitle className="text-red-900 font-bold">Configuration Error</AlertTitle>
                            <AlertDescription className="text-red-700">{error}</AlertDescription>
                        </Alert>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400">Session Designation</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 2023/2024 Academic Year" className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-bold text-lg" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {userRole === "super_admin" && (
                                <FormField
                                    control={form.control}
                                    name="schoolId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400">Institutional Mapping</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-bold">
                                                        <SelectValue placeholder="Select a school" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-2xl border-slate-50 shadow-2xl">
                                                    {schools.map(school => (
                                                        <SelectItem key={school.id} value={school.id} className="rounded-xl px-4 py-3">{school.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400">Commencement</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn("h-14 rounded-2xl bg-slate-50 border-slate-100 pl-3 text-left font-bold transition-all hover:bg-slate-100", !field.value && "text-muted-foreground")}
                                                        >
                                                            {field.value ? format(field.value, "PPP") : <span>Pick a start date</span>}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden" align="start">
                                                    <DateCalendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="p-4" />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400">Conclusion</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn("h-14 rounded-2xl bg-slate-50 border-slate-100 pl-3 text-left font-bold transition-all hover:bg-slate-100", !field.value && "text-muted-foreground")}
                                                        >
                                                            {field.value ? format(field.value, "PPP") : <span>Pick an end date</span>}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden" align="start">
                                                    <DateCalendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date: Date) => date <= form.getValues().startDate}
                                                        initialFocus
                                                        className="p-4"
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Calendar Segments</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Define terms or periodic divisions for this session.</p>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" className="rounded-xl font-bold h-10 border-indigo-100 text-indigo-600 hover:bg-indigo-50" onClick={() => appendTerm({ name: "" })}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Term
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {termFields.map((field, index) => (
                                        <div key={field.id} className="flex items-center gap-2 group animate-in fade-in slide-in-from-top-1 duration-200">
                                            <FormField
                                                control={form.control}
                                                name={`terms.${index}.name`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <Input placeholder={`Term ${index + 1} Name (e.g. 1st Term)`} className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-bold" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="button" variant="ghost" size="icon" disabled={termFields.length <= 1} onClick={() => removeTerm(index)} className="h-14 w-14 rounded-2xl hover:bg-red-50 hover:text-red-600">
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-50">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 h-14 rounded-2xl border-slate-200 font-bold hover:bg-slate-50"
                                    onClick={() => setIsDialogOpen(false)}
                                    disabled={isLoading}
                                >
                                    Discard
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        "Initiate Session"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </ResponsiveSheet>
            </div>

            {sessions.length > 0 ? (
                <DataTable
                    columns={columns}
                    data={sessions}
                    searchKey="name"
                    searchPlaceholder="Search sessions..."
                />
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>No Sessions Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>No academic sessions have been created yet. Click the "Add Session" button to create your first session.</p>
                    </CardContent>
                </Card>
            )}

            {/* Edit Session ResponsiveSheet */}
            <ResponsiveSheet 
                open={isEditDialogOpen} 
                onOpenChange={setIsEditDialogOpen}
                title="Edit Academic Session"
                description="Update the details of your academic session."
                className="sm:max-w-xl"
            >
                <div className="flex flex-col gap-6">
                    {error && (
                        <Alert variant="destructive" className="rounded-2xl border-red-100 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertTitle className="text-red-900 font-bold">Error Updating</AlertTitle>
                            <AlertDescription className="text-red-700">{error}</AlertDescription>
                        </Alert>
                    )}

                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                            <FormField
                                control={editForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400">Session Designation</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 2023/2024 Academic Year" className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-bold text-lg" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={editForm.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400">Commencement</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn("h-14 rounded-2xl bg-slate-50 border-slate-100 pl-3 text-left font-bold transition-all hover:bg-slate-100", !field.value && "text-muted-foreground")}
                                                        >
                                                            {field.value ? format(field.value, "PPP") : <span>Pick a start date</span>}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden" align="start">
                                                    <DateCalendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="p-4" />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={editForm.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400">Conclusion</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn("h-14 rounded-2xl bg-slate-50 border-slate-100 pl-3 text-left font-bold transition-all hover:bg-slate-100", !field.value && "text-muted-foreground")}
                                                        >
                                                            {field.value ? format(field.value, "PPP") : <span>Pick an end date</span>}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden" align="start">
                                                    <DateCalendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date: Date) => date <= editForm.getValues().startDate}
                                                        initialFocus
                                                        className="p-4"
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-3 opacity-60 grayscale-[0.5]">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Immutable Calendar Segments</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedSession?.resultConfigurations?.[0]?.periods?.map((term) => (
                                        <Badge key={term.id} variant="outline" className="rounded-xl px-3 py-1 font-bold border-slate-200">{term.name}</Badge>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase italic mt-1">Segments are immutable post-initiation to preserve academic integrity.</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-50">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 h-14 rounded-2xl border-slate-200 font-bold hover:bg-slate-50"
                                    onClick={() => setIsEditDialogOpen(false)}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        "Save Adjustments"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </ResponsiveSheet>

            {/* View Details ResponsiveSheet */}
            <ResponsiveSheet 
                open={isDetailsOpen} 
                onOpenChange={setIsDetailsOpen}
                title="Session Information"
                description="Complete administrative overview of this academic year."
                className="sm:max-w-xl"
            >
                {selectedSession && (
                    <div className="flex flex-col gap-8">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Record ID</p>
                                <p className="text-sm font-mono font-bold text-slate-400 break-all">{selectedSession.id}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Session Identity</p>
                                <p className="text-lg font-black text-slate-900">{selectedSession.name}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-slate-50 border border-slate-100">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                        <Calendar className="h-4 w-4" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Commencement</span>
                                </div>
                                <p className="text-xl font-bold pl-10">{formatDate(selectedSession.startDate)}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                                        <Calendar className="h-4 w-4" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conclusion</span>
                                </div>
                                <p className="text-xl font-bold pl-10">{formatDate(selectedSession.endDate)}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Academic Hierarchy</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Classes</p>
                                    <p className="text-xl font-black text-indigo-600">{selectedSession._count?.classes || 0}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Enrolled</p>
                                    <p className="text-xl font-black text-indigo-600">{selectedSession._count?.studentClasses || 0}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Attendance</p>
                                    <p className="text-xl font-black text-indigo-600">{selectedSession._count?.attendance || 0}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Results</p>
                                    <p className="text-xl font-black text-indigo-600">{selectedSession._count?.results || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Defined Periods</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedSession.resultConfigurations?.[0]?.periods?.map((term: any) => (
                                    <div key={term.id} className="px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                        <span className="text-sm font-bold text-indigo-800">{term.name}</span>
                                        <Badge variant="outline" className="text-[9px] font-black">{term.weight || 0}% Weight</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50 flex flex-col sm:flex-row gap-3">
                            <Button 
                                variant="outline"
                                className="flex-1 h-14 rounded-2xl border-slate-200 font-bold hover:bg-slate-50"
                                onClick={() => setIsDetailsOpen(false)}
                            >
                                Close Overview
                            </Button>
                            <Button
                                className="flex-[2] h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black transition-all hover:scale-[1.02] active:scale-[0.98]"
                                onClick={() => {
                                    setIsDetailsOpen(false)
                                    router.push('/dashboard/classes')
                                }}
                            >
                                Manage Classes
                            </Button>
                        </div>
                    </div>
                )}
            </ResponsiveSheet>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            <span className="font-semibold text-foreground"> {selectedSession?.name} </span>
                            academic session and remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-md mb-4 flex gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                        <p className="text-sm text-amber-800">
                            Note: Sessions with existing student results, classes, or attendance records cannot be deleted for data integrity.
                        </p>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleDelete()
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600 font-semibold"
                            disabled={isLoading}
                        >
                            {isLoading ? "Deleting..." : "Delete Session"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}