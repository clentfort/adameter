export const de = {
  // App
  appTitle: "Baby-Tracker",
  loading: "Lade Daten...",

  // Tabs
  feedingTab: "Stillen",
  diaperTab: "Wickeln",
  growthTab: "Wachstum",
  eventsTab: "Ereignisse",
  statisticsTab: "Statistik",

  // Breastfeeding
  leftBreast: "Linke Brust",
  rightBreast: "Rechte Brust",
  next: "Nächste",
  endFeeding: "Stillen beenden",
  enterTimeManually: "Zeit manuell eingeben",
  start: "Beginn",

  // Manual time entry
  enterFeedingTimeManually: "Stillzeit manuell eingeben",
  minutes: "Minuten",
  save: "Speichern",

  // History
  history: "Verlauf",
  addEntry: "Eintrag hinzufügen",
  noFeedingRecorded: "Noch keine Stillzeiten erfasst.",
  note: "Hinweis",
  sessionCrossesMidnight: "Diese Sitzung geht über Mitternacht",
  duration: "Dauer",
  edit: "Bearbeiten",
  delete: "Löschen",

  // Edit session
  editFeedingTime: "Stillzeit bearbeiten",
  breast: "Brust",
  date: "Datum",
  startTime: "Startzeit",

  // Add historic session
  addHistoricFeeding: "Stillzeit nachtragen",

  // Delete confirmation
  deleteEntry: "Eintrag löschen",
  deleteConfirmation: "Möchtest du diesen Eintrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
  cancel: "Abbrechen",

  // Diaper
  urineOnly: "Nur Urin",
  stool: "Stuhl",
  urineDetails: "Urin-Windel - Details",
  stoolDetails: "Stuhl-Windel - Details",
  diaperBrand: "Windelmarke",
  selectDiaperBrand: "Windelmarke auswählen",
  temperature: "Temperatur (°C)",
  temperatureExample: "z.B. 37.2",
  temperatureWarning: "Achtung: Temperatur außerhalb des normalen Bereichs (36.5°C - 37.5°C)",
  leakage: "Windel ist ausgelaufen",
  abnormalities: "Auffälligkeiten",
  abnormalitiesExample: "z.B. Rötung, Ausschlag, etc.",

  // Edit diaper
  editDiaperEntry: "Wickeleintrag bearbeiten",
  diaperType: "Windel-Typ",
  time: "Uhrzeit",

  // Add historic diaper
  addHistoricDiaper: "Wickeleintrag nachtragen",
  noDiapersRecorded: "Noch keine Wickeleinträge erfasst.",

  // Growth
  addMeasurement: "Messung hinzufügen",
  editMeasurement: "Messung bearbeiten",
  newMeasurement: "Neue Messung hinzufügen",
  weight: "Gewicht (g)",
  weightExample: "z.B. 3500",
  height: "Größe (cm)",
  heightExample: "z.B. 50",
  notes: "Notizen (optional)",
  notesPlaceholder: "Zusätzliche Informationen",
  validationError: "Bitte gib mindestens ein Gewicht oder eine Größe ein.",
  noMeasurementsRecorded: "Noch keine Messungen erfasst.",
  deleteMeasurement: "Messung löschen",
  deleteMeasurementConfirmation:
    "Möchtest du diese Messung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",

  // Events
  events: "Ereignisse",
  addEvent: "Ereignis hinzufügen",
  allEvents: "Alle Ereignisse",
  noEventsRecorded: "Noch keine Ereignisse erfasst.",
  deleteEvent: "Ereignis löschen",
  deleteEventConfirmation:
    "Möchtest du dieses Ereignis wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
  editEvent: "Ereignis bearbeiten",
  newEvent: "Neues Ereignis hinzufügen",
  title: "Titel",
  titleExample: "z.B. Geburt, Impfung, Krankheit",
  description: "Beschreibung (optional)",
  descriptionPlaceholder: "Weitere Details zum Ereignis",
  eventType: "Art des Ereignisses",
  pointEvent: "Zeitpunkt (z.B. Impfung)",
  periodEvent: "Zeitraum (z.B. Krankheit)",
  setEndDate: "Enddatum festlegen",
  endDate: "Enddatum",
  endTime: "Endzeit",
  color: "Farbe",
  ongoing: "laufend",

  // Statistics
  statistics: "Statistik",
  timeRange: "Zeitraum",
  last7Days: "Letzte 7 Tage",
  last14Days: "Letzte 14 Tage",
  last30Days: "Letzte 30 Tage",
  allData: "Alle Daten",
  noDataAvailable: "Keine Daten für den ausgewählten Zeitraum verfügbar.",
  noFeedingDataAvailable: "Keine Stilldaten für den ausgewählten Zeitraum verfügbar.",
  noDiaperDataAvailable: "Keine Wickeldaten für den ausgewählten Zeitraum verfügbar.",
  noGrowthDataAvailable: "Keine Wachstumsdaten verfügbar.",

  // Time since last
  timeSinceLastFeeding: "Letzte Stillzeit",
  timeSinceLastDiaper: "Letzte Wickelzeit",
  ago: "vor",
  justNow: "gerade eben",
  minute: "Minute",
  minutes: "Minuten",
  hour: "Stunde",
  hours: "Stunden",
  day: "Tag",
  days: "Tage",
  noFeedingYet: "Noch keine Stillzeit erfasst",
  noDiaperChangeYet: "Noch keine Wickelzeit erfasst",

  // Import/Export
  importData: "Importieren",
  exportData: "Exportieren",
  importTitle: "Daten importieren",
  importDescription: "Füge eine Export-URL ein, um Daten zu importieren.",
  exportUrl: "Export-URL",
  urlPlaceholder: "https://example.com/#data=...",
  importUrlDescription: "Füge die vollständige URL ein, die du beim Exportieren erhalten hast.",
  next: "Weiter",
  importConfirmation:
    "Es wurden {sessions} Stillzeiten, {events} Ereignisse, {measurements} Messungen und {diaperChanges} Wickeleinträge zum Import gefunden.",
  importWarning:
    "Achtung: Beim Import werden deine vorhandenen Daten überschrieben. Dieser Vorgang kann nicht rückgängig gemacht werden.",
  confirmOverwrite: 'Gib "überschreiben" ein, um den Import zu bestätigen:',
  overwritePlaceholder: "überschreiben",
  importButton: "Importieren",
  exportTitle: "Daten exportieren",
  exportDescription: "Wähle eine Exportmethode für deine Daten.",
  urlExport: "URL Export",
  csvExport: "CSV Export",
  copy: "Kopieren",
  urlExportDescription: "Öffne diese URL auf dem anderen Gerät, um die Daten zu importieren.",
  exportAllAsZip: "Alle Daten als ZIP exportieren",
  zipExportDescription: "Exportiert alle Daten in einer ZIP-Datei mit CSV- und JSON-Dateien.",
  exportSessions: "Stillzeiten als CSV",
  exportEvents: "Ereignisse als CSV",
  exportMeasurements: "Wachstumsmessungen als CSV",
  close: "Schließen",

  // Language
  language: "Sprache",
  german: "Deutsch",
  english: "Englisch",
}
