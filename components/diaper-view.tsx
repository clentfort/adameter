"use client"
import DiaperTracker from "./diaper-tracker"
import DiaperHistoryList from "./diaper-history-list"
import AddHistoricDiaper from "./add-historic-diaper"
import type { DiaperChange } from "@/types/diaper"

interface DiaperViewProps {
  diaperChanges: DiaperChange[]
  onDiaperAdd: (change: DiaperChange) => void
  onDiaperUpdate: (change: DiaperChange) => void
  onDiaperDelete: (changeId: string) => void
}

export default function DiaperView({
  diaperChanges = [],
  onDiaperAdd,
  onDiaperUpdate,
  onDiaperDelete,
}: DiaperViewProps) {
  return (
    <div className="w-full">
      <DiaperTracker onDiaperChange={onDiaperAdd} diaperChanges={diaperChanges} />

      <div className="w-full mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Verlauf</h2>
          <AddHistoricDiaper onDiaperAdd={onDiaperAdd} diaperChanges={diaperChanges} />
        </div>
        <DiaperHistoryList changes={diaperChanges} onDiaperUpdate={onDiaperUpdate} onDiaperDelete={onDiaperDelete} />
      </div>
    </div>
  )
}
