'use client';

import { fbt } from 'fbtee';
import { ChangeEvent, useContext, useState } from 'react';
import { createIndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import { tinybaseContext } from '@/contexts/tinybase-context';
import { TINYBASE_LOCAL_DB_NAME } from '@/lib/tinybase-sync/constants';
import { sanitizeImportedRow } from '@/lib/tinybase-sync/entity-row-schemas';
import { fromCsv } from '@/utils/data-transfer/csv';
import { exportStoreAsZip } from '@/utils/data-transfer/export';
import { extractFiles } from '@/utils/data-transfer/zip';
import { SettingsHeader } from '../components/settings-header';

const VALUES_EXPORT_FILE_NAME = '__values';

type CsvImportRow = {
	id?: unknown;
	valueJson?: unknown;
};

function isCellValue(value: unknown): value is boolean | number | string {
	return (
		typeof value === 'boolean' ||
		typeof value === 'number' ||
		typeof value === 'string'
	);
}

function parseValueFromJson(valueJson: unknown) {
	if (typeof valueJson !== 'string' || valueJson.length === 0) {
		return undefined;
	}

	try {
		const parsedValue = JSON.parse(valueJson) as unknown;
		return isCellValue(parsedValue) ? parsedValue : undefined;
	} catch {
		return undefined;
	}
}

export default function DataSettingsPage() {
	const { store } = useContext(tinybaseContext);
	const { leaveRoom } = useContext(DataSynchronizationContext);
	const { toast } = useToast();

	const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
	const [resetConfirmationInput, setResetConfirmationInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleFactoryReset = async () => {
		setIsLoading(true);
		try {
			leaveRoom();
			await exportStoreAsZip(store);
			const backupDbName = `${TINYBASE_LOCAL_DB_NAME}-backup-${Date.now()}`;
			const backupPersister = createIndexedDbPersister(store, backupDbName);
			await backupPersister.save();
			await backupPersister.destroy();
			store.delTables().delValues();
			const mainPersister = createIndexedDbPersister(
				store,
				TINYBASE_LOCAL_DB_NAME,
			);
			await mainPersister.save();
			await mainPersister.destroy();
			toast.success(
				fbt('App reset successfully.', 'Success message for factory reset'),
			);
			setIsResetDialogOpen(false);
			window.location.reload();
		} catch {
			toast.error(
				fbt('Failed to reset app.', 'Error message for factory reset failure'),
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleExport = async () => {
		setIsLoading(true);
		try {
			await exportStoreAsZip(store);
			toast.success(
				fbt('Data exported successfully.', 'Export success message'),
			);
		} catch {
			toast.error(fbt('Failed to export data.', 'Export error message'));
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
				const data = fromCsv(content) as CsvImportRow[];

				store.transaction(() => {
					if (name === VALUES_EXPORT_FILE_NAME) {
						for (const row of data) {
							const valueId = row.id;
							if (typeof valueId !== 'string' || valueId.length === 0) {
								continue;
							}

							const parsedValue = parseValueFromJson(row.valueJson);
							if (parsedValue !== undefined) {
								store.setValue(valueId, parsedValue);
							}
						}
						return;
					}

					for (const row of data) {
						const rowId = row.id;
						if (
							(typeof rowId !== 'string' && typeof rowId !== 'number') ||
							String(rowId).length === 0
						) {
							continue;
						}

						const normalizedRowId = String(rowId);
						const sanitizedRow = sanitizeImportedRow(name, row);
						if (sanitizedRow === null) {
							continue;
						}

						if (sanitizedRow) {
							store.setRow(name, normalizedRowId, sanitizedRow);
							continue;
						}

						for (const [cellId, cellValue] of Object.entries(row)) {
							if (cellId === 'id' || !isCellValue(cellValue)) {
								continue;
							}

							store.setCell(name, normalizedRowId, cellId, cellValue);
						}
					}
				});
			}
			toast.success(
				fbt('Data imported successfully.', 'Import success message'),
			);
		} catch {
			toast.error(fbt('Failed to import data.', 'Import error message'));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<SettingsHeader
				title={fbt('Data Management', 'Title for data settings section')}
			/>

			<div className="space-y-4 w-full">
				<Card>
					<CardHeader>
						<CardTitle>
							<fbt desc="Export data card title">Export Data</fbt>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="mb-4 text-sm">
							<fbt desc="Export data description">
								Download all your data as a ZIP file containing CSVs.
							</fbt>
						</p>
						<Button disabled={isLoading} onClick={handleExport}>
							{isLoading ? (
								<fbt desc="Exporting button text">Exporting...</fbt>
							) : (
								<fbt desc="Export button text">Export</fbt>
							)}
						</Button>
					</CardContent>
				</Card>

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
							disabled={isLoading}
							onChange={handleImport}
							type="file"
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>
							<fbt desc="Factory reset card title">Factory Reset</fbt>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="mb-4 text-sm">
							<fbt desc="Factory reset description">
								Clear all local data and disconnect from any shared room. This
								action cannot be undone.
							</fbt>
						</p>
						<Button
							disabled={isLoading}
							onClick={() => {
								setResetConfirmationInput('');
								setIsResetDialogOpen(true);
							}}
							variant="destructive"
						>
							{isLoading ? (
								<fbt desc="Resetting button text">Resetting...</fbt>
							) : (
								<fbt desc="Reset button text">Factory Reset</fbt>
							)}
						</Button>

						<AlertDialog
							onOpenChange={setIsResetDialogOpen}
							open={isResetDialogOpen}
						>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										<fbt desc="Title for factory reset confirmation dialog">
											Are you absolutely sure?
										</fbt>
									</AlertDialogTitle>
									<AlertDialogDescription>
										<div className="space-y-4">
											<p>
												<fbt desc="Warning message for factory reset">
													This action will permanently delete all your local
													data and disconnect you from any shared room.
												</fbt>
											</p>
											<div className="space-y-2">
												<Label htmlFor="reset-confirmation">
													<fbt desc="Instruction to type a word to confirm reset">
														Please type{' '}
														<fbt:param name="confirmationWord">
															<strong>delete</strong>
														</fbt:param>{' '}
														to confirm.
													</fbt>
												</Label>
												<Input
													id="reset-confirmation"
													onChange={(e) =>
														setResetConfirmationInput(e.target.value)
													}
													placeholder={fbt(
														'Type "delete" here',
														'Placeholder for reset confirmation input',
													).toString()}
													value={resetConfirmationInput}
												/>
											</div>
										</div>
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>
										<fbt common={true}>Cancel</fbt>
									</AlertDialogCancel>
									<AlertDialogAction
										className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
										disabled={
											isLoading ||
											resetConfirmationInput.toLowerCase() !==
												fbt('delete', 'Confirmation word for reset').toString()
										}
										onClick={handleFactoryReset}
									>
										<fbt desc="Button text to confirm factory reset">
											Delete everything
										</fbt>
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
