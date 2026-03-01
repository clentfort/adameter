'use client';

import { fbt } from 'fbtee';
import { type ChangeEvent, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useDiaperChanges } from '@/hooks/use-diaper-changes';
import { useDiaperProducts } from '@/hooks/use-diaper-products';
import { useEvents } from '@/hooks/use-events';
import { useFeedingSessions } from '@/hooks/use-feeding-sessions';
import { useGrowthMeasurements } from '@/hooks/use-growth-measurements';
import { fromCsv, mergeData, toCsv } from '@/utils/data-transfer/csv';
import { createZip, downloadZip, extractFiles } from '@/utils/data-transfer/zip';

export default function DataSettingsPage() {
	const { toast } = useToast();
	const [isLoading, setIsLoading] = useState(false);

	const diaperChangesState = useDiaperChanges();
	const diaperProductsState = useDiaperProducts();
	const eventsState = useEvents();
	const feedingSessionsState = useFeedingSessions();
	const growthMeasurementsState = useGrowthMeasurements();

	const dataStores = useMemo(
		() => ({
			diaperChanges: diaperChangesState,
			diaperProducts: diaperProductsState,
			events: eventsState,
			feedingSessions: feedingSessionsState,
			growthMeasurements: growthMeasurementsState,
		}),
		[
			diaperChangesState,
			diaperProductsState,
			eventsState,
			feedingSessionsState,
			growthMeasurementsState,
		],
	);

	const handleExport = async () => {
		setIsLoading(true);
		try {
			const allData = Object.entries(dataStores).map(([name, data]) => ({
				data: data.value,
				name,
			}));
			const files = allData
				.filter(({ data }) => data.length > 0)
				.map(({ data, name }) => ({
					content: toCsv(name, data as Record<string, unknown>[]),
					name: `${name}.csv`,
				}));
			const zipBlob = await createZip(files);
			downloadZip(zipBlob);
			toast.success(fbt('Data exported successfully.', 'Success message'));
		} catch {
			toast.error(fbt('Failed to export data.', 'Error message'));
		} finally {
			setIsLoading(false);
		}
	};

	const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		setIsLoading(true);
		try {
			const files = await extractFiles(file);
			for (const { content, name } of files) {
				const dataStore = dataStores[name as keyof typeof dataStores];
				if (!dataStore) {
					continue;
				}

				const data = fromCsv(content) as ({ id: string } & Record<
					string,
					string | number | boolean
				>)[];
				const merged = mergeData(
					dataStore.value as Record<string, unknown>[],
					data,
				);
				merged.forEach((item) => {
					dataStore.update(item as Parameters<typeof dataStore.update>[0]);
				});
			}
			toast.success(fbt('Data imported successfully.', 'Success message'));
		} catch {
			toast.error(fbt('Failed to import data.', 'Error message'));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-4 w-full">
			<Card>
				<CardHeader>
					<CardTitle>
						<fbt desc="Title for Export Data section">Export Data</fbt>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="mb-4 text-sm text-muted-foreground">
						<fbt desc="Description for data export">
							Download all your data as a ZIP file containing CSVs.
						</fbt>
					</p>
					<Button
						className="w-full"
						disabled={isLoading}
						onClick={handleExport}
					>
						{isLoading ? (
							<fbt desc="Button text while exporting">Exporting...</fbt>
						) : (
							<fbt desc="Button text to start export">Export</fbt>
						)}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>
						<fbt desc="Title for Import Data section">Import Data</fbt>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="mb-4 text-sm text-muted-foreground">
						<fbt desc="Description for data import">
							Import data from a ZIP file containing CSVs. Existing data will
							not be overwritten.
						</fbt>
					</p>
					<Input
						accept=".zip"
						disabled={isLoading}
						onChange={handleImport}
						type="file"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
