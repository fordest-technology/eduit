"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
})

interface AddParentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    parentToEdit?: {
        id: string
        name: string
        email: string
        phone?: string | null
    } | null
}

export function AddParentModal({
    open,
    onOpenChange,
    onSuccess,
    parentToEdit
}: AddParentModalProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
    const [emailError, setEmailError] = useState<string | null>(null)
    const isEditMode = Boolean(parentToEdit)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: parentToEdit?.name || "",
            email: parentToEdit?.email || "",
            phone: parentToEdit?.phone || "",
            password: "",
        },
    })

    // Update form values when parentToEdit changes
    useEffect(() => {
        if (parentToEdit) {
            form.reset({
                name: parentToEdit.name,
                email: parentToEdit.email,
                phone: parentToEdit.phone || "",
                password: "",
            })
        } else {
            form.reset({
                name: "",
                email: "",
                phone: "",
                password: "",
            })
        }
    }, [parentToEdit, form])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsLoading(true)
            setEmailStatus('idle')
            setEmailError(null)

            const formData = new FormData()
            formData.append("name", values.name)
            formData.append("email", values.email)
            if (values.phone) formData.append("phone", values.phone)
            if (values.password) formData.append("password", values.password)

            const url = isEditMode
                ? `/api/parents/${parentToEdit?.id}`
                : "/api/parents"

            const response = await fetch(url, {
                method: isEditMode ? "PATCH" : "POST",
                body: formData,
            })

            if (!response.ok) {
                const error = await response.text()
                throw new Error(error || "Failed to save parent")
            }

            const result = await response.json()

            // Send welcome email for new parents
            if (!isEditMode) {
                try {
                    setEmailStatus('sending')

                    // Get school information
                    let schoolName = "School"
                    const schoolId = result.schoolId
                    let schoolUrl = window.location.origin

                    try {
                        if (schoolId) {
                            const schoolResponse = await fetch(`/api/schools/${schoolId}`)
                            if (schoolResponse.ok) {
                                const schoolData = await schoolResponse.json()
                                schoolName = schoolData.name || schoolName
                                if (schoolData.subdomain) {
                                    schoolUrl = `https://${schoolData.subdomain}.eduit.app`
                                }
                            }
                        }
                    } catch (err) {
                        console.error("Error fetching school info:", err)
                    }

                    const emailResponse = await fetch("/api/send-credentials", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            name: result.name,
                            email: result.email,
                            password: values.password || result.password,
                            role: "parent",
                            schoolName: schoolName,
                            schoolId: schoolId,
                            schoolUrl: schoolUrl,
                            revalidate: true,
                        }),
                    })

                    if (!emailResponse.ok) {
                        const emailError = await emailResponse.text()
                        throw new Error(emailError || "Failed to send login credentials")
                    }

                    setEmailStatus('success')
                    toast.success("Parent created successfully and login credentials sent")
                } catch (emailError) {
                    console.error("Failed to send email:", emailError)
                    setEmailStatus('error')
                    if (emailError instanceof Error) {
                        setEmailError(emailError.message)
                    } else {
                        setEmailError("Failed to send login credentials")
                    }
                    toast.warning("Parent account created. However, there was an issue sending the login email. You may need to provide credentials manually.")
                }
            } else {
                toast.success("Parent updated successfully")
            }

            router.refresh()
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Failed to save parent:", error)
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditMode ? "Edit Parent" : "Add New Parent"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditMode
                            ? "Update the parent's information"
                            : "Add a new parent to your school. They will receive an email with login credentials."}
                    </DialogDescription>
                </DialogHeader>

                {!isEditMode && (
                    <Alert className="bg-blue-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Automatic credential generation</AlertTitle>
                        <AlertDescription>
                            When you create a new parent, the system will automatically generate a secure password and send the
                            login credentials to the parent's email address if you don't provide a password.
                        </AlertDescription>
                    </Alert>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter parent's full name" {...field} />
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
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="Enter email address" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter phone number" {...field} />
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
                                    <FormLabel>
                                        {isEditMode ? "New Password (leave blank to keep current)" : "Password (Optional)"}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder={isEditMode ? "New password" : "Leave blank to auto-generate"}
                                            {...field}
                                        />
                                    </FormControl>
                                    {!isEditMode && (
                                        <p className="text-sm text-muted-foreground">
                                            If left blank, a secure password will be generated and sent to the parent's email.
                                        </p>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {!isEditMode && (
                            <div className="bg-muted/50 p-3 rounded-md">
                                <div className="flex items-center text-sm">
                                    <Mail className="h-4 w-4 mr-2" />
                                    <p>A welcome email with login credentials will be sent automatically to the provided email address.</p>
                                </div>
                                {emailStatus === 'sending' && (
                                    <div className="flex items-center mt-2 text-sm text-amber-600">
                                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                        <p>Sending login credentials to email...</p>
                                    </div>
                                )}
                                {emailStatus === 'success' && (
                                    <div className="flex items-center mt-2 text-sm text-green-600">
                                        <CheckCircle className="h-3 w-3 mr-2" />
                                        <p>Login credentials sent successfully!</p>
                                    </div>
                                )}
                                {emailStatus === 'error' && (
                                    <div className="flex items-center mt-2 text-sm text-red-600">
                                        <AlertCircle className="h-3 w-3 mr-2" />
                                        <p>{emailError || "Failed to send email with credentials. Please contact the user directly."}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isEditMode ? "Saving..." : "Creating..."}
                                    </>
                                ) : isEditMode ? (
                                    "Save Changes"
                                ) : (
                                    "Create Parent"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
} 