"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast"
import { ColorPicker } from "./color-picker"
import { Loader2, Upload, Trash2, Camera, Settings2, School, Mail, Phone } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Image from "next/image"
import { DashboardHeader } from "@/app/components/dashboard-header"

const schoolSettingsSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    shortName: z.string().min(2, "Short name must be at least 2 characters")
        .regex(/^[a-zA-Z0-9-]+$/, "Short name can only contain letters, numbers, and hyphens"),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email format"),
    logo: z.string().optional(),
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
    secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
})

type SchoolSettingsFormData = z.infer<typeof schoolSettingsSchema>

export function SchoolSettings() {
    const [isLoading, setIsLoading] = useState(false)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const { toast } = useToast()

    const form = useForm<SchoolSettingsFormData>({
        resolver: zodResolver(schoolSettingsSchema),
        defaultValues: {
            name: "",
            shortName: "",
            address: "",
            phone: "",
            email: "",
            logo: "",
            primaryColor: "#3b82f6",
            secondaryColor: "#1f2937",
        }
    })

    useEffect(() => {
        async function fetchSchoolData() {
            try {
                const response = await fetch('/api/schools/settings')
                const data = await response.json()
                if (response.ok) {
                    form.reset(data)
                }
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to load school settings",
                    variant: "destructive"
                })
            }
        }
        fetchSchoolData()
    }, [form, toast])

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast({
                    title: "Error",
                    description: "Please select a valid image file",
                    variant: "destructive"
                })
                return
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: "Error",
                    description: "Image size should be less than 5MB",
                    variant: "destructive"
                })
                return
            }

            setLogoFile(file)

            // Create preview
            const reader = new FileReader()
            reader.onloadend = () => {
                form.setValue('logo', reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    async function onSubmit(data: SchoolSettingsFormData) {
        try {
            setIsLoading(true)

            // Create FormData
            const formData = new FormData()

            // Append all form fields
            Object.entries(data).forEach(([key, value]) => {
                if (key !== 'logo') {
                    formData.append(key, value || '')
                }
            })

            // Append logo file if exists
            if (logoFile) {
                formData.append('logo', logoFile)
            }

            const response = await fetch('/api/schools/settings', {
                method: 'PUT',
                // Don't set Content-Type header - browser will set it automatically with boundary
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update school settings')
            }

            const responseData = await response.json()

            // Update form with new data
            form.reset(responseData)

            toast({
                title: "Success",
                description: "School settings updated successfully"
            })
        } catch (error) {
            console.error('Form submission error:', error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update school settings",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const removeLogo = () => {
        form.setValue('logo', '')
        setLogoFile(null)
    }

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="School Settings"
                text="Manage your school's information and appearance"
                icon={<Settings2 className="h-6 w-6" />}
                showBanner={true}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-blue-700">
                            <School className="mr-2 h-5 w-5" />
                            School Name
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-800">{form.watch('shortName')}</p>
                        <p className="text-sm text-blue-600 mt-1">{form.watch('name')}</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-purple-700">
                            <Mail className="mr-2 h-5 w-5" />
                            Contact Email
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-bold text-purple-800 break-all">{form.watch('email')}</p>
                        <p className="text-sm text-purple-600 mt-1">Primary contact address</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-emerald-700">
                            <Phone className="mr-2 h-5 w-5" />
                            Contact Phone
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-bold text-emerald-800">{form.watch('phone') || 'Not set'}</p>
                        <p className="text-sm text-emerald-600 mt-1">Primary contact number</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-primary/10 shadow-md">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle>School Information</CardTitle>
                    <CardDescription>Update your school's basic information and branding</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Logo Section */}
                            <div className="space-y-4">
                                <FormLabel>School Logo</FormLabel>
                                <div className="flex items-center gap-4">
                                    {form.watch('logo') ? (
                                        <div className="relative">
                                            <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-background border">
                                                <Image
                                                    src={form.watch('logo') || '/placeholder-logo.png'}
                                                    alt="School logo"
                                                    fill
                                                    className="object-contain"
                                                    sizes="128px"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-2 -right-2"
                                                onClick={removeLogo}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                                            <Camera className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div>
                                        <Input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            onChange={handleLogoChange}
                                            className="mt-2"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Supports JPG, PNG, WEBP, GIF (max 5MB)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* School Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>School Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="shortName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Short Name / Subdomain</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input {...field} onChange={(e) => {
                                                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                                        field.onChange(value);
                                                    }} />
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                        <span className="text-sm text-muted-foreground">.eduit.com</span>
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                This will be your school's unique URL: {field.value}.eduit.com
                                            </p>
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
                                                <Input {...field} type="email" />
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
                                            <FormLabel>Phone</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="tel" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Colors Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">School Colors</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="primaryColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Primary Color</FormLabel>
                                                <FormControl>
                                                    <ColorPicker value={field.value} onChange={field.onChange} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="secondaryColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Secondary Color</FormLabel>
                                                <FormControl>
                                                    <ColorPicker value={field.value} onChange={field.onChange} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
} 