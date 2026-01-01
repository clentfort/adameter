'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fbt } from 'fbt';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { exportData, importData } from '@/lib/data-utils';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import Papa from 'papaparse';
import { useState } from 'react';

export default function DataPage() {
	const { toast } = useToast();
	const [isLoading, setIsLoading] = useState(false);

	const handleExport = async () => {
		setIsLoading(true);
		try {
			await exportData();
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
			await importData(file);
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
