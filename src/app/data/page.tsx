
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { toCsv, fromCsv, mergeData } from './utils/csv';
import { createZip, downloadZip, extractFiles } from './utils/zip';
import { diaperChanges } from '@/data/diaper-changes';
import { events } from '@/data/events';
import { feedingSessions } from '@/data/feeding-sessions';
import { growthMeasurements } from '@/data/growth-measurments';
import { medicationRegimensProxy as medicationRegimens } from '@/data/medication-regimens';
import { medicationsProxy as medications } from '@/data/medications';

const dataStores: { [key: string]: any[] } = {
	diaperChanges,
	events,
	feedingSessions,
	growthMeasurements,
	medicationRegimens,
	medications,
};

export default function DataPage() {
	const { toast } = useToast();
	const [isLoading, setIsLoading] = useState(false);

	const handleExport = async () => {
		setIsLoading(true);
		try {
			const allData = Object.entries(dataStores).map(([name, data]) => ({
				name,
				data,
			}));
			const files = allData
				.filter(({ data }) => data.length > 0)
				.map(({ name, data }) => ({
					name: `${name}.csv`,
					content: toCsv(name, data),
				}));
			const zipBlob = await createZip(files);
			downloadZip(zipBlob);
			toast.success('Data exported successfully.');
		} catch (error) {
			toast.error('Failed to export data.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		setIsLoading(true);
		try {
			const files = await extractFiles(file);
			for (const { name, content } of files) {
				const data = fromCsv(content);
				const store = dataStores[name];
				if (store) {
					mergeData(store, data);
				} else {
					console.warn(`Unknown data store: ${name}`);
				}
			}
			toast.success('Data imported successfully.');
		} catch (error) {
			toast.error('Failed to import data.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Export Data</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="mb-4">
						Download all your data as a ZIP file containing CSVs.
					</p>
					<Button onClick={handleExport} disabled={isLoading}>
						{isLoading ? 'Exporting...' : 'Export'}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Import Data</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="mb-4">
						Import data from a ZIP file containing CSVs. Existing data will
						not be overwritten.
					</p>
					<Input
						type="file"
						onChange={handleImport}
						disabled={isLoading}
						accept=".zip"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
