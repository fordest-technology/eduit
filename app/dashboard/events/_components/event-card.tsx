import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin } from "lucide-react"

interface Event {
  id: string
  title: string
  description: string
  date: Date | string
  time?: string
  location?: string
  type?: string
}

interface EventCardProps {
  event: Event
  isPast?: boolean
}

export default function EventCard({ event, isPast = false }: EventCardProps) {
  const eventDate = new Date(event.date)
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Card className={`overflow-hidden ${isPast ? "opacity-75" : ""}`}>
      <div className="bg-primary h-2" />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{event.title}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              {formattedDate}
            </CardDescription>
          </div>
          {event.type && <Badge variant={isPast ? "outline" : "default"}>{event.type}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm mb-4 line-clamp-3">{event.description}</p>
        <div className="flex flex-col space-y-1 text-sm text-muted-foreground">
          {event.time && (
            <div className="flex items-center">
              <Clock className="h-3.5 w-3.5 mr-2" />
              <span>{event.time}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center">
              <MapPin className="h-3.5 w-3.5 mr-2" />
              <span>{event.location}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

