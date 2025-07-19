"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AddStudentSheet } from "../add-student-sheet"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestSheetPage() {
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    const handleSuccess = () => {
        console.log("Student created successfully!")
        setIsSheetOpen(false)
    }

    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Student Sheet Test</CardTitle>
                    <CardDescription>
                        Test the new student sheet component that opens from the right side
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => setIsSheetOpen(true)}>
                        Open Student Sheet
                    </Button>
                </CardContent>
            </Card>

            <AddStudentSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                onSuccess={handleSuccess}
            />
        </div>
    )
} 