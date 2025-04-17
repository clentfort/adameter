"use client"

import { useState } from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Calendar, Clock, ArrowRight } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Event } from "@/types/event"
import AddEventDialog from "./add-event-dialog"
import { useTranslate } from "@/utils/translate"

interface EventsListProps {
  events: Event[]
  onEventUpdate: (event: Event) => void
  onEventDelete: (eventId: string) => void
}

export default function EventsList({ events = [], onEventUpdate, onEventDelete }: EventsListProps) {
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null)

  // Ensure events is an array
  const eventsArray = Array.isArray(events) ? (Array.isArray(events) ? events : []) : []
  const t = useTranslate()

  if (eventsArray.length === 0) {
    return <p className="text-muted-foreground text-center py-4">{t("noEventsRecorded")}</p>
  }

  const handleDeleteConfirm = () => {
    if (eventToDelete) {
      onEventDelete(eventToDelete)
      setEventToDelete(null)
    }
  }

  // Sort events by start date (newest first)
  const sortedEvents = [...eventsArray].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  )

  return (
    <>
      <div className="space-y-4">
        {sortedEvents.map((event) => {
          const startDate = new Date(event.startDate)
          const endDate = event.endDate ? new Date(event.endDate) : null
          const isOngoing = event.type === "period" && !event.endDate

          return (
            <div
              key={event.id}
              className="border rounded-lg p-4 shadow-sm"
              style={{ borderLeftWidth: "4px", borderLeftColor: event.color || "#6366f1" }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-lg">{event.title}</p>
                  {event.description && <p className="text-sm text-muted-foreground mt-1">{event.description}</p>}
                  <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(startDate, "dd.MM.yyyy", { locale: de })}
                      {event.type === "period" && endDate && (
                        <>
                          <ArrowRight className="h-3 w-3 inline mx-1" />
                          {format(endDate, "dd.MM.yyyy", { locale: de })}
                        </>
                      )}
                      {isOngoing && <span className="ml-1 text-xs">{t("ongoing")}</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(startDate, "HH:mm", { locale: de })}
                      {event.type === "period" && endDate && (
                        <>
                          <ArrowRight className="h-3 w-3 inline mx-1" />
                          {format(endDate, "HH:mm", { locale: de })}
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEventToEdit(event)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">{t("edit")}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => setEventToDelete(event.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">{t("delete")}</span>
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteEvent")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteEventConfirmation")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {eventToEdit && (
        <AddEventDialog event={eventToEdit} onSave={onEventUpdate} onClose={() => setEventToEdit(null)} />
      )}
    </>
  )
}
