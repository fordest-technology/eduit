"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast"
import { profileSchema } from "@/lib/validations/settings"
import { updateUserProfile } from "@/lib/actions/settings"
import { UserRole } from "@prisma/client"

interface ProfileFormData {
    name: string
    email: string
    phone: string
    address: string
    dateOfBirth: string
    gender: string
    // We'll add more fields based on your schema
}

interface ProfileSettingsProps {
    userRole: UserRole
    userId: string
}

export function ProfileSettings({ userRole, userId }: ProfileSettingsProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const [userData, setUserData] = useState<any>(null)

    useEffect(() => {
        async function fetchUserData() {
            try {
                const response = await fetch(`/api/users/${userId}`)
                const data = await response.json()
                if (data.success) {
                    form.reset(data.user)
                    setUserData(data.user)
                }
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to load user data",
                    variant: "destructive"
                })
            }
        }
        fetchUserData()
    }, [userId])

    const form = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            schoolId: "",
            // Add other fields based on your schema
        }
    })

    async function onSubmit(data: any) {
        try {
            setIsLoading(true)
            await updateUserProfile(userId, data)
            toast({
                title: "Profile updated",
                description: "Your profile has been updated successfully."
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update profile.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} disabled={userRole === "STUDENT"} />
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
                                        <Input {...field} type="email" disabled={userRole === "STUDENT"} />
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
                                        <Input {...field} type="tel" disabled={userRole === "STUDENT"} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {userRole !== "STUDENT" && (
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save Changes"}
                            </Button>
                        )}
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
} 