import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface Event {
    id: string
    title: string
    startDate: string
    description?: string
}

interface ParentEventsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ParentEventsPage({ searchParams }: ParentEventsPageProps) {
    const params = await searchParams;
    // TODO: Fetch events data from your API
    const upcomingEvents: Event[] = []

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold tracking-tight mb-6">School Events</h1>

            <Card className="border-primary/10 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="bg-primary/5">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Upcoming Events</CardTitle>
                        <CalendarDays className="h-4 w-4 text-primary" />
                    </div>
                    <CardDescription>School events and activities</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                    {upcomingEvents.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingEvents.map((event) => (
                                <div key={event.id} className="flex items-start space-x-3">
                                    <div className="bg-primary/10 rounded-md p-2 text-primary">
                                        <CalendarDays className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium">{event.title}</h4>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(event.startDate), "PPP")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No upcoming events</p>
                    )}
                </CardContent>
                <CardFooter className="bg-muted/30 py-2">
                    <Link href="/dashboard/calendar" className="w-full">
                        <Button variant="ghost" size="sm" className="w-full">
                            View Calendar
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
} 