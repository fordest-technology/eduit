"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { HexColorPicker } from "react-colorful"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"

interface SchoolSettings {
    name: string
    address: string | null
    phone: string | null
    email: string
    primaryColor: string | null
    secondaryColor: string | null
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<SchoolSettings>({
        name: "",
        address: "",
        phone: "",
        email: "",
        primaryColor: "#22c55e",
        secondaryColor: "#f59e0b",
    })
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        // Fetch school settings
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/schools/settings")
                if (!response.ok) {
                    throw new Error("Failed to fetch settings")
                }
                const data = await response.json()
                setSettings(data)
            } catch (error) {
                console.error("Error fetching settings:", error)
                toast.error("Failed to load settings")
            }
        }

        fetchSettings()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch("/api/schools/settings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(settings),
            })

            if (!response.ok) {
                throw new Error("Failed to update settings")
            }

            toast.success("Settings updated successfully")
        } catch (error) {
            console.error("Error updating settings:", error)
            toast.error("Failed to update settings")
        } finally {
            setIsLoading(false)
        }
    }

    const handleColorChange = (color: string, type: "primaryColor" | "secondaryColor") => {
        setSettings((prev) => ({ ...prev, [type]: color }))
    }

    return (
        <div className="container mx-auto py-6">
            <Card>
                <CardHeader>
                    <CardTitle>School Settings</CardTitle>
                    <CardDescription>
                        Manage your school information and appearance
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">School Name</Label>
                                <Input
                                    id="name"
                                    value={settings.name}
                                    onChange={(e) =>
                                        setSettings({ ...settings, name: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    value={settings.address || ""}
                                    onChange={(e) =>
                                        setSettings({ ...settings, address: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={settings.phone || ""}
                                    onChange={(e) =>
                                        setSettings({ ...settings, phone: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={settings.email}
                                    onChange={(e) =>
                                        setSettings({ ...settings, email: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <Label>School Colors</Label>
                                <div className="flex gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Primary</p>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <div
                                                    className="w-10 h-10 rounded-md cursor-pointer border"
                                                    style={{ backgroundColor: settings.primaryColor || "#22c55e" }}
                                                />
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <HexColorPicker
                                                    color={settings.primaryColor || "#22c55e"}
                                                    onChange={(color) => handleColorChange(color, "primaryColor")}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Secondary</p>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <div
                                                    className="w-10 h-10 rounded-md cursor-pointer border"
                                                    style={{ backgroundColor: settings.secondaryColor || "#f59e0b" }}
                                                />
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <HexColorPicker
                                                    color={settings.secondaryColor || "#f59e0b"}
                                                    onChange={(color) => handleColorChange(color, "secondaryColor")}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
} 