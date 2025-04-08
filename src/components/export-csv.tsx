'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { FeedingSession } from '@/types/feeding';
import type { Event } from '@/types/event';
import {
	feedingSessionsToCsv,
	eventsToCsv,
	downloadCsv,
} from '@/utils/csv-export';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ExportCsvProps {
	sessions: FeedingSession[];
	events: Event[];
}

export default function ExportCsv({ sessions, events }: ExportCsvProps) {
	const [isExporting, setIsExporting] = useState(false);
	const { toast } = useToast();

	const handleExportSessions = async () => {
		try {
			setIsExporting(true);

			// Ensure sessions is an array
			const sessionsArray = Array.isArray(sessions) ? sessions : [];

			if (sessionsArray.length === 0) {
				toast({
					title: 'Keine Daten zum Exportieren',
					description:
						'Es sind keine Stillzeiten vorhanden, die exportiert werden können.',
					variant: 'destructive',
				});
				return;
			}

			// Generate CSV content
			const csvContent = feedingSessionsToCsv(sessionsArray);

			// Generate filename with current date
			const date = format(new Date(), 'yyyy-MM-dd');
			const filename = `stillzeiten-${date}.csv`;

			// Download the CSV
			downloadCsv(csvContent, filename);

			toast({
				title: 'Export erfolgreich',
				description: `${sessionsArray.length} Stillzeiten wurden als CSV exportiert.`,
			});
		} catch (error) {
			console.error('Error exporting sessions:', error);
			toast({
				title: 'Fehler beim Exportieren',
				description: 'Die Stillzeiten konnten nicht exportiert werden.',
				variant: 'destructive',
			});
		} finally {
			setIsExporting(false);
		}
	};

	const handleExportEvents = async () => {
		try {
			setIsExporting(true);

			// Ensure events is an array
			const eventsArray = Array.isArray(events) ? events : [];

			if (eventsArray.length === 0) {
				toast({
					title: 'Keine Daten zum Exportieren',
					description:
						'Es sind keine Ereignisse vorhanden, die exportiert werden können.',
					variant: 'destructive',
				});
				return;
			}

			// Generate CSV content
			const csvContent = eventsToCsv(eventsArray);

			// Generate filename with current date
			const date = format(new Date(), 'yyyy-MM-dd');
			const filename = `ereignisse-${date}.csv`;

			// Download the CSV
			downloadCsv(csvContent, filename);

			toast({
				title: 'Export erfolgreich',
				description: `${eventsArray.length} Ereignisse wurden als CSV exportiert.`,
			});
		} catch (error) {
			console.error('Error exporting events:', error);
			toast({
				title: 'Fehler beim Exportieren',
				description: 'Die Ereignisse konnten nicht exportiert werden.',
				variant: 'destructive',
			});
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<div className="flex gap-2">
			<Button
				variant="outline"
				size="sm"
				onClick={handleExportSessions}
				disabled={isExporting}
				title="Stillzeiten als CSV exportieren"
			>
				<Download className="h-4 w-4 mr-1" />
				<span>Stillzeiten CSV</span>
			</Button>

			<Button
				variant="outline"
				size="sm"
				onClick={handleExportEvents}
				disabled={isExporting}
				title="Ereignisse als CSV exportieren"
			>
				<Download className="h-4 w-4 mr-1" />
				<span>Ereignisse CSV</span>
			</Button>
		</div>
	);
}
