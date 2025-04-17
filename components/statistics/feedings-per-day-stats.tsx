import { format } from "date-fns"
import StatsCard from "./stats-card"
import type { FeedingSession } from "@/types/feeding"
import { useTranslate } from "@/utils/translate"

interface FeedingsPerDayStatsProps {
  sessions: FeedingSession[]
}

export default function FeedingsPerDayStats({ sessions = [] }: FeedingsPerDayStatsProps) {
  // Ensure sessions is an array
  const sessionsArray = Array.isArray(sessions) ? sessions : []
  const t = useTranslate()

  if (sessionsArray.length === 0) return null

  // Group sessions by day
  const sessionsByDay = new Map<string, number>()
  sessionsArray.forEach((session) => {
    const day = format(new Date(session.startTime), "yyyy-MM-dd")
    sessionsByDay.set(day, (sessionsByDay.get(day) || 0) + 1)
  })

  const days = Array.from(sessionsByDay.keys())
  const totalDays = days.length

  if (totalDays === 0) return null

  const totalFeedings = Array.from(sessionsByDay.values()).reduce((sum, count) => sum + count, 0)
  const avgFeedingsPerDay = totalFeedings / totalDays

  return (
    <StatsCard title={t("feedingsPerDay")}>
      <div className="text-2xl font-bold">{avgFeedingsPerDay.toFixed(1)}</div>
    </StatsCard>
  )
}
