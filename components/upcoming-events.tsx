import { format } from "date-fns"
import { Calendar } from "lucide-react"

type Event = {
  id: string
  title: string
  description?: string | null
  startDate: string
  endDate?: string | null
  location?: string | null
}

interface UpcomingEventsProps {
  events: Event[]
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return {
        day: format(date, "d"),
        month: format(date, "MMM").toUpperCase(),
        fullDate: format(date, "PPP"),
        time: format(date, "p"),
      }
    } catch (error) {
      return {
        day: "N/A",
        month: "N/A",
        fullDate: dateString,
        time: "",
      }
    }
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No upcoming events</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const startDateFormatted = formatDate(event.startDate)

        return (
          <div key={event.id} className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-md bg-primary/10 flex flex-col items-center justify-center">
              <span className="text-xs font-medium text-primary">{startDateFormatted.month}</span>
              <span className="text-sm font-bold text-primary">{startDateFormatted.day}</span>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">{event.title}</p>
              <p className="text-xs text-muted-foreground">
                {startDateFormatted.fullDate}
                {event.location && ` • ${event.location}`}
              </p>
              {event.description && <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

