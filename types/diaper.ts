export interface DiaperChange {
  id: string
  timestamp: string // ISO string
  containsUrine: boolean
  containsStool: boolean
  temperature?: number // Optional temperature in Celsius
  diaperBrand?: string // Optional diaper brand
  leakage?: boolean // Optional leakage indicator
  abnormalities?: string // Optional notes about abnormalities
}

