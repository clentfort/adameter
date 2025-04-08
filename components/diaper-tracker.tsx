"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DiaperChange } from "@/types/diaper"
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

interface DiaperTrackerProps {
  onDiaperChange: (change: DiaperChange) => void
  diaperChanges: DiaperChange[]
}

export default function DiaperTracker({ onDiaperChange, diaperChanges = [] }: DiaperTrackerProps) {
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<"urine" | "stool" | null>(null)
  const [diaperBrand, setDiaperBrand] = useState("")
  const [temperature, setTemperature] = useState("")
  const [hasLeakage, setHasLeakage] = useState(false)
  const [abnormalities, setAbnormalities] = useState("")

  // Get the last used brand from the most recent diaper change
  const lastUsedBrand = diaperChanges.length > 0 && diaperChanges[0].diaperBrand ? diaperChanges[0].diaperBrand : ""

  const t = useTranslate()

  const handleQuickChange = (type: "urine" | "stool") => {
    setSelectedType(type)
    // Set the last used brand when opening the dialog
    setDiaperBrand(lastUsedBrand)
    setIsDetailsDialogOpen(true)
  }

  const handleSave = () => {
    if (!selectedType) return

    const now = new Date()
    const change: DiaperChange = {
      id: Date.now().toString(),
      timestamp: now.toISOString(),
      containsUrine: selectedType === "urine" || selectedType === "stool", // Stool usually also contains urine
      containsStool: selectedType === "stool",
      temperature: temperature ? Number.parseFloat(temperature) : undefined,
      diaperBrand: diaperBrand || undefined,
      leakage: hasLeakage || undefined,
      abnormalities: abnormalities || undefined,
    }

    onDiaperChange(change)
    resetForm()
  }

  const resetForm = () => {
    setSelectedType(null)
    setDiaperBrand("")
    setTemperature("")
    setHasLeakage(false)
    setAbnormalities("")
    setIsDetailsDialogOpen(false)
  }

  const isAbnormalTemperature = (temp: number) => {
    return temp < 36.5 || temp > 37.5
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-4">
        <Button
          size="lg"
          className="h-24 text-lg w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900"
          onClick={() => handleQuickChange("urine")}
        >
          <span className="text-2xl mr-2">💧</span> {t("urineOnly")}
        </Button>
        <Button
          size="lg"
          className="h-24 text-lg w-full bg-amber-700 hover:bg-amber-800 text-white"
          onClick={() => handleQuickChange("stool")}
        >
          <span className="text-2xl mr-2">💩</span> {t("stool")}
        </Button>
      </div>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedType === "urine" ? t("urineDetails") : t("stoolDetails")} - Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Diaper brand first */}
            <div className="space-y-2">
              <Label htmlFor="diaper-brand">{t("diaperBrand")}</Label>
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
              <Label htmlFor="temperature">{t("temperature")}</Label>
              <Input
                id="temperature"
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
              <Switch id="leakage" checked={hasLeakage} onCheckedChange={setHasLeakage} />
              <Label htmlFor="leakage">{t("leakage")}</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="abnormalities">{t("abnormalities")}</Label>
              <Textarea
                id="abnormalities"
                placeholder={t("abnormalitiesExample")}
                value={abnormalities}
                onChange={(e) => setAbnormalities(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSave}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

