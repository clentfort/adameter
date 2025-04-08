export interface GrowthMeasurement {
  id: string
  date: string // ISO string
  weight?: number // in grams
  height?: number // in centimeters
  notes?: string
}

