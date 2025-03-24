"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Check, ChevronDown, Download, GraduationCap, Search, X } from "lucide-react"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Result {
    id: string
    student: {
        id: string
        user: {
            id: string
            name: string
            image?: string
        }
    }
    subject: {
        id: string
        name: string
        code?: string
    }
    marks: number
    totalMarks: number
    grade?: string
    remarks?: string
    status: string
    term?: {
        id: string
        name: string
    }
    session?: {
        id: string
        name: string
    }
    updatedAt: string | Date
}

interface ParentResultsCardProps {
    results: Result[]
}

export function ParentResultsCard({ results }: ParentResultsCardProps) {
    const [studentFilter, setStudentFilter] = useState<string>("all")
    const [termFilter, setTermFilter] = useState<string>("all")
    const [sessionFilter, setSessionFilter] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<"list" | "card">("list")

    // Extract unique students, terms, and sessions from results
    const students = [...new Map(results.map(r => [r.student.id, r.student])).values()]
    const terms = [...new Map(results.filter(r => r.term).map(r => [r.term?.id, r.term])).values()]
    const sessions = [...new Map(results.filter(r => r.session).map(r => [r.session?.id, r.session])).values()]

    // Filter results based on selected filters
    const filteredResults = results.filter((result) => {
        if (studentFilter !== "all" && result.student.id !== studentFilter) {
            return false
        }

        if (termFilter !== "all" && (!result.term || result.term.id !== termFilter)) {
            return false
        }

        if (sessionFilter !== "all" && (!result.session || result.session.id !== sessionFilter)) {
            return false
        }

        if (searchTerm) {
            const search = searchTerm.toLowerCase()
            return (
                result.student.user.name.toLowerCase().includes(search) ||
                result.subject.name.toLowerCase().includes(search) ||
                (result.subject.code?.toLowerCase().includes(search) || false)
            )
        }

        return true
    })

    // Calculate percentages and apply grades
    const getGrade = (percentage: number) => {
        if (percentage >= 90) return "A+"
        if (percentage >= 80) return "A"
        if (percentage >= 70) return "B"
        if (percentage >= 60) return "C"
        if (percentage >= 50) return "D"
        return "F"
    }

    const getBadgeVariant = (percentage: number) => {
        if (percentage >= 70) return "outline"
        if (percentage >= 50) return "secondary"
        return "destructive"
    }

    return (
        <Card className="border-primary/10 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="bg-primary/5">
                <div className="flex items-center justify-between">
                    <CardTitle>Academic Results</CardTitle>
                    <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <CardDescription>Approved academic results for your children</CardDescription>
            </CardHeader>

            <CardContent className="p-6">
                {results.length === 0 ? (
                    <div className="text-center py-8">
                        <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                        <h3 className="mt-4 text-lg font-medium">No Approved Results</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            There are no approved academic results available at this time.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search results..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1.5 h-7 w-7"
                                        onClick={() => setSearchTerm("")}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Select value={studentFilter} onValueChange={setStudentFilter}>
                                    <SelectTrigger className="w-full md:w-[180px]">
                                        <SelectValue placeholder="Student" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Students</SelectItem>
                                        {students.map((student) => (
                                            <SelectItem key={student.id} value={student.id}>
                                                {student.user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={termFilter} onValueChange={setTermFilter}>
                                    <SelectTrigger className="w-full md:w-[150px]">
                                        <SelectValue placeholder="Term" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Terms</SelectItem>
                                        {terms.map((term) => (
                                            <SelectItem key={term?.id} value={term?.id || ""}>
                                                {term?.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="hidden md:block">
                                    <Select value={sessionFilter} onValueChange={setSessionFilter}>
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="Session" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Sessions</SelectItem>
                                            {sessions.map((session) => (
                                                <SelectItem key={session?.id} value={session?.id || ""}>
                                                    {session?.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="hidden md:flex gap-2">
                                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "card")}>
                                    <TabsList className="h-10">
                                        <TabsTrigger value="list" className="px-3">List</TabsTrigger>
                                        <TabsTrigger value="card" className="px-3">Cards</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </div>

                        <div className="md:hidden">
                            <Select value={sessionFilter} onValueChange={setSessionFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Session" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sessions</SelectItem>
                                    {sessions.map((session) => (
                                        <SelectItem key={session?.id} value={session?.id || ""}>
                                            {session?.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {filteredResults.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No results match your filters</p>
                            </div>
                        ) : viewMode === "list" ? (
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Score</TableHead>
                                            <TableHead>Grade</TableHead>
                                            <TableHead className="hidden md:table-cell">Term / Session</TableHead>
                                            <TableHead className="w-[60px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredResults.map((result) => {
                                            const percentage = Math.round((result.marks / result.totalMarks) * 100)
                                            const calculatedGrade = result.grade || getGrade(percentage)

                                            return (
                                                <Collapsible
                                                    key={result.id}
                                                    open={expandedId === result.id}
                                                    onOpenChange={() => setExpandedId(expandedId === result.id ? null : result.id)}
                                                >
                                                    <TableRow className="group">
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={result.student.user.image || ""} />
                                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                                        {result.student.user.name.substring(0, 2).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="font-medium">{result.student.user.name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {result.subject.name}
                                                            {result.subject.code && (
                                                                <span className="text-xs text-muted-foreground ml-1">
                                                                    ({result.subject.code})
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={getBadgeVariant(percentage)}>
                                                                {result.marks}/{result.totalMarks} ({percentage}%)
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={
                                                                calculatedGrade === "F" ? "border-destructive text-destructive" :
                                                                    calculatedGrade.startsWith("A") ? "border-green-500 text-green-600" :
                                                                        "border-primary text-primary"
                                                            }>
                                                                {calculatedGrade}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell">
                                                            <div className="flex flex-col text-xs">
                                                                <span>{result.term?.name || "N/A"}</span>
                                                                <span className="text-muted-foreground">{result.session?.name || "N/A"}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <CollapsibleTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expandedId === result.id ? "rotate-180" : ""
                                                                        }`} />
                                                                </Button>
                                                            </CollapsibleTrigger>
                                                        </TableCell>
                                                    </TableRow>

                                                    <CollapsibleContent>
                                                        <TableRow className="bg-muted/50">
                                                            <TableCell colSpan={6} className="p-4">
                                                                <div className="grid md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <h4 className="text-sm font-medium mb-2">Result Details</h4>
                                                                        <div className="grid grid-cols-2 gap-y-1 text-sm">
                                                                            <div className="text-muted-foreground">Student</div>
                                                                            <div>{result.student.user.name}</div>
                                                                            <div className="text-muted-foreground">Subject</div>
                                                                            <div>{result.subject.name}</div>
                                                                            <div className="text-muted-foreground">Score</div>
                                                                            <div className="font-medium">{result.marks}/{result.totalMarks} ({percentage}%)</div>
                                                                            <div className="text-muted-foreground">Grade</div>
                                                                            <div>{calculatedGrade}</div>
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <h4 className="text-sm font-medium mb-2">Academic Information</h4>
                                                                        <div className="grid grid-cols-2 gap-y-1 text-sm">
                                                                            <div className="text-muted-foreground">Term</div>
                                                                            <div>{result.term?.name || "N/A"}</div>
                                                                            <div className="text-muted-foreground">Session</div>
                                                                            <div>{result.session?.name || "N/A"}</div>
                                                                            <div className="text-muted-foreground">Status</div>
                                                                            <div className="flex items-center">
                                                                                <Badge className="bg-green-100 text-green-800 border-0">
                                                                                    <Check className="h-3 w-3 mr-1" />
                                                                                    Approved
                                                                                </Badge>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {result.remarks && (
                                                                    <>
                                                                        <Separator className="my-3" />
                                                                        <div>
                                                                            <h4 className="text-sm font-medium mb-1">Remarks</h4>
                                                                            <p className="text-sm">{result.remarks}</p>
                                                                        </div>
                                                                    </>
                                                                )}

                                                                <div className="flex justify-end mt-4">
                                                                    <Button variant="outline" size="sm">
                                                                        <Download className="h-4 w-4 mr-2" />
                                                                        Download Report
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredResults.map((result) => {
                                    const percentage = Math.round((result.marks / result.totalMarks) * 100)
                                    const calculatedGrade = result.grade || getGrade(percentage)

                                    return (
                                        <Card key={result.id} className="overflow-hidden">
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-base">{result.subject.name}</CardTitle>
                                                    <Badge variant="outline" className={
                                                        calculatedGrade === "F" ? "border-destructive text-destructive" :
                                                            calculatedGrade.startsWith("A") ? "border-green-500 text-green-600" :
                                                                "border-primary text-primary"
                                                    }>
                                                        {calculatedGrade}
                                                    </Badge>
                                                </div>
                                                <CardDescription className="flex items-center justify-between">
                                                    <span>{result.term?.name || "N/A"}</span>
                                                    <span>{result.session?.name || "N/A"}</span>
                                                </CardDescription>
                                            </CardHeader>

                                            <CardContent className="pb-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center space-x-2">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={result.student.user.image || ""} />
                                                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                                {result.student.user.name.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm font-medium">{result.student.user.name}</span>
                                                    </div>

                                                    <Badge variant={getBadgeVariant(percentage)}>
                                                        {percentage}%
                                                    </Badge>
                                                </div>

                                                <div className="bg-muted/50 rounded-md p-3">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm">Score:</span>
                                                        <span className="text-sm font-medium">{result.marks}/{result.totalMarks}</span>
                                                    </div>

                                                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`h-full ${percentage >= 70 ? "bg-green-500" :
                                                                    percentage >= 50 ? "bg-amber-500" :
                                                                        "bg-red-500"
                                                                }`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>

                                                    {result.remarks && (
                                                        <div className="mt-3 text-xs">
                                                            <p className="text-muted-foreground">{result.remarks}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
} 