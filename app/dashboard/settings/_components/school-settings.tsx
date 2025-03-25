"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { HexColorPicker } from "react-colorful"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { updateSchoolSettings } from "@/lib/actions/settings"
// import { updateSchoolSettings } from "@/lib/actions/settings"

export function SchoolSettings() {
    const [color, setColor] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    async function handleColorUpdate() {
        try {
            setIsLoading(true)
            await updateSchoolSettings({ primaryColor: color })
            toast({
                title: "Settings updated",
                description: "School color has been updated successfully."
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update school settings.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>School Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <div
                                className="w-10 h-10 rounded-md cursor-pointer border"
                                style={{ backgroundColor: color }}
                            />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <HexColorPicker color={color} onChange={setColor} />
                        </PopoverContent>
                    </Popover>
                </div>
                <Button
                    onClick={handleColorUpdate}
                    disabled={isLoading}
                >
                    {isLoading ? "Updating..." : "Save Changes"}
                </Button>
            </CardContent>
        </Card>
    )
} 