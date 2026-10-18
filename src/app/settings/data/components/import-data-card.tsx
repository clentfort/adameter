'use client';

import { fbt } from 'fbtee';
import { ChangeEvent, useContext, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { tinybaseContext } from '@/contexts/tinybase-context';
import { importZipIntoStore } from '@/utils/data-transfer/import';

export function ImportDataCard() {
	const { store } = useContext(tinybaseContext);
	const { toast } = useToast();
	const [isBusy, setIsBusy] = useState(false);

	const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		setIsBusy(true);
		try {
			await importZipIntoStore(store, file);
			toast.success(
				fbt('Data imported successfully.', 'Import success message'),
			);
		} catch {
			toast.error(fbt('Failed to import data.', 'Import error message'));
		} finally {
			setIsBusy(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<fbt desc="Import data card title">Import Data</fbt>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="mb-4 text-sm">
					<fbt desc="Import data description">
						Import data from a ZIP file containing CSVs.
					</fbt>
				</p>
				<Input
					accept=".zip"
					disabled={isBusy}
					onChange={handleImport}
					type="file"
				/>
			</CardContent>
		</Card>
	);
}
