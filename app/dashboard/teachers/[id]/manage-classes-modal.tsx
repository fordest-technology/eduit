"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, School } from "lucide-react"
import { useRouter } from "next/navigation"
import { logger } from "@/lib/logger"

interface Class {
    id: string
    name: string
    section: string | null
    level: {
        id: string
        name: string
    } | null
}

interface ManageClassesModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    teacherId: string
    availableClasses: Class[]
    teacherClasses: Class[]
    onSuccess: () => void
}

export function ManageClassesModal({
    open,
    onOpenChange,
    teacherId,
    availableClasses = [],
    teacherClasses = [],
    onSuccess
}: ManageClassesModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedClasses, setSelectedClasses] = useState<string[]>([])
    const router = useRouter()

    // Initialize selected classes when modal opens or teacherClasses change
    useEffect(() => {
        if (open) {
            logger.info("Initializing teacher classes modal", {
                teacherId,
                teacherClassesCount: teacherClasses.length
            })
            const initialSelected = teacherClasses.map(c => c.id)
            setSelectedClasses(initialSelected)
        }
    }, [open, teacherClasses, teacherId])

    async function fetchUpdatedClasses() {
        try {
            logger.info("Fetching updated teacher classes", { teacherId })
            const response = await fetch(`/api/teachers/${teacherId}/classes`, {
                credentials: 'include',
            })
            if (!response.ok) {
                throw new Error('Failed to fetch updated classes')
            }
            const data = await response.json()
            logger.info("Fetched updated classes", {
                teacherId,
                classesCount: data.classes?.length || 0
            })
            return data.classes
        } catch (error) {
            logger.error("Error fetching updated classes", error, { teacherId })
            return null
        }
    }

    async function onSubmit() {
        try {
            setIsLoading(true)
            logger.info("Updating teacher classes", {
                teacherId,
                selectedClassesCount: selectedClasses.length
            })

            const response = await fetch(`/api/teachers/${teacherId}/classes`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    classIds: selectedClasses
                }),
            })

            let data;
            try {
                data = await response.json();
                logger.info("Teacher classes update response", {
                    teacherId,
                    status: response.status,
                    success: response.ok
                })
            } catch (e) {
                logger.error("Failed to parse response", e, { teacherId })
                toast.error('Server response was invalid. Please try again.');
                return;
            }

            if (!response.ok) {
                switch (response.status) {
                    case 401:
                        toast.error("Your session has expired. Please log in again.");
                        router.push('/auth/login');
                        return;
                    case 403:
                        toast.error("You don't have permission to manage teacher classes. Please contact an administrator.");
                        onOpenChange(false);
                        return;
                    case 404:
                        toast.error("Teacher not found or not in your school.");
                        onOpenChange(false);
                        return;
                    case 400:
                        toast.error(data.error || "Invalid request. Please check your selection.");
                        return;
                    default:
                        toast.error(data.error || "Failed to update classes. Please try again.");
                        return;
                }
            }

            // Fetch updated classes immediately after successful update
            const updatedClasses = await fetchUpdatedClasses();
            if (updatedClasses) {
                setSelectedClasses(updatedClasses.map((c: Class) => c.id));
            }

            toast.success("Classes updated successfully");
            router.refresh();
            if (onSuccess) {
                await onSuccess();
            }
            onOpenChange(false);
        } catch (error) {
            logger.error("Error updating teacher classes", error, { teacherId })
            toast.error("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    function toggleClass(classId: string) {
        setSelectedClasses(current => {
            const newSelected = current.includes(classId)
                ? current.filter(id => id !== classId)
                : [...current, classId];
            logger.info("Toggled class selection", {
                teacherId,
                classId,
                newSelectionCount: newSelected.length
            })
            return newSelected;
        })
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Manage Teacher Classes</h2>
                <Button
                    onClick={onSubmit}
                    disabled={isLoading}
                    className="ml-auto"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                        </>
                    ) : (
                        "Save Changes"
                    )}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableClasses.map((cls) => (
                    <Card
                        key={cls.id}
                        className={`cursor-pointer transition-all ${selectedClasses.includes(cls.id)
                                ? "ring-2 ring-primary bg-primary/5"
                                : "hover:shadow-md"
                            }`}
                        onClick={() => toggleClass(cls.id)}
                    >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center justify-between">
                                <span>{cls.name}</span>
                                {selectedClasses.includes(cls.id) && (
                                    <Badge variant="default" className="text-xs">
                                        Selected
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {cls.section && (
                                <p className="text-sm text-muted-foreground mb-2">
                                    Section {cls.section}
                                </p>
                            )}
                            {cls.level && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <School className="h-3 w-3 mr-1" />
                                    {cls.level.name}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {availableClasses.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">No classes available to assign</p>
                </div>
            )}
        </div>
    )
} 