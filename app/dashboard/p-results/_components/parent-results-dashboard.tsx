import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ParentResultsDashboardProps {
    data: {
        children: {
            id: string
            user: {
                name: string
                email: string
            }
            results: Array<{
                id: string
                subject: {
                    name: string
                    code: string
                }
                period: {
                    name: string
                    startDate: Date
                    endDate: Date
                }
                session: {
                    name: string
                    isCurrent: boolean
                }
                totalScore: number
                grade: string
                componentScores: Array<{
                    component: string
                    score: number
                    maxScore: number
                }>
            }>
            currentClass: {
                name: string
                level: string
            } | null
        }[]
    }
}

export function ParentResultsDashboard({ data }: ParentResultsDashboardProps) {
    return (
        <Tabs defaultValue={data.children[0]?.id} className="space-y-4">
            <TabsList>
                {data.children.map((child) => (
                    <TabsTrigger key={child.id} value={child.id}>
                        {child.user.name}
                    </TabsTrigger>
                ))}
            </TabsList>
            {data.children.map((child) => (
                <TabsContent key={child.id} value={child.id} className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Student Information</CardTitle>
                            <CardDescription>
                                {child.currentClass ? (
                                    <div className="flex items-center gap-2">
                                        <span>Current Class:</span>
                                        <Badge variant="secondary">
                                            {child.currentClass.name} ({child.currentClass.level})
                                        </Badge>
                                    </div>
                                ) : (
                                    "No active class"
                                )}
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Academic Results</CardTitle>
                            <CardDescription>
                                View detailed results for each subject and period
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[600px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Period</TableHead>
                                            <TableHead>Session</TableHead>
                                            <TableHead>Total Score</TableHead>
                                            <TableHead>Grade</TableHead>
                                            <TableHead>Components</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {child.results.map((result) => (
                                            <TableRow key={result.id}>
                                                <TableCell>
                                                    <div className="font-medium">{result.subject.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {result.subject.code}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{result.period.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {new Date(result.period.startDate).toLocaleDateString()} -{" "}
                                                        {new Date(result.period.endDate).toLocaleDateString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={result.session.isCurrent ? "default" : "secondary"}>
                                                        {result.session.name}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">{result.totalScore}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{result.grade}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        {result.componentScores.map((score, index) => (
                                                            <div key={index} className="text-sm">
                                                                {score.component}: {score.score}/{score.maxScore}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            ))}
        </Tabs>
    )
} 