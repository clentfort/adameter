import type { DiaperChange } from '@/types/diaper';
import type { Event } from '@/types/event';
import type { FeedingSession } from '@/types/feeding';
import type { GrowthMeasurement } from '@/types/growth';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import JSZip from 'jszip';

const escapeCSV = (field: string): string => {
	if (field.includes(',') || field.includes('"') || field.includes('\n')) {
		return `"${field.replaceAll('"', '""')}"`;
	}
	return field;
};

export const feedingSessionsToCsv = (sessions: FeedingSession[]): string => {
	if (sessions.length === 0) {
		return 'Brust,Startzeit,Endzeit,Dauer (Sekunden),Dauer (formatiert)\n';
	}

	const header =
		'Brust,Startzeit,Endzeit,Dauer (Sekunden),Dauer (formatiert)\n';

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

			const minutes = Math.floor(session.durationInSeconds / 60);
			const seconds = session.durationInSeconds % 60;
			const formattedDuration = `${minutes} Min. ${seconds} Sek.`;

			return `${breast},${escapeCSV(startTime)},${escapeCSV(endTime)},${session.durationInSeconds},${escapeCSV(formattedDuration)}`;
		})
		.join('\n');

	return header + rows;
};

export const eventsToCsv = (events: Event[]): string => {
	if (events.length === 0) {
		return 'Titel,Beschreibung,Startzeit,Endzeit,Typ,Farbe\n';
	}

	const header = 'Titel,Beschreibung,Startzeit,Endzeit,Typ,Farbe\n';

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

export const growthMeasurementsToCsv = (
	measurements: GrowthMeasurement[],
): string => {
	if (measurements.length === 0) {
		return 'Datum,Gewicht (g),Größe (cm),Notizen\n';
	}

	const header = 'Datum,Gewicht (g),Größe (cm),Notizen\n';

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

export const diaperChangesToCsv = (changes: DiaperChange[]): string => {
	if (changes.length === 0) {
		return 'Zeitpunkt,Typ,Temperatur,Windelmarke,Ausgelaufen,Auffälligkeiten\n';
	}

	const header =
		'Zeitpunkt,Typ,Temperatur,Windelmarke,Ausgelaufen,Auffälligkeiten\n';

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

export const createJsonExport = (
	sessions: FeedingSession[],
	events: Event[],
	measurements: GrowthMeasurement[],
	diaperChanges: DiaperChange[],
): string => {
	const exportData = {
		diaperChanges,
		events,
		measurements,
		sessions,
	};

	return JSON.stringify(exportData, null, 2);
};

export const downloadAllAsZip = async (
	sessions: FeedingSession[],
	events: Event[],
	measurements: GrowthMeasurement[],
	diaperChanges: DiaperChange[],
): Promise<void> => {
	try {
		const zip = new JSZip();

		zip.file('stillzeiten.csv', feedingSessionsToCsv(sessions));
		zip.file('ereignisse.csv', eventsToCsv(events));
		zip.file('wachstum.csv', growthMeasurementsToCsv(measurements));
		zip.file('windeln.csv', diaperChangesToCsv(diaperChanges));

		zip.file(
			'alle_daten.json',
			createJsonExport(sessions, events, measurements, diaperChanges),
		);

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

		const content = await zip.generateAsync({ type: 'blob' });

		const date = format(new Date(), 'yyyy-MM-dd');
		const filename = `baby-tracker-export-${date}.zip`;

		const link = document.createElement('a');
		link.href = URL.createObjectURL(content);
		link.download = filename;
		link.style.display = 'none';

		document.body.append(link);
		link.click();
		document.body.removeChild(link);

		setTimeout(() => {
			URL.revokeObjectURL(link.href);
		}, 100);

		return;
	} catch (error) {
		throw error;
	}
};

export const downloadCsv = (csvContent: string, filename: string): void => {
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);
	link.setAttribute('href', url);
	link.setAttribute('download', filename);
	link.style.visibility = 'hidden';
	document.body.append(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};
