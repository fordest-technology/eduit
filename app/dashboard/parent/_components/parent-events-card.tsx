"use client"

import { format } from "date-fns"
import { CalendarDays, MapPin, Clock, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Event {
    id: string
    title: string
    description: string
    location: string
    startDate: string | Date
    endDate: string | Date
    type: string
}

interface ParentEventsCardProps {
    events: Event[]
}

export function ParentEventsCard({ events }: ParentEventsCardProps) {
    const formatDate = (date: string | Date) => {
        return format(new Date(date), "PPP")
    }

    const formatTime = (date: string | Date) => {
        return format(new Date(date), "p")
    }

    const getEventTypeColor = (type: string) => {
        const typeMap: Record<string, string> = {
            ACADEMIC: "bg-blue-100 text-blue-800",
            SPORTS: "bg-green-100 text-green-800",
            CULTURAL: "bg-purple-100 text-purple-800",
            HOLIDAY: "bg-amber-100 text-amber-800",
            EXAM: "bg-red-100 text-red-800",
        }

        return typeMap[type] || "bg-gray-100 text-gray-800"
    }

    // Group events by month
    const eventsByMonth: Record<string, Event[]> = {}

    events.forEach(event => {
        const monthYear = format(new Date(event.startDate), "MMMM yyyy")
        if (!eventsByMonth[monthYear]) {
            eventsByMonth[monthYear] = []
        }
        eventsByMonth[monthYear].push(event)
    })

    return (
        <Card className="border-primary/10 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="bg-primary/5">
                <div className="flex items-center justify-between">
                    <CardTitle>School Events</CardTitle>
                    <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <CardDescription>Upcoming school events and activities</CardDescription>
            </CardHeader>

            <CardContent className="p-6">
                {events.length === 0 ? (
                    <div className="text-center py-8">
                        <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                        <h3 className="mt-4 text-lg font-medium">No Upcoming Events</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            There are no upcoming events scheduled at this time.
                        </p>
                    </div>
                ) : (
                    <Tabs defaultValue="list" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="list">List View</TabsTrigger>
                            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                        </TabsList>

                        <TabsContent value="list">
                            <ScrollArea className="h-[500px] pr-4">
                                {Object.entries(eventsByMonth).map(([month, monthEvents]) => (
                                    <div key={month} className="mb-6">
                                        <h3 className="text-sm font-medium text-muted-foreground mb-3">{month}</h3>
                                        <div className="space-y-4">
                                            {monthEvents.map((event) => (
                                                <Card key={event.id} className="overflow-hidden">
                                                    <div className="flex flex-col md:flex-row">
                                                        <div className="bg-primary/5 p-4 text-center md:w-36 flex flex-col justify-center">
                                                            <div className="text-3xl font-bold">
                                                                {format(new Date(event.startDate), "d")}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {format(new Date(event.startDate), "EEEE")}
                                                            </div>
                                                        </div>

                                                        <CardContent className="p-4 flex-1">
                                                            <div className="flex flex-col space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <h3 className="font-medium">{event.title}</h3>
                                                                    <Badge className={`${getEventTypeColor(event.type)}`}>
                                                                        {event.type}
                                                                    </Badge>
                                                                </div>

                                                                <div className="text-sm text-muted-foreground">
                                                                    {event.description}
                                                                </div>

                                                                <Separator className="my-2" />

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                                    <div className="flex items-center">
                                                                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                                                        <span>
                                                                            {formatTime(event.startDate)} - {formatTime(event.endDate)}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center">
                                                                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                                                        <span>{event.location}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="calendar" className="h-[500px]">
                            <div className="grid gap-4">
                                <div className="bg-muted/50 p-4 rounded-lg text-center">
                                    <Info className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        A calendar view is coming soon. Please use the list view for now.
                                    </p>
                                </div>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Events This Month</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {events
                                                .filter(event => {
                                                    const eventMonth = new Date(event.startDate).getMonth();
                                                    const currentMonth = new Date().getMonth();
                                                    return eventMonth === currentMonth;
                                                })
                                                .map(event => (
                                                    <li key={event.id} className="flex items-start">
                                                        <div className="bg-primary/10 text-primary h-6 w-6 rounded-full flex items-center justify-center mr-2 mt-0.5 text-xs">
                                                            {format(new Date(event.startDate), "d")}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">{event.title}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatDate(event.startDate)}
                                                            </p>
                                                        </div>
                                                    </li>
                                                ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </CardContent>
        </Card>
    )
} 