import type { FeedingSession } from '@/types/feeding';
import type { Event } from '@/types/event';
import type { GrowthMeasurement } from '@/types/growth';
import type { DiaperChange } from '@/types/diaper';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import JSZip from 'jszip';

// Helper function to escape CSV fields
const escapeCSV = (field: string): string => {
	// If the field contains commas, quotes, or newlines, wrap it in quotes
	if (field.includes(',') || field.includes('"') || field.includes('\n')) {
		// Double up any quotes
		return `"${field.replaceAll('"', '""')}"`;
	}
	return field;
};

// Function to convert feeding sessions to CSV
export const feedingSessionsToCsv = (sessions: FeedingSession[]): string => {
	if (!Array.isArray(sessions) || sessions.length === 0) {
		return 'Brust,Startzeit,Endzeit,Dauer (Sekunden),Dauer (formatiert)\n';
	}

	// Create header row
	const header =
		'Brust,Startzeit,Endzeit,Dauer (Sekunden),Dauer (formatiert)\n';

	// Format each session as a CSV row
	const rows = sessions
		.map((session) => {
			const startTime = format(
				new Date(session.startTime),
				'dd.MM.yyyy HH:mm:ss',
				{ locale: de },
			);
			const endTime = format(new Date(session.endTime), 'dd.MM.yyyy HH:mm:ss', {
				locale: de,
			});
			const breast = session.breast === 'left' ? 'Links' : 'Rechts';

			// Format duration
			const minutes = Math.floor(session.durationInSeconds / 60);
			const seconds = session.durationInSeconds % 60;
			const formattedDuration = `${minutes} Min. ${seconds} Sek.`;

			return `${breast},${escapeCSV(startTime)},${escapeCSV(endTime)},${session.durationInSeconds},${escapeCSV(formattedDuration)}`;
		})
		.join('\n');

	return header + rows;
};

// Function to convert events to CSV
export const eventsToCsv = (events: Event[]): string => {
	if (!Array.isArray(events) || events.length === 0) {
		return 'Titel,Beschreibung,Startzeit,Endzeit,Typ,Farbe\n';
	}

	// Create header row
	const header = 'Titel,Beschreibung,Startzeit,Endzeit,Typ,Farbe\n';

	// Format each event as a CSV row
	const rows = events
		.map((event) => {
			const startTime = format(
				new Date(event.startDate),
				'dd.MM.yyyy HH:mm:ss',
				{ locale: de },
			);
			const endTime = event.endDate
				? format(new Date(event.endDate), 'dd.MM.yyyy HH:mm:ss', { locale: de })
				: '';
			const type = event.type === 'point' ? 'Zeitpunkt' : 'Zeitraum';

			return `${escapeCSV(event.title)},${escapeCSV(event.description || '')},${escapeCSV(startTime)},${escapeCSV(endTime)},${type},${event.color || ''}`;
		})
		.join('\n');

	return header + rows;
};

// Function to convert growth measurements to CSV
export const growthMeasurementsToCsv = (
	measurements: GrowthMeasurement[],
): string => {
	if (!Array.isArray(measurements) || measurements.length === 0) {
		return 'Datum,Gewicht (g),Größe (cm),Notizen\n';
	}

	// Create header row
	const header = 'Datum,Gewicht (g),Größe (cm),Notizen\n';

	// Format each measurement as a CSV row
	const rows = measurements
		.map((measurement) => {
			const date = format(new Date(measurement.date), 'dd.MM.yyyy', {
				locale: de,
			});
			const weight =
				measurement.weight !== undefined ? measurement.weight.toString() : '';
			const height =
				measurement.height !== undefined ? measurement.height.toString() : '';

			return `${escapeCSV(date)},${weight},${height},${escapeCSV(measurement.notes || '')}`;
		})
		.join('\n');

	return header + rows;
};

// Function to convert diaper changes to CSV
export const diaperChangesToCsv = (changes: DiaperChange[]): string => {
	if (!Array.isArray(changes) || changes.length === 0) {
		return 'Zeitpunkt,Typ,Temperatur,Windelmarke,Ausgelaufen,Auffälligkeiten\n';
	}

	// Create header row
	const header =
		'Zeitpunkt,Typ,Temperatur,Windelmarke,Ausgelaufen,Auffälligkeiten\n';

	// Format each change as a CSV row
	const rows = changes
		.map((change) => {
			const timestamp = format(
				new Date(change.timestamp),
				'dd.MM.yyyy HH:mm:ss',
				{ locale: de },
			);
			const type = change.containsStool ? 'Stuhl' : 'Nur Urin';
			const temperature =
				change.temperature !== undefined ? change.temperature.toString() : '';
			const diaperBrand = change.diaperBrand || '';
			const leakage = change.leakage ? 'Ja' : 'Nein';

			return `${escapeCSV(timestamp)},${type},${temperature},${diaperBrand},${leakage},${escapeCSV(change.abnormalities || '')}`;
		})
		.join('\n');

	return header + rows;
};

// Function to create a JSON export of all data
export const createJsonExport = (
	sessions: FeedingSession[],
	events: Event[],
	measurements: GrowthMeasurement[],
	diaperChanges: DiaperChange[],
): string => {
	const exportData = {
		diaperChanges: Array.isArray(diaperChanges) ? diaperChanges : [],
		events: Array.isArray(events) ? events : [],
		measurements: Array.isArray(measurements) ? measurements : [],
		sessions: Array.isArray(sessions) ? sessions : [],
	};

	return JSON.stringify(exportData, null, 2);
};

// Function to download all data as a ZIP file
export const downloadAllAsZip = async (
	sessions: FeedingSession[],
	events: Event[],
	measurements: GrowthMeasurement[],
	diaperChanges: DiaperChange[],
): Promise<void> => {
	try {
		// Create a new JSZip instance
		const zip = new JSZip();

		// Add CSV files to the zip
		zip.file('stillzeiten.csv', feedingSessionsToCsv(sessions));
		zip.file('ereignisse.csv', eventsToCsv(events));
		zip.file('wachstum.csv', growthMeasurementsToCsv(measurements));
		zip.file('windeln.csv', diaperChangesToCsv(diaperChanges));

		// Add a JSON file with all data
		zip.file(
			'alle_daten.json',
			createJsonExport(sessions, events, measurements, diaperChanges),
		);

		// Add a README file
		const readmeContent = `Stillzeit-Tracker Export
Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm:ss', { locale: de })}

Diese ZIP-Datei enthält folgende Dateien:
- stillzeiten.csv: Alle Stillzeiten im CSV-Format
- ereignisse.csv: Alle Ereignisse im CSV-Format
- wachstum.csv: Alle Wachstumsmessungen im CSV-Format
- windeln.csv: Alle Wickeleinträge im CSV-Format
- alle_daten.json: Alle Daten im JSON-Format für den Import

Die CSV-Dateien können in Excel, Google Sheets oder anderen Tabellenkalkulationsprogrammen geöffnet werden.
Die JSON-Datei kann für den Import in die Baby-Tracker App verwendet werden.`;

		zip.file('README.txt', readmeContent);

		// Generate the zip file
		const content = await zip.generateAsync({ type: 'blob' });

		// Generate filename with current date
		const date = format(new Date(), 'yyyy-MM-dd');
		const filename = `baby-tracker-export-${date}.zip`;

		// Create a download link
		const link = document.createElement('a');
		link.href = URL.createObjectURL(content);
		link.download = filename;
		link.style.display = 'none';

		// Add link to document, click it, and remove it
		document.body.append(link);
		link.click();
		document.body.removeChild(link);

		// Clean up the URL
		setTimeout(() => {
			URL.revokeObjectURL(link.href);
		}, 100);

		return;
	} catch (error) {
		console.error('Error creating ZIP file:', error);
		return Promise.reject(error);
	}
};

// Function to download CSV data (kept for backward compatibility)
export const downloadCsv = (csvContent: string, filename: string): void => {
	// Create a Blob with the CSV content
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

	// Create a download link
	const link = document.createElement('a');

	// Create a URL for the blob
	const url = URL.createObjectURL(blob);

	// Set link properties
	link.setAttribute('href', url);
	link.setAttribute('download', filename);
	link.style.visibility = 'hidden';

	// Add link to document, click it, and remove it
	document.body.append(link);
	link.click();
	document.body.removeChild(link);

	// Clean up the URL
	URL.revokeObjectURL(url);
};
