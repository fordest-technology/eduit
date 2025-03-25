// import { Event, EventCreateInput, EventUpdateInput } from "";

import { EventCreateInput, EventUpdateInput } from "../types/events";
import { z } from "zod";
import { eventSchema } from "../schemas/event";

export async function fetchEvents(filters?: {
  startDate?: Date;
  endDate?: Date;
  classId?: string;
}) {
  const searchParams = new URLSearchParams();
  if (filters?.startDate)
    searchParams.append("startDate", filters.startDate.toISOString());
  if (filters?.endDate)
    searchParams.append("endDate", filters.endDate.toISOString());
  if (filters?.classId) searchParams.append("classId", filters.classId);

  const response = await fetch(`/api/upcoming-events?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch events");
  const events = await response.json();
  return events.map((event: any) => ({
    ...event,
    startDate: new Date(event.startDate),
    endDate: event.endDate ? new Date(event.endDate) : null,
    createdAt: new Date(event.createdAt),
    updatedAt: new Date(event.updatedAt),
  }));
}

export async function createEvent(data: z.infer<typeof eventSchema>) {
  const formattedData = {
    ...data,
    startDate: data.startDate.toISOString(),
    endDate: data.endDate.toISOString(),
  };
  const response = await fetch("/api/upcoming-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formattedData),
  });
  if (!response.ok) throw new Error("Failed to create event");
  return response.json() as Promise<Event>;
}

export async function updateEvent(
  id: string,
  data: z.infer<typeof eventSchema>
) {
  const formattedData = {
    ...data,
    startDate: data.startDate.toISOString(),
    endDate: data.endDate.toISOString(),
  };
  const response = await fetch(`/api/upcoming-events/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formattedData),
  });
  if (!response.ok) throw new Error("Failed to update event");
  return response.json() as Promise<Event>;
}

export async function deleteEvent(id: string) {
  const response = await fetch(`/api/upcoming-events/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete event");
}
