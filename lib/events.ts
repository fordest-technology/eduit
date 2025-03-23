type EventPayload = Record<string, any>;

/**
 * Tracks events for analytics purposes
 *
 * @param eventName - Name of the event to track
 * @param payload - Additional data to include with the event
 */
export async function eventTrack(
  eventName: string,
  payload: EventPayload = {}
) {
  // Log events in development mode
  if (process.env.NODE_ENV !== "production") {
    console.log(`[EVENT] ${eventName}`, payload);
    return;
  }

  try {
    // In production, this would send the event to an analytics service
    // This is a placeholder for future implementation

    // Example implementation with server logging:
    console.log(`Event tracked: ${eventName}`, {
      timestamp: new Date().toISOString(),
      ...payload,
    });

    // Future implementation could send to analytics service like:
    // await fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ event: eventName, data: payload })
    // });
  } catch (error) {
    // Silent failure in production, log in non-production environments
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to track event:", error);
    }
  }
}
