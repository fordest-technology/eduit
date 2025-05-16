"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"

interface SchoolLevel {
    id: string
    name: string
    description: string | null
    order: number
}

interface LevelModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: Omit<SchoolLevel, "id">) => Promise<void>
    initialData?: SchoolLevel
    mode: "create" | "edit"
}

export function LevelModal({
    open,
    onOpenChange,
    onSubmit,
    initialData,
    mode,
}: LevelModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState<Omit<SchoolLevel, "id">>({
        name: initialData?.name || "",
        description: initialData?.description || "",
        order: initialData?.order || 0,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setIsSubmitting(true)
            await onSubmit(formData)
            onOpenChange(false)
            setFormData({ name: "", description: "", order: 0 })
        } catch (error) {
            // Error handling is done in the parent component
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Create New Level" : "Edit Level"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Add a new academic level to your school"
                            : "Update the academic level details"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Level Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Primary 1, JSS 1, SSS 1"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief description of this level..."
                            value={formData.description || ""}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    description: e.target.value,
                                })
                            }
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="order">Display Order</Label>
                        <Input
                            id="order"
                            type="number"
                            min={0}
                            placeholder="0"
                            value={formData.order}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    order: parseInt(e.target.value) || 0,
                                })
                            }
                        />
                        <p className="text-sm text-muted-foreground">
                            Lower numbers will be displayed first
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {mode === "create"
                                        ? "Creating..."
                                        : "Updating..."}
                                </>
                            ) : mode === "create" ? (
                                "Create Level"
                            ) : (
                                "Update Level"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
} 