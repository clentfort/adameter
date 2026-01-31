
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useContext, useState } from 'react';
import { yjsContext } from '@/contexts/yjs-context';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
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
	const { forceNewEpoch, epoch } = useContext(yjsContext);
	const { room, setRoom } = useContext(DataSynchronizationContext);
	const [newRoom, setNewRoom] = useState(room || '');

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
				mergeData(dataStores[name], data);
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

			<Card>
				<CardHeader>
					<CardTitle>Debug Settings</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<p className="text-sm font-medium">Room Name</p>
						<div className="flex gap-2">
							<Input
								value={newRoom}
								onChange={(e) => setNewRoom(e.target.value)}
								placeholder="Enter room name"
							/>
							<Button onClick={() => setRoom(newRoom)}>Update Room</Button>
						</div>
						<p className="text-xs text-muted-foreground">
							Current Room: {room || 'None'}
						</p>
					</div>

					<div className="space-y-2 pt-4 border-t">
						<p className="text-sm font-medium">Document Epoch</p>
						<div className="flex items-center justify-between">
							<p className="text-sm">Current Epoch: {epoch}</p>
							<Button variant="destructive" onClick={forceNewEpoch}>
								Force New Epoch
							</Button>
						</div>
						<p className="text-xs text-muted-foreground">
							Forcing a new epoch will clear the document history and move all
							connected clients to a new room and database.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
