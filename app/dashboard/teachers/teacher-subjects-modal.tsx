"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ResponsiveSheet } from "@/components/ui/responsive-sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Search, Loader2, BookOpen, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Subject {
    id: string
    name: string
    department?: {
        name: string
    } | null
}

export interface TeacherSubjectsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    teacher: { id: string, name: string } | null
    onSuccess: () => void
}

export function TeacherSubjectsModal({
    open,
    onOpenChange,
    teacher,
    onSuccess
}: TeacherSubjectsModalProps) {
    const [loading, setLoading] = useState(false)
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([])
    const [currentSubjectIds, setCurrentSubjectIds] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([])

    // Fetch all available subjects when the modal opens
    useEffect(() => {
        if (open && teacher) {
            fetchSubjects()
            fetchTeacherSubjects()
        }
    }, [open, teacher])

    // Filter subjects based on search query
    useEffect(() => {
        if (searchQuery.trim()) {
            setFilteredSubjects(
                subjects.filter(subject =>
                    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
            )
        } else {
            setFilteredSubjects(subjects)
        }
    }, [searchQuery, subjects])

    const fetchSubjects = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/subjects')

            if (!response.ok) {
                throw new Error('Failed to fetch subjects')
            }

            const data = await response.json()
            setSubjects(data)
            setFilteredSubjects(data)
        } catch (error) {
            console.error('Error fetching subjects:', error)
            toast.error('Failed to load subjects')
        } finally {
            setLoading(false)
        }
    }

    const fetchTeacherSubjects = async () => {
        if (!teacher) return

        try {
            setLoading(true)
            const response = await fetch(`/api/teachers/${teacher.id}/subjects`)

            if (!response.ok) {
                throw new Error('Failed to fetch teacher subjects')
            }

            const data = await response.json()
            const subjectIds = data.map((item: any) => item.subjectId)

            console.log('Current teacher subjects:', subjectIds)
            setCurrentSubjectIds(subjectIds)
            setSelectedSubjectIds(subjectIds)
        } catch (error) {
            console.error('Error fetching teacher subjects:', error)
            toast.error('Failed to load teacher subjects')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!teacher) return

        try {
            setLoading(true)

            const response = await fetch(`/api/teachers/${teacher.id}/subjects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subjectIds: selectedSubjectIds
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to update teacher subjects')
            }

            toast.success('Teacher subjects updated successfully')
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Error updating teacher subjects:', error)
            toast.error('Failed to update teacher subjects')
        } finally {
            setLoading(false)
        }
    }

    const handleSelectAll = () => {
        if (selectedSubjectIds.length === filteredSubjects.length) {
            setSelectedSubjectIds([])
        } else {
            setSelectedSubjectIds(filteredSubjects.map(subject => subject.id))
        }
    }

    return (
        <ResponsiveSheet 
            open={open} 
            onOpenChange={onOpenChange}
            title={`Curriculum Assignment: ${teacher?.name}`}
            description="Manage the academic subjects assigned to this faculty member."
            className="sm:max-w-xl"
        >
            <div className="flex flex-col gap-8">
                <div className="space-y-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
                        <Input
                            placeholder="Filter by subject identity or department..."
                            className="pl-12 h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assignment Count</span>
                            <Badge variant="secondary" className="rounded-lg bg-indigo-50 text-indigo-700 font-black">
                                {selectedSubjectIds.length} / {filteredSubjects.length}
                            </Badge>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSelectAll}
                            className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                        >
                            {selectedSubjectIds.length === filteredSubjects.length
                                ? "Reset Selection"
                                : "Assign All Filtered"}
                        </Button>
                    </div>

                    <div className="relative min-h-[300px]">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredSubjects.length > 0 ? (
                                    filteredSubjects.map(subject => (
                                        <div
                                            key={subject.id}
                                            onClick={() => {
                                                setSelectedSubjectIds(prev =>
                                                    prev.includes(subject.id)
                                                        ? prev.filter(id => id !== subject.id)
                                                        : [...prev, subject.id]
                                                )
                                            }}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                                                selectedSubjectIds.includes(subject.id)
                                                    ? "bg-indigo-50/50 border-indigo-100 shadow-sm"
                                                    : "bg-white border-slate-50 hover:border-slate-200"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                                selectedSubjectIds.includes(subject.id)
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
                                            )}>
                                                <BookOpen className="h-5 w-5" />
                                            </div>
                                            
                                            <div className="flex flex-col flex-1">
                                                <span className={cn(
                                                    "text-sm font-black transition-colors",
                                                    selectedSubjectIds.includes(subject.id) ? "text-slate-900" : "text-slate-600"
                                                )}>
                                                    {subject.name}
                                                </span>
                                                {subject.department && (
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                        {subject.department.name}
                                                    </span>
                                                )}
                                            </div>

                                            {currentSubjectIds.includes(subject.id) && !selectedSubjectIds.includes(subject.id) && (
                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-amber-600 border-amber-100 bg-amber-50">
                                                    Removing
                                                </Badge>
                                            )}
                                            
                                            {selectedSubjectIds.includes(subject.id) && (
                                                <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center">
                                                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <Search className="h-10 w-10 text-slate-200 mb-4" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                                            {searchQuery ? "No academic subjects matched" : "No subjects in curriculum"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
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
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                        Finalize Assignments
                    </Button>
                </div>
            </div>
        </ResponsiveSheet>
    )
} 
