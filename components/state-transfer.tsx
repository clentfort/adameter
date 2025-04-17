"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Share2, Download, FileArchiveIcon as FileZip } from "lucide-react"
import type { FeedingSession } from "@/types/feeding"
import type { Event } from "@/types/event"
import type { GrowthMeasurement } from "@/types/growth"
import type { DiaperChange } from "@/types/diaper"
import { useToast } from "@/hooks/use-toast"
import { useTranslate } from "@/utils/translate"
import { useLanguage } from "@/contexts/language-context"
import { downloadAllAsZip } from "@/utils/csv-export"

interface StateTransferProps {
  sessions: FeedingSession[]
  events?: Event[]
  measurements?: GrowthMeasurement[]
  diaperChanges?: DiaperChange[]
  userSettings?: object
  onImport: (
    sessions: FeedingSession[],
    events?: Event[],
    measurements?: GrowthMeasurement[],
    diaperChanges?: DiaperChange[],
  ) => void
}

export default function StateTransfer({
  sessions = [],
  events = [],
  measurements = [],
  diaperChanges = [],
  userSettings = {},
  onImport,
}: StateTransferProps) {
  const t = useTranslate()
  const { language } = useLanguage()
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [exportUrl, setExportUrl] = useState("")
  const [confirmText, setConfirmText] = useState("")
  const [importedData, setImportedData] = useState<{
    sessions: FeedingSession[]
    events: Event[]
    measurements: GrowthMeasurement[]
    diaperChanges: DiaperChange[]
  } | null>(null)
  const { toast } = useToast()
  const [exportTab, setExportTab] = useState<"url" | "csv">("url")
  const [isExporting, setIsExporting] = useState(false)

  // Add a new state for the import URL dialog:
  const [isImportUrlDialogOpen, setIsImportUrlDialogOpen] = useState(false)
  const [importUrl, setImportUrl] = useState("")

  // Ensure arrays are valid
  const sessionsArray = Array.isArray(sessions) ? sessions : []
  const eventsArray = Array.isArray(events) ? events : []
  const measurementsArray = Array.isArray(measurements) ? measurements : []
  const diaperChangesArray = Array.isArray(diaperChanges) ? diaperChanges : []

  // Check for hash in URL on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash
      if (hash && hash.startsWith("#data=")) {
        try {
          const encodedData = hash.substring(6) // Remove "#data="
          const jsonData = decodeURIComponent(atob(encodedData))
          const parsedData = JSON.parse(jsonData)

          // Handle different data formats for backward compatibility
          let sessions: FeedingSession[] = []
          let events: Event[] = []
          let measurements: GrowthMeasurement[] = []
          let diaperChanges: DiaperChange[] = []
		  let userSettings = {}

          // Case 1: New format with sessions, events, measurements, and diaperChanges
          if (parsedData && typeof parsedData === "object" && Array.isArray(parsedData.sessions)) {
            sessions = parsedData.sessions
            events = Array.isArray(parsedData.events) ? parsedData.events : []
            measurements = Array.isArray(parsedData.measurements) ? parsedData.measurements : []
            diaperChanges = Array.isArray(parsedData.diaperChanges) ? parsedData.diaperChanges : []
          }
          // Case 2: Old format with just an array of sessions
          else if (Array.isArray(parsedData)) {
            sessions = parsedData
          }
          // Case 3: Invalid format
          else {
            throw new Error("Invalid data format")
          }

          if (sessions.length > 0) {
            setImportedData({
              sessions,
              events,
              measurements,
              diaperChanges,
            })
            setIsImportDialogOpen(true)

            // Clear the hash from the URL without reloading the page
            history.pushState("", document.title, window.location.pathname + window.location.search)
          }
        } catch (error) {
          toast({
            title: t("importTitle"),
            description: t("importDescription"),
            variant: "destructive",
          })
        }
      }
    }
  }, [toast, t])

  const handleExport = () => {
    if (sessionsArray.length === 0) {
      toast({
        title: t("exportTitle"),
        description: t("noFeedingDataAvailable"),
        variant: "destructive",
      })
      return
    }

    const ACTIVE_BREAST_KEY = "activeBreast"
const START_TIME_KEY = "startTime"
    const storedBreast = localStorage.getItem(ACTIVE_BREAST_KEY) as "left" | "right" | null
    const storedStartTime = localStorage.getItem(START_TIME_KEY)

    // Check if language is stored in localStorage
    const storedLanguage = localStorage.getItem("language") as Locale

    try {
      const exportData = {
        sessions: sessionsArray,
        events: eventsArray,
        measurements: measurementsArray,
        diaperChanges: diaperChangesArray,
		userSettings: {
    storedBreast,
    storedStartTime,
    storedLanguage,
    }
      }

      const jsonData = JSON.stringify(exportData)
      const encodedData = btoa((jsonData))
      const url = `${window.location.origin}${window.location.pathname}#data=${encodedData}`
      setExportUrl(url)
      setIsExportDialogOpen(true)
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: t("exportTitle"),
        description: t("noDataAvailable"),
        variant: "destructive",
      })
    }
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(exportUrl)
      toast({
        title: t("copy"),
        description: t("urlExportDescription"),
      })
    } catch (error) {
      toast({
        title: t("exportTitle"),
        description: t("urlExportDescription"),
      })
    }
  }

  const handleImport = () => {
    const confirmTextRequired = language === "de" ? "überschreiben" : "overwrite"

    if (confirmText !== confirmTextRequired || !importedData) {
      return
    }

    onImport(importedData.sessions, importedData.events, importedData.measurements, importedData.diaperChanges)
    setIsImportDialogOpen(false)
    setConfirmText("")
    setImportedData(null)

    toast({
      title: t("importTitle"),
      description: t("importConfirmation", {
        sessions: importedData.sessions.length,
        events: importedData.events.length,
        measurements: importedData.measurements.length,
        diaperChanges: importedData.diaperChanges.length,
      }),
    })
  }

  const cancelImport = () => {
    setIsImportDialogOpen(false)
    setConfirmText("")
    setImportedData(null)
  }

  // Add a function to handle URL pasting and extraction:
  const handleImportUrl = () => {
    if (!importUrl.trim()) return

    try {
      // Extract the hash part from the URL, handling different URL formats
      let encodedData = ""

      // First try to find #data= in the URL
      if (importUrl.includes("#data=")) {
        encodedData = importUrl.split("#data=")[1]
        // Remove any additional hash parameters if present
        if (encodedData.includes("&")) {
          encodedData = encodedData.split("&")[0]
        }
      } else {
        throw new Error("No data found in URL")
      }

      if (!encodedData) {
        throw new Error("No data found in URL")
      }

      try {
        const jsonData = decodeURIComponent(atob(encodedData))
        const parsedData = JSON.parse(jsonData)

        // Handle different data formats for backward compatibility
        let sessions: FeedingSession[] = []
        let events: Event[] = []
        let measurements: GrowthMeasurement[] = []
        let diaperChanges: DiaperChange[] = []

        // Case 1: New format with sessions, events, measurements, and diaperChanges
        if (parsedData && typeof parsedData === "object" && Array.isArray(parsedData.sessions)) {
          sessions = parsedData.sessions
          events = Array.isArray(parsedData.events) ? parsedData.events : []
          measurements = Array.isArray(parsedData.measurements) ? parsedData.measurements : []
          diaperChanges = Array.isArray(parsedData.diaperChanges) ? parsedData.diaperChanges : []
        }
        // Case 2: Old format with just an array of sessions
        else if (Array.isArray(parsedData)) {
          sessions = parsedData
        }
        // Case 3: Invalid format
        else {
          throw new Error("Invalid data format")
        }

        if (sessions.length > 0) {
          setImportedData({
            sessions,
            events,
            measurements,
            diaperChanges,
          })
          setIsImportDialogOpen(true)
          setIsImportUrlDialogOpen(false)
          setImportUrl("")
        } else {
          throw new Error("No feeding sessions found in data")
        }
      } catch (decodeError) {
        console.error("Decode error:", decodeError)
        throw new Error("Could not decode data from URL")
      }
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: t("importTitle"),
        description: t("importDescription"),
        variant: "destructive",
      })
    }
  }

  // Handle ZIP export for all data
  const handleExportZip = async () => {
    try {
      setIsExporting(true)

      if (
        sessionsArray.length === 0 &&
        eventsArray.length === 0 &&
        measurementsArray.length === 0 &&
        diaperChangesArray.length === 0
      ) {
        toast({
          title: t("exportTitle"),
          description: t("noDataAvailable"),
          variant: "destructive",
        })
        return
      }

      // Download all data as ZIP
      await downloadAllAsZip(sessionsArray, eventsArray, measurementsArray, diaperChangesArray)

      toast({
        title: t("exportTitle"),
        description: t("zipExportDescription"),
      })
    } catch (error) {
      console.error("Error exporting data as ZIP:", error)
      toast({
        title: t("exportTitle"),
        description: t("zipExportDescription"),
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      {/* Import URL Dialog */}
      <Dialog open={isImportUrlDialogOpen} onOpenChange={setIsImportUrlDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("importTitle")}</DialogTitle>
            <DialogDescription>{t("importDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="import-url">{t("exportUrl")}</Label>
              <Input
                id="import-url"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder={t("urlPlaceholder")}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">{t("importUrlDescription")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportUrlDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleImportUrl}>{t("next")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("exportTitle")}</DialogTitle>
            <DialogDescription>{t("exportDescription")}</DialogDescription>
          </DialogHeader>

          <Tabs value={exportTab} onValueChange={(value) => setExportTab(value as "url" | "csv")} className="mt-4">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="url">{t("urlExport")}</TabsTrigger>
              <TabsTrigger value="csv">{t("csvExport")}</TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="export-url">{t("exportUrl")}</Label>
                <div className="flex gap-2">
                  <Input id="export-url" value={exportUrl} readOnly className="font-mono text-xs" />
                  <Button onClick={handleCopyUrl} variant="secondary">
                    {t("copy")}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t("urlExportDescription")}</p>
              </div>
            </TabsContent>

            <TabsContent value="csv" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Button onClick={handleExportZip} disabled={isExporting} className="w-full">
                    <FileZip className="h-4 w-4 mr-2" />
                    {t("exportAllAsZip")}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">{t("zipExportDescription")}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button onClick={() => setIsExportDialogOpen(false)}>{t("close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={(open) => !open && cancelImport()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("importTitle")}</DialogTitle>
            <DialogDescription>
              {t("importConfirmation", {
                sessions: importedData?.sessions.length || 0,
                events: importedData?.events.length || 0,
                measurements: importedData?.measurements.length || 0,
                diaperChanges: importedData?.diaperChanges.length || 0,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Alert variant="destructive">
              <AlertDescription>{t("importWarning")}</AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="confirm-text">{t("confirmOverwrite")}</Label>
              <Input
                id="confirm-text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={language === "de" ? "überschreiben" : "overwrite"}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={cancelImport} className="sm:order-1">
              {t("cancel")}
            </Button>
            <Button
              onClick={handleImport}
              disabled={confirmText !== (language === "de" ? "überschreiben" : "overwrite")}
              className="sm:order-2"
            >
              <Download className="h-4 w-4 mr-1" />
              {t("importButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setIsImportUrlDialogOpen(true)} title={t("importData")}>
          <Download className="h-4 w-4 mr-1" />
          {t("importData")}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport} title={t("exportData")}>
          <Share2 className="h-4 w-4 mr-1" />
          {t("exportData")}
        </Button>
      </div>
    </>
  )
}
