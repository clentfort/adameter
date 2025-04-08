"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import GrowthMeasurementsList from "./growth-measurements-list"
import AddGrowthMeasurement from "./add-growth-measurement"
import type { GrowthMeasurement } from "@/types/growth"
import type { Event } from "@/types/event"
import { useTranslate } from "@/utils/translate"

interface GrowthViewProps {
  measurements: GrowthMeasurement[]
  events: Event[]
  onMeasurementAdd: (measurement: GrowthMeasurement) => void
  onMeasurementUpdate: (measurement: GrowthMeasurement) => void
  onMeasurementDelete: (measurementId: string) => void
}

export default function GrowthView({
  measurements = [],
  events = [],
  onMeasurementAdd,
  onMeasurementUpdate,
  onMeasurementDelete,
}: GrowthViewProps) {
  // Ensure measurements is an array
  const measurementsArray = Array.isArray(measurements) ? measurements : []

  const t = useTranslate()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t("growthTab")}</h2>
        <AddGrowthMeasurement onSave={onMeasurementAdd} />
      </div>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">{t("allMeasurements")}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <GrowthMeasurementsList
            measurements={measurementsArray}
            onMeasurementUpdate={onMeasurementUpdate}
            onMeasurementDelete={onMeasurementDelete}
          />
        </CardContent>
      </Card>
    </div>
  )
}

