"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

                <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <SheetTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Session
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-md w-full overflow-y-auto" side="right">
                        <SheetHeader>
                            <SheetTitle>Create New Academic Session</SheetTitle>
                            <SheetDescription>Add a new academic session or term to your school calendar.</SheetDescription>
                        </SheetHeader>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Session Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 2023/2024 Academic Year" {...field} />
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
                                                <FormLabel>School</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a school" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {schools.map(school => (
                                                            <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Start Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                            >
                                                                {field.value ? format(field.value, "PPP") : <span>Pick a start date</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <DateCalendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
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
                                            <FormItem>
                                                <FormLabel>End Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                            >
                                                                {field.value ? format(field.value, "PPP") : <span>Pick an end date</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <DateCalendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date: Date) => date <= form.getValues().startDate}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Terms / Periods</FormLabel>
                                        <Button type="button" variant="outline" size="sm" onClick={() => appendTerm({ name: "" })}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Term
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {termFields.map((field, index) => (
                                            <div key={field.id} className="flex items-center gap-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`terms.${index}.name`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input placeholder={`Term ${index + 1} Name (e.g. 1st Term)`} {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button type="button" variant="ghost" size="icon" disabled={termFields.length <= 1} onClick={() => removeTerm(index)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <SheetFooter className="mt-6">
                                    <Button type="submit" disabled={isLoading}>{isLoading ? "Creating..." : "Create Session"}</Button>
                                </SheetFooter>
                            </form>
                        </Form>
                    </SheetContent>
                </Sheet>
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

            {/* Edit Session Sheet */}
            <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <SheetContent className="sm:max-w-md w-full overflow-y-auto" side="right">
                    <SheetHeader>
                        <SheetTitle>Edit Academic Session</SheetTitle>
                        <SheetDescription>Update the details of your academic session.</SheetDescription>
                    </SheetHeader>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                            <FormField
                                control={editForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Session Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 2023/2024 Academic Year" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={editForm.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                        >
                                                            {field.value ? format(field.value, "PPP") : <span>Pick a start date</span>}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <DateCalendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
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
                                        <FormItem>
                                            <FormLabel>End Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                        >
                                                            {field.value ? format(field.value, "PPP") : <span>Pick an end date</span>}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <DateCalendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date: Date) => date <= editForm.getValues().startDate}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Terms are currently not editable via the direct PUT API, 
                                but we show them for reference or could add term editing logic later */}
                            <div className="space-y-2 opacity-50 pointer-events-none">
                                <FormLabel>Terms (Non-editable)</FormLabel>
                                <div className="flex flex-wrap gap-2">
                                    {selectedSession?.resultConfigurations?.[0]?.periods?.map((term) => (
                                        <Badge key={term.id} variant="outline">{term.name}</Badge>
                                    ))}
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">Term names cannot be changed once the session is created.</p>
                            </div>

                            <SheetFooter className="mt-6">
                                <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Changes"}</Button>
                            </SheetFooter>
                        </form>
                    </Form>
                </SheetContent>
            </Sheet>

            {/* View Details Sheet */}
            <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <SheetContent className="sm:max-w-md w-full overflow-y-auto" side="right">
                    <SheetHeader>
                        <SheetTitle>Session Details</SheetTitle>
                        <SheetDescription>Complete information about this academic session.</SheetDescription>
                    </SheetHeader>
                    {selectedSession && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Session Name</p>
                                    <p className="text-sm font-semibold">{selectedSession.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Status</p>
                                    <Badge
                                        variant={(selectedSession.isActive || (selectedSession as any).isCurrent) ? "default" : "secondary"}
                                        className={(selectedSession.isActive || (selectedSession as any).isCurrent)
                                            ? "bg-green-600 hover:bg-green-700 text-white font-semibold"
                                            : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                                        }
                                    >
                                        {(selectedSession.isActive || (selectedSession as any).isCurrent) ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Start Date</p>
                                    <p className="text-sm">{formatDate(selectedSession.startDate)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider text-[10px]">End Date</p>
                                    <p className="text-sm">{formatDate(selectedSession.endDate)}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Terms / Periods</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedSession.resultConfigurations?.[0]?.periods?.map((term) => (
                                        <Badge key={term.id} variant="outline" className="px-2 py-1">{term.name} (Weight: {term.weight})</Badge>
                                    )) || <span className="text-xs italic">No terms defined</span>}
                                </div>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-2 border rounded-lg bg-muted/30">
                                    <p className="text-lg font-bold">{selectedSession._count.studentClasses}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">Classes</p>
                                </div>
                                <div className="p-2 border rounded-lg bg-muted/30">
                                    <p className="text-lg font-bold">{selectedSession._count.results}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">Results</p>
                                </div>
                                <div className="p-2 border rounded-lg bg-muted/30">
                                    <p className="text-lg font-bold">{selectedSession._count.attendance}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">Attendance</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <SheetFooter className="mt-6">
                        <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                        <Button onClick={() => {
                            setIsDetailsOpen(false)
                            router.push('/dashboard/classes')
                        }}>Manage Classes</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

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