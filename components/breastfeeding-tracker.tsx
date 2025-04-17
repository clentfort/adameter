"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { FeedingSession } from "@/types/feeding"
import { useTranslate } from "@/utils/translate"

interface BreastfeedingTrackerProps {
  onSessionComplete: (session: FeedingSession) => void
  nextBreast: "left" | "right" | null
}

// Keys for localStorage
const ACTIVE_BREAST_KEY = "activeBreast"
const START_TIME_KEY = "startTime"

export default function BreastfeedingTracker({ onSessionComplete, nextBreast }: BreastfeedingTrackerProps) {
  const [activeBreast, setActiveBreast] = useState<"left" | "right" | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [manualMinutes, setManualMinutes] = useState("")
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const t = useTranslate()

  // Check for active session on component mount
  useEffect(() => {
    const storedBreast = localStorage.getItem(ACTIVE_BREAST_KEY) as "left" | "right" | null
    const storedStartTime = localStorage.getItem(START_TIME_KEY)

    if (storedBreast && storedStartTime) {
      const parsedStartTime = new Date(storedStartTime)
      setActiveBreast(storedBreast)
      setStartTime(parsedStartTime)

      // Calculate elapsed time immediately
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - parsedStartTime.getTime()) / 1000)
      setElapsedTime(elapsed)
    }
  }, [])

  // Update timer every second when active
  useEffect(() => {
    if (startTime) {
      timerRef.current = setInterval(() => {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [startTime])

  const startFeeding = (breast: "left" | "right") => {
    const now = new Date()
    setActiveBreast(breast)
    setStartTime(now)
    setElapsedTime(0)

    // Store in localStorage
    localStorage.setItem(ACTIVE_BREAST_KEY, breast)
    localStorage.setItem(START_TIME_KEY, now.toISOString())
  }

  const endFeeding = () => {
    if (startTime && activeBreast) {
      const endTime = new Date()
      const durationInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

      const session: FeedingSession = {
        id: Date.now().toString(),
        breast: activeBreast,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationInSeconds,
      }

      onSessionComplete(session)
      resetTracker()
    }
  }

  const handleManualEntry = () => {
    if (activeBreast && manualMinutes && !isNaN(Number(manualMinutes))) {
      const minutes = Number(manualMinutes)
      const now = new Date()
      const calculatedStartTime = new Date(now.getTime() - minutes * 60 * 1000)

      const session: FeedingSession = {
        id: Date.now().toString(),
        breast: activeBreast,
        startTime: calculatedStartTime.toISOString(),
        endTime: now.toISOString(),
        durationInSeconds: minutes * 60,
      }

      onSessionComplete(session)
      setIsDialogOpen(false)
      resetTracker()
    }
  }

  const resetTracker = () => {
    setActiveBreast(null)
    setStartTime(null)
    setElapsedTime(0)
    setManualMinutes("")

    // Clear from localStorage
    localStorage.removeItem(ACTIVE_BREAST_KEY)
    localStorage.removeItem(START_TIME_KEY)

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="w-full">
      {!activeBreast ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <Button
              size="lg"
              className="h-24 text-lg w-full bg-left-breast hover:bg-left-breast-dark text-white"
              onClick={() => startFeeding("left")}
            >
              {t("leftBreast")}
            </Button>
            {nextBreast === "left" && <Badge className="absolute -top-2 -right-2 bg-left-breast">{t("next")}</Badge>}
          </div>
          <div className="relative">
            <Button
              size="lg"
              className="h-24 text-lg w-full bg-right-breast hover:bg-right-breast-dark text-white"
              onClick={() => startFeeding("right")}
            >
              {t("rightBreast")}
            </Button>
            {nextBreast === "right" && <Badge className="absolute -top-2 -right-2 bg-right-breast">{t("next")}</Badge>}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="text-center mb-2 w-full">
            <div
              className={`p-3 rounded-lg ${
                activeBreast === "left"
                  ? "bg-left-breast/10 border border-left-breast/30"
                  : "bg-right-breast/10 border border-right-breast/30"
              }`}
            >
              <p
                className={`text-lg font-medium ${
                  activeBreast === "left" ? "text-left-breast-dark" : "text-right-breast-dark"
                }`}
              >
                {activeBreast === "left" ? t("leftBreast") : t("rightBreast")}
              </p>
              <div className="mt-2">
                <p className="text-3xl font-bold">{formatTime(elapsedTime)}</p>
                {startTime && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {`${t("start")}:`} {startTime.getHours().toString().padStart(2, "0")}:
                    {startTime.getMinutes().toString().padStart(2, "0")}
                    {t.language === "de" ? " Uhr" : ""}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <Button
              size="lg"
              className={`h-16 ${
                activeBreast === "left"
                  ? "bg-left-breast hover:bg-left-breast-dark"
                  : "bg-right-breast hover:bg-right-breast-dark"
              }`}
              onClick={endFeeding}
            >
              {t("endFeeding")}
            </Button>
            <Button size="lg" className="h-16" variant="outline" onClick={() => setIsDialogOpen(true)}>
              {t("enterTimeManually")}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("enterFeedingTimeManually")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minutes" className="text-right col-span-1">
                {t("minutes")}
              </Label>
              <Input
                id="minutes"
                type="number"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(e.target.value)}
                className="col-span-3"
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleManualEntry}
              className={
                activeBreast === "left"
                  ? "bg-left-breast hover:bg-left-breast-dark"
                  : "bg-right-breast hover:bg-right-breast-dark"
              }
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
