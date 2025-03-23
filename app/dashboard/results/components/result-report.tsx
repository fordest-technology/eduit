"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileDown, Printer, Share2, ChevronLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

interface SkillRatings {
    [key: string]: number
}

interface StudentResult {
    subjectId: string
    subjectName: string
    marks: number
    totalMarks: number
    grade: string
    position: number
    skillRatings: SkillRatings
    attendance: number
    behavior: number
    effort: number
    teacherNote: string
}

interface Student {
    id: string
    name: string
    results: StudentResult[]
}

interface ResultReportProps {
    classId: string
    sessionId: string
    examType: string
    students: Student[]
    onClose: () => void
}

export function ResultReport({ classId, sessionId, examType, students, onClose }: ResultReportProps) {
    const [selectedView, setSelectedView] = useState<"overview" | "detailed">("overview")

    const calculateOverallGrade = (results: StudentResult[]) => {
        const totalMarks = results.reduce((sum, result) => sum + result.marks, 0)
        const totalMaxMarks = results.reduce((sum, result) => sum + result.totalMarks, 0)
        const percentage = (totalMarks / totalMaxMarks) * 100

        if (percentage >= 90) return { grade: 'A+', color: 'text-green-600 bg-green-50' }
        if (percentage >= 80) return { grade: 'A', color: 'text-emerald-600 bg-emerald-50' }
        if (percentage >= 70) return { grade: 'B+', color: 'text-blue-600 bg-blue-50' }
        if (percentage >= 60) return { grade: 'B', color: 'text-sky-600 bg-sky-50' }
        if (percentage >= 50) return { grade: 'C', color: 'text-yellow-600 bg-yellow-50' }
        return { grade: 'F', color: 'text-red-600 bg-red-50' }
    }

    const calculatePerformanceMetrics = (student: Student) => {
        const attendance = student.results.reduce((sum, r) => sum + r.attendance, 0) / student.results.length
        const behavior = student.results.reduce((sum, r) => sum + r.behavior, 0) / student.results.length
        const effort = student.results.reduce((sum, r) => sum + r.effort, 0) / student.results.length

        return { attendance, behavior, effort }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back to Results
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{examType} Examination Results</h2>
                        <p className="text-muted-foreground">
                            {format(new Date(), 'MMMM yyyy')} Academic Session
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                    <Button variant="outline" size="sm">
                        <FileDown className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                </div>
            </div>

            <div className="flex gap-4">
                <Button
                    variant={selectedView === "overview" ? "default" : "outline"}
                    onClick={() => setSelectedView("overview")}
                >
                    Overview
                </Button>
                <Button
                    variant={selectedView === "detailed" ? "default" : "outline"}
                    onClick={() => setSelectedView("detailed")}
                >
                    Detailed View
                </Button>
            </div>

            <div className="grid gap-6">
                {selectedView === "overview" ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {students.map((student) => {
                            const overallGrade = calculateOverallGrade(student.results)
                            const metrics = calculatePerformanceMetrics(student)
                            const avgMarks = student.results.reduce((sum, r) => sum + (r.marks / r.totalMarks) * 100, 0) / student.results.length

                            return (
                                <Card key={student.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle>{student.name}</CardTitle>
                                                <CardDescription>ID: {student.id}</CardDescription>
                                            </div>
                                            <Badge className={cn("px-2 py-1", overallGrade.color)}>
                                                {overallGrade.grade}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex items-center justify-between text-sm mb-1">
                                                    <span className="text-muted-foreground">Average Score</span>
                                                    <span className="font-medium">{avgMarks.toFixed(1)}%</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-primary/10">
                                                    <div
                                                        className="h-full rounded-full bg-primary"
                                                        style={{ width: `${avgMarks}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                {Object.entries(metrics).map(([metric, value]) => (
                                                    <div key={metric} className="p-2 rounded-lg bg-muted">
                                                        <p className="text-xs text-muted-foreground capitalize">{metric}</p>
                                                        <p className="font-medium">{Math.round(value)}%</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <Tabs defaultValue={students[0]?.id} className="w-full">
                        <TabsList className="w-full justify-start mb-4 bg-muted">
                            {students.map((student) => (
                                <TabsTrigger
                                    key={student.id}
                                    value={student.id}
                                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                >
                                    {student.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {students.map((student) => (
                            <TabsContent key={student.id} value={student.id}>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Subject Performance</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {student.results.map((result) => (
                                                    <div key={result.subjectId} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                                                        <div>
                                                            <p className="font-medium">{result.subjectName}</p>
                                                            <p className="text-sm text-muted-foreground">Position: {result.position}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-medium">{result.marks}/{result.totalMarks}</p>
                                                            <Badge variant="outline">{result.grade}</Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Performance Overview</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {Object.entries(calculatePerformanceMetrics(student)).map(([metric, value]) => (
                                                        <div key={metric} className="space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-medium capitalize">{metric}</p>
                                                                <p className="text-sm text-muted-foreground">{Math.round(value)}%</p>
                                                            </div>
                                                            <div className="h-2 rounded-full bg-primary/10">
                                                                <div
                                                                    className="h-full rounded-full bg-primary"
                                                                    style={{ width: `${value}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Teacher Notes</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {student.results.map((result) => (
                                                        <div key={result.subjectId} className="space-y-1">
                                                            <p className="text-sm font-medium">{result.subjectName}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {result.teacherNote || 'No notes provided.'}
                                                            </p>
                                                            <Separator className="my-2" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                )}
            </div>
        </div>
    )
} 