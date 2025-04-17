"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { DiaperChange } from "@/types/diaper"
import { format } from "date-fns"
import { useTranslate } from "@/utils/translate"

// Simplified diaper brands
const DIAPER_BRANDS = [
  { value: "pampers", label: "Pampers" },
  { value: "huggies", label: "Huggies" },
  { value: "lillydoo", label: "Lillydoo" },
  { value: "dm", label: "dm" },
  { value: "rossmann", label: "Rossmann" },
  { value: "stoffwindel", label: "Stoffwindel" },
  { value: "lidl", label: "Lidl" },
  { value: "aldi", label: "Aldi" },
  { value: "andere", label: "Andere" },
]

interface EditDiaperDialogProps {
  change: DiaperChange
  onUpdate: (change: DiaperChange) => void
  onClose: () => void
}

export default function EditDiaperDialog({ change, onUpdate, onClose }: EditDiaperDialogProps) {
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [diaperType, setDiaperType] = useState<"urine" | "stool">("urine")
  const [diaperBrand, setDiaperBrand] = useState("")
  const [temperature, setTemperature] = useState("")
  const [hasLeakage, setHasLeakage] = useState(false)
  const [abnormalities, setAbnormalities] = useState("")

  const t = useTranslate()

  useEffect(() => {
    const changeDate = new Date(change.timestamp)
    setDate(format(changeDate, "yyyy-MM-dd"))
    setTime(format(changeDate, "HH:mm"))
    setDiaperType(change.containsStool ? "stool" : "urine")

    // Check if the brand is in our predefined list
    const isPredefinedBrand = DIAPER_BRANDS.some((brand) => brand.value === change.diaperBrand)
    if (change.diaperBrand && !isPredefinedBrand) {
      setDiaperBrand("andere")
    } else {
      setDiaperBrand(change.diaperBrand || "")
    }

    setTemperature(change.temperature ? change.temperature.toString() : "")
    setHasLeakage(change.leakage || false)
    setAbnormalities(change.abnormalities || "")
  }, [change])

  const handleSubmit = () => {
    if (!date || !time) return

    const [year, month, day] = date.split("-").map(Number)
    const [hours, minutes] = time.split(":").map(Number)
    const timestamp = new Date(year, month - 1, day, hours, minutes)

    const updatedChange: DiaperChange = {
      ...change,
      timestamp: timestamp.toISOString(),
      containsUrine: true, // Always true, as stool usually comes with urine
      containsStool: diaperType === "stool",
      diaperBrand: diaperBrand || undefined,
      temperature: temperature ? Number.parseFloat(temperature) : undefined,
      leakage: hasLeakage || undefined,
      abnormalities: abnormalities || undefined,
    }

    onUpdate(updatedChange)
    onClose()
  }

  const isAbnormalTemperature = (temp: number) => {
    return temp < 36.5 || temp > 37.5
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("editDiaperEntry")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>{t("diaperType")}</Label>
            <RadioGroup
              value={diaperType}
              onValueChange={(value) => setDiaperType(value as "urine" | "stool")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="urine" id="edit-urine" className="text-yellow-500 border-yellow-500" />
                <Label htmlFor="edit-urine" className="text-yellow-700">
                  <span className="text-lg mr-1">💧</span> {t("urineOnly")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stool" id="edit-stool" className="text-amber-700 border-amber-700" />
                <Label htmlFor="edit-stool" className="text-amber-800">
                  <span className="text-lg mr-1">💩</span> {t("stool")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-date">{t("date")}</Label>
              <Input id="edit-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-time">{t("time")}</Label>
              <Input id="edit-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          {/* Diaper brand first */}
          <div className="space-y-2">
            <Label htmlFor="edit-diaper-brand">{t("diaperBrand")}</Label>
            <Select value={diaperBrand} onValueChange={setDiaperBrand}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectDiaperBrand")} />
              </SelectTrigger>
              <SelectContent>
                {DIAPER_BRANDS.map((brand) => (
                  <SelectItem key={brand.value} value={brand.value}>
                    {brand.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Temperature second */}
          <div className="space-y-2">
            <Label htmlFor="edit-temperature">{t("temperature")}</Label>
            <Input
              id="edit-temperature"
              type="number"
              step="0.1"
              placeholder={t("temperatureExample")}
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className={temperature && isAbnormalTemperature(Number.parseFloat(temperature)) ? "border-red-500" : ""}
            />
            {temperature && isAbnormalTemperature(Number.parseFloat(temperature)) && (
              <p className="text-xs text-red-500 mt-1">{t("temperatureWarning")}</p>
            )}
          </div>

          {/* Leakage and abnormalities last */}
          <div className="flex items-center space-x-2">
            <Switch id="edit-leakage" checked={hasLeakage} onCheckedChange={setHasLeakage} />
            <Label htmlFor="edit-leakage">{t("leakage")}</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-abnormalities">{t("abnormalities")}</Label>
            <Textarea
              id="edit-abnormalities"
              placeholder={t("abnormalitiesExample")}
              value={abnormalities}
              onChange={(e) => setAbnormalities(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit}>{t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
