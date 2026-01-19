"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ResponsiveSheet } from "@/components/ui/responsive-sheet"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, X } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface Subject {
    id: string
    name: string
}

interface ManageSubjectsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    teacherId: string
    availableSubjects: Subject[]
    currentSubjectIds: string[]
    onSuccess?: () => Promise<void>
}

export function ManageSubjectsModal({
    open,
    onOpenChange,
    teacherId,
    availableSubjects,
    currentSubjectIds,
    onSuccess
}: ManageSubjectsModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>(currentSubjectIds)
    const [newSubjectId, setNewSubjectId] = useState<string>("")
    const router = useRouter()

    // Filter out already selected subjects from available options
    const availableOptions = availableSubjects.filter(
        subject => !selectedSubjects.includes(subject.id)
    )

    const handleAddSubject = () => {
        if (newSubjectId && !selectedSubjects.includes(newSubjectId)) {
            setSelectedSubjects([...selectedSubjects, newSubjectId])
            setNewSubjectId("")
        }
    }

    const handleRemoveSubject = (subjectId: string) => {
        setSelectedSubjects(selectedSubjects.filter(id => id !== subjectId))
    }

    async function onSubmit() {
        try {
            setIsLoading(true)

            const response = await fetch(`/api/teachers/${teacherId}/subjects`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    subjectIds: selectedSubjects,
                }),
            })

            if (!response.ok) {
                const error = await response.text()
                throw new Error(error || "Failed to update subjects")
            }

            toast.success("Subjects updated successfully")
            router.refresh()
            if (onSuccess) {
                await onSuccess()
            }
            onOpenChange(false)
        } catch (error) {
            console.error("Failed to update subjects:", error)
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
        <ResponsiveSheet 
            open={open} 
            onOpenChange={onOpenChange}
            title="Curriculum Alignment"
            description="Optimize the academic portfolio for this faculty member."
            className="sm:max-w-xl"
        >
            <div className="flex flex-col gap-10">
                <div className="space-y-6">
                    {/* Selected Subjects */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Assignments</label>
                        <div className="flex flex-wrap gap-2.5 p-4 rounded-[2rem] bg-slate-50 border border-slate-100 min-h-[100px] content-start">
                            {selectedSubjects.length === 0 ? (
                                <div className="w-full flex items-center justify-center p-6 text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">
                                    No subjects currently linked
                                </div>
                            ) : (
                                selectedSubjects.map((subjectId) => {
                                    const subject = availableSubjects.find(s => s.id === subjectId)
                                    return subject ? (
                                        <Badge 
                                            key={subjectId} 
                                            variant="secondary" 
                                            className="h-10 pl-4 pr-2 flex items-center gap-2 bg-white border-slate-100 text-slate-700 font-black text-xs rounded-xl shadow-sm hover:shadow-md transition-all group"
                                        >
                                            {subject.name}
                                            <button
                                                onClick={() => handleRemoveSubject(subjectId)}
                                                className="h-6 w-6 rounded-lg flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </Badge>
                                    ) : null
                                })
                            )}
                        </div>
                    </div>

                    {/* Add New Subject */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expand Curriculum</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <Select value={newSubjectId} onValueChange={setNewSubjectId}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all">
                                        <SelectValue placeholder="Select institutional subject" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                                        {availableOptions.map((subject) => (
                                            <SelectItem key={subject.id} value={subject.id} className="font-bold">
                                                {subject.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                type="button"
                                onClick={handleAddSubject}
                                disabled={!newSubjectId}
                                className="h-14 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                Add
                            </Button>
                        </div>
                    </div>

                    {availableOptions.length === 0 && selectedSubjects.length > 0 && (
                        <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Saturation Reached: All curriculum subjects assigned.</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-50">
                    <Button 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)}
                        className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:text-slate-800"
                    >
                        Discard
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={isLoading}
                        className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
                        Finalize Changes
                    </Button>
                </div>
            </div>
        </ResponsiveSheet>
    )
} 
