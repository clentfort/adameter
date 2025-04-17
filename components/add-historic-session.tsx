"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { FeedingSession } from "@/types/feeding"
import { PlusCircle } from "lucide-react"
import { useTranslate } from "@/utils/translate"

interface AddHistoricSessionProps {
  onSessionAdd: (session: FeedingSession) => void
}

export default function AddHistoricSession({ onSessionAdd }: AddHistoricSessionProps) {
  const [open, setOpen] = useState(false)
  const [breast, setBreast] = useState<"left" | "right">("left")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [duration, setDuration] = useState("")

  const t = useTranslate()

  // Set default values for today's date and current time
  const setDefaultValues = () => {
    const now = new Date()
    const formattedDate = now.toISOString().split("T")[0]
    const formattedTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

    setDate(formattedDate)
    setTime(formattedTime)
    setDuration("")
    setBreast("left")
  }

  const handleSubmit = () => {
    if (!date || !time || !duration || isNaN(Number(duration))) {
      return
    }

    const durationInMinutes = Number(duration)
    const [year, month, day] = date.split("-").map(Number)
    const [hours, minutes] = time.split(":").map(Number)

    const startTime = new Date(year, month - 1, day, hours, minutes)
    const endTime = new Date(startTime.getTime() + durationInMinutes * 60 * 1000)

    const session: FeedingSession = {
      id: Date.now().toString(),
      breast,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationInSeconds: durationInMinutes * 60,
    }

    onSessionAdd(session)
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen)
        if (newOpen) {
          setDefaultValues()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle className="h-4 w-4 mr-1" />
          {t("addEntry")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("addHistoricFeeding")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>{t("breast")}</Label>
            <RadioGroup
              value={breast}
              onValueChange={(value) => setBreast(value as "left" | "right")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="left" id="left" className="text-left-breast border-left-breast" />
                <Label htmlFor="left" className="text-left-breast-dark">
                  {t("leftBreast")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="right" id="right" className="text-right-breast border-right-breast" />
                <Label htmlFor="right" className="text-right-breast-dark">
                  {t("rightBreast")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">{t("date")}</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">{t("startTime")}</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">{t("minutes")}</Label>
            <Input id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="1" />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            className={
              breast === "left"
                ? "bg-left-breast hover:bg-left-breast-dark"
                : "bg-right-breast hover:bg-right-breast-dark"
            }
          >
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
