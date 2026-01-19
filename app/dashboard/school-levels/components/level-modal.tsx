"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";

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
        <ResponsiveSheet 
            open={open} 
            onOpenChange={onOpenChange}
            title={mode === "create" ? "Create Academic Level" : "Edit Level Registry"}
            description={mode === "create"
                ? "Define a new organizational tier for your institution's curriculum."
                : "Modify the configuration and display priority of this academic level."}
            className="sm:max-w-md"
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Level Designation</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Primary 1, JSS 1, SSS 1"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Administrative Notes</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief description of this level's scope..."
                            value={formData.description || ""}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    description: e.target.value,
                                })
                            }
                            className="rounded-2xl bg-slate-50 border-slate-100 focus:bg-white font-medium min-h-[120px]"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="order" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Display Hierarchy Order</Label>
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
                            className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold"
                        />
                        <p className="text-[10px] font-medium text-slate-400 italic">
                            Lower numbers prioritize this level in lists and dashboards.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-50">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                        className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:text-slate-800"
                    >
                        Discard
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="flex-[2] h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : mode === "create" ? (
                            "Finalize Level"
                        ) : (
                            "Update Level"
                        )}
                    </Button>
                </div>
            </form>
        </ResponsiveSheet>
    )
} 
