"use client"

import { useState, useEffect } from "react"
import type { DiaperChange } from "@/types/diaper"
import { useTranslate } from "@/utils/translate"

interface TimeSinceLastDiaperProps {
  lastChange: DiaperChange | null
}

export default function TimeSinceLastDiaper({ lastChange }: TimeSinceLastDiaperProps) {
  const t = useTranslate()
  const [timeSince, setTimeSince] = useState<string>("")

  useEffect(() => {
    // Update time since last diaper change every minute
    const updateTimeSince = () => {
      if (!lastChange) {
        setTimeSince(t("noDiaperChangeYet"))
        return
      }

      const now = new Date()
      const lastChangeTime = new Date(lastChange.timestamp)
      const diffInMs = now.getTime() - lastChangeTime.getTime()
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      const diffInHours = Math.floor(diffInMinutes / 60)
      const diffInDays = Math.floor(diffInHours / 24)

      if (diffInMinutes < 1) {
        setTimeSince(t("justNow"))
      } else if (diffInMinutes < 60) {
        setTimeSince(t.formatTimeAgo(diffInMinutes, "minute"))
      } else if (diffInHours < 24) {
        setTimeSince(t.formatTimeAgo(diffInHours, "hour"))
      } else {
        setTimeSince(t.formatTimeAgo(diffInDays, "day"))
      }
    }

    updateTimeSince()
    const intervalId = setInterval(updateTimeSince, 60000) // Update every minute

    return () => clearInterval(intervalId)
  }, [lastChange, t])

  return (
    <div className="text-center bg-muted/20 rounded-lg p-2 flex-1">
      <div className="flex items-center justify-center gap-1">
        <span className="text-sm">👶</span>
        <p className="text-xs text-muted-foreground">{t("timeSinceLastDiaper")}</p>
      </div>
      <p className="text-sm font-medium">{timeSince}</p>
    </div>
  )
}
