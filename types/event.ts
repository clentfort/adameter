export interface Event {
  id: string
  title: string
  description?: string
  startDate: string // ISO string
  endDate?: string // ISO string, optional for ongoing events
  type: "point" | "period" // point = single date, period = start to end date
  color?: string // Optional color for the event
}

