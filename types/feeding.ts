export interface FeedingSession {
  id: string
  breast: "left" | "right"
  startTime: string
  endTime: string
  durationInSeconds: number
}

