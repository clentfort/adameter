"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle } from "lucide-react"
import type { GrowthMeasurement } from "@/types/growth"
import { useTranslate } from "@/utils/translate"

interface AddGrowthMeasurementProps {
  measurement?: GrowthMeasurement // Optional for editing existing measurement
  onSave: (measurement: GrowthMeasurement) => void
  onClose?: () => void
}

export default function AddGrowthMeasurement({ measurement, onSave, onClose }: AddGrowthMeasurementProps) {
  const [open, setOpen] = useState(!!measurement)
  const [date, setDate] = useState(
    measurement?.date ? new Date(measurement.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
  )
  const [weight, setWeight] = useState(measurement?.weight?.toString() || "")
  const [height, setHeight] = useState(measurement?.height?.toString() || "")
  const [notes, setNotes] = useState(measurement?.notes || "")
  const [error, setError] = useState("")

  const t = useTranslate()

  const handleSave = () => {
    // Validate that at least one of weight or height is provided
    if (!weight && !height) {
      setError(t("validationError"))
      return
    }

    setError("")

    const newMeasurement: GrowthMeasurement = {
      id: measurement?.id || Date.now().toString(),
      date: new Date(`${date}T12:00:00`).toISOString(), // Use noon to avoid timezone issues
      weight: weight ? Number.parseFloat(weight) : undefined,
      height: height ? Number.parseFloat(height) : undefined,
      notes: notes || undefined,
    }

    onSave(newMeasurement)
    setOpen(false)
    if (onClose) onClose()
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen && onClose) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!measurement && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-1" />
            {t("addMeasurement")}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{measurement ? t("editMeasurement") : t("newMeasurement")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">{t("date")}</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">{t("weight")} (g)</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={t("weightExample")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">{t("height")} (cm)</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder={t("heightExample")}
                step="0.1"
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="notes">{t("notes")} (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
