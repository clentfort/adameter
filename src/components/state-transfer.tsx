'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import type { DiaperChange } from '@/types/diaper';
import type { Event } from '@/types/event';
import type { FeedingSession } from '@/types/feeding';
import type { GrowthMeasurement } from '@/types/growth';
import { downloadAllAsZip } from '@/utils/csv-export';
import { useTranslate } from '@/utils/translate';
import { Download, FileArchiveIcon as FileZip, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StateTransferProps {
	diaperChanges?: DiaperChange[];
	events?: Event[];
	measurements?: GrowthMeasurement[];
	onImport: (
		sessions: FeedingSession[],
		events?: Event[],
		measurements?: GrowthMeasurement[],
		diaperChanges?: DiaperChange[],
	) => void;
	sessions: FeedingSession[];
}

export default function StateTransfer({
	diaperChanges = [],
	events = [],
	measurements = [],
	onImport,
	sessions = [],
}: StateTransferProps) {
	const t = useTranslate();
	const { language } = useLanguage();
	const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
	const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
	const [exportUrl, setExportUrl] = useState('');
	const [confirmText, setConfirmText] = useState('');
	const [importedData, setImportedData] = useState<{
		diaperChanges: DiaperChange[];
		events: Event[];
		measurements: GrowthMeasurement[];
		sessions: FeedingSession[];
	} | null>(null);
	const { toast } = useToast();
	const [exportTab, setExportTab] = useState<'url' | 'csv'>('url');
	const [isExporting, setIsExporting] = useState(false);

	// Add a new state for the import URL dialog:
	const [isImportUrlDialogOpen, setIsImportUrlDialogOpen] = useState(false);
	const [importUrl, setImportUrl] = useState('');

	// Ensure arrays are valid
	const sessionsArray = Array.isArray(sessions) ? sessions : [];
	const eventsArray = Array.isArray(events) ? events : [];
	const measurementsArray = Array.isArray(measurements) ? measurements : [];
	const diaperChangesArray = Array.isArray(diaperChanges) ? diaperChanges : [];

	// Check for hash in URL on component mount
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const hash = window.location.hash;
			if (hash && hash.startsWith('#data=')) {
				try {
					const encodedData = hash.slice(6); // Remove "#data="
					const jsonData = decodeURIComponent(atob(encodedData));
					const parsedData = JSON.parse(jsonData);

					// Handle different data formats for backward compatibility
					let sessions: FeedingSession[] = [];
					let events: Event[] = [];
					let measurements: GrowthMeasurement[] = [];
					let diaperChanges: DiaperChange[] = [];

					// Case 1: New format with sessions, events, measurements, and diaperChanges
					if (
						parsedData &&
						typeof parsedData === 'object' &&
						Array.isArray(parsedData.sessions)
					) {
						sessions = parsedData.sessions;
						events = Array.isArray(parsedData.events) ? parsedData.events : [];
						measurements = Array.isArray(parsedData.measurements)
							? parsedData.measurements
							: [];
						diaperChanges = Array.isArray(parsedData.diaperChanges)
							? parsedData.diaperChanges
							: [];
					}
					// Case 2: Old format with just an array of sessions
					else if (Array.isArray(parsedData)) {
						sessions = parsedData;
					}
					// Case 3: Invalid format
					else {
						throw new Error('Invalid data format');
					}

					if (sessions.length > 0) {
						setImportedData({
							diaperChanges,
							events,
							measurements,
							sessions,
						});
						setIsImportDialogOpen(true);

						// Clear the hash from the URL without reloading the page
						history.pushState(
							'',
							document.title,
							window.location.pathname + window.location.search,
						);
					}
				} catch {
					toast({
						description: t('importDescription'),
						title: t('importTitle'),
						variant: 'destructive',
					});
				}
			}
		}
	}, [toast, t]);

	const handleExport = () => {
		if (sessionsArray.length === 0) {
			toast({
				description: t('noFeedingDataAvailable'),
				title: t('exportTitle'),
				variant: 'destructive',
			});
			return;
		}

		try {
			const exportData = {
				diaperChanges: diaperChangesArray,
				events: eventsArray,
				measurements: measurementsArray,
				sessions: sessionsArray,
			};

			const jsonData = JSON.stringify(exportData);
			const encodedData = btoa(encodeURIComponent(jsonData));
			const url = `${window.location.origin}${window.location.pathname}#data=${encodedData}`;
			setExportUrl(url);
			setIsExportDialogOpen(true);
		} catch (error) {
			console.error('Export error:', error);
			toast({
				description: t('noDataAvailable'),
				title: t('exportTitle'),
				variant: 'destructive',
			});
		}
	};

	const handleCopyUrl = async () => {
		try {
			await navigator.clipboard.writeText(exportUrl);
			toast({
				description: t('urlExportDescription'),
				title: t('copy'),
			});
		} catch {
			toast({
				description: t('urlExportDescription'),
				title: t('exportTitle'),
			});
		}
	};

	const handleImport = () => {
		const confirmTextRequired =
			language === 'de' ? 'überschreiben' : 'overwrite';

		if (confirmText !== confirmTextRequired || !importedData) {
			return;
		}

		onImport(
			importedData.sessions,
			importedData.events,
			importedData.measurements,
			importedData.diaperChanges,
		);
		setIsImportDialogOpen(false);
		setConfirmText('');
		setImportedData(null);

		toast({
			description: t('importConfirmation', {
				diaperChanges: importedData.diaperChanges.length,
				events: importedData.events.length,
				measurements: importedData.measurements.length,
				sessions: importedData.sessions.length,
			}),
			title: t('importTitle'),
		});
	};

	const cancelImport = () => {
		setIsImportDialogOpen(false);
		setConfirmText('');
		setImportedData(null);
	};

	// Add a function to handle URL pasting and extraction:
	const handleImportUrl = () => {
		if (!importUrl.trim()) return;

		try {
			// Extract the hash part from the URL, handling different URL formats
			let encodedData = '';

			// First try to find #data= in the URL
			if (importUrl.includes('#data=')) {
				encodedData = importUrl.split('#data=')[1];
				// Remove any additional hash parameters if present
				if (encodedData.includes('&')) {
					encodedData = encodedData.split('&')[0];
				}
			} else {
				throw new Error('No data found in URL');
			}

			if (!encodedData) {
				throw new Error('No data found in URL');
			}

			try {
				const jsonData = decodeURIComponent(atob(encodedData));
				const parsedData = JSON.parse(jsonData);

				// Handle different data formats for backward compatibility
				let sessions: FeedingSession[] = [];
				let events: Event[] = [];
				let measurements: GrowthMeasurement[] = [];
				let diaperChanges: DiaperChange[] = [];

				// Case 1: New format with sessions, events, measurements, and diaperChanges
				if (
					parsedData &&
					typeof parsedData === 'object' &&
					Array.isArray(parsedData.sessions)
				) {
					sessions = parsedData.sessions;
					events = Array.isArray(parsedData.events) ? parsedData.events : [];
					measurements = Array.isArray(parsedData.measurements)
						? parsedData.measurements
						: [];
					diaperChanges = Array.isArray(parsedData.diaperChanges)
						? parsedData.diaperChanges
						: [];
				}
				// Case 2: Old format with just an array of sessions
				else if (Array.isArray(parsedData)) {
					sessions = parsedData;
				}
				// Case 3: Invalid format
				else {
					throw new Error('Invalid data format');
				}

				if (sessions.length > 0) {
					setImportedData({
						diaperChanges,
						events,
						measurements,
						sessions,
					});
					setIsImportDialogOpen(true);
					setIsImportUrlDialogOpen(false);
					setImportUrl('');
				} else {
					throw new Error('No feeding sessions found in data');
				}
			} catch (decodeError) {
				console.error('Decode error:', decodeError);
				throw new Error('Could not decode data from URL');
			}
		} catch (error) {
			console.error('Import error:', error);
			toast({
				description: t('importDescription'),
				title: t('importTitle'),
				variant: 'destructive',
			});
		}
	};

	// Handle ZIP export for all data
	const handleExportZip = async () => {
		try {
			setIsExporting(true);

			if (
				sessionsArray.length === 0 &&
				eventsArray.length === 0 &&
				measurementsArray.length === 0 &&
				diaperChangesArray.length === 0
			) {
				toast({
					description: t('noDataAvailable'),
					title: t('exportTitle'),
					variant: 'destructive',
				});
				return;
			}

			// Download all data as ZIP
			await downloadAllAsZip(
				sessionsArray,
				eventsArray,
				measurementsArray,
				diaperChangesArray,
			);

			toast({
				description: t('zipExportDescription'),
				title: t('exportTitle'),
			});
		} catch (error) {
			console.error('Error exporting data as ZIP:', error);
			toast({
				description: t('zipExportDescription'),
				title: t('exportTitle'),
				variant: 'destructive',
			});
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<>
			{/* Import URL Dialog */}
			<Dialog
				onOpenChange={setIsImportUrlDialogOpen}
				open={isImportUrlDialogOpen}
			>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>{t('importTitle')}</DialogTitle>
						<DialogDescription>{t('importDescription')}</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="import-url">{t('exportUrl')}</Label>
							<Input
								className="font-mono text-xs"
								id="import-url"
								onChange={(e) => setImportUrl(e.target.value)}
								placeholder={t('urlPlaceholder')}
								value={importUrl}
							/>
							<p className="text-xs text-muted-foreground">
								{t('importUrlDescription')}
							</p>
						</div>
					</div>
					<DialogFooter>
						<Button
							onClick={() => setIsImportUrlDialogOpen(false)}
							variant="outline"
						>
							{t('cancel')}
						</Button>
						<Button onClick={handleImportUrl}>{t('next')}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Export Dialog */}
			<Dialog onOpenChange={setIsExportDialogOpen} open={isExportDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>{t('exportTitle')}</DialogTitle>
						<DialogDescription>{t('exportDescription')}</DialogDescription>
					</DialogHeader>

					<Tabs
						className="mt-4"
						onValueChange={(value) => setExportTab(value as 'url' | 'csv')}
						value={exportTab}
					>
						<TabsList className="grid grid-cols-2 mb-4">
							<TabsTrigger value="url">{t('urlExport')}</TabsTrigger>
							<TabsTrigger value="csv">{t('csvExport')}</TabsTrigger>
						</TabsList>

						<TabsContent className="space-y-4" value="url">
							<div className="space-y-2">
								<Label htmlFor="export-url">{t('exportUrl')}</Label>
								<div className="flex gap-2">
									<Input
										className="font-mono text-xs"
										id="export-url"
										readOnly
										value={exportUrl}
									/>
									<Button onClick={handleCopyUrl} variant="secondary">
										{t('copy')}
									</Button>
								</div>
								<p className="text-xs text-muted-foreground">
									{t('urlExportDescription')}
								</p>
							</div>
						</TabsContent>

						<TabsContent className="space-y-4" value="csv">
							<div className="space-y-4">
								<div>
									<Button
										className="w-full"
										disabled={isExporting}
										onClick={handleExportZip}
									>
										<FileZip className="h-4 w-4 mr-2" />
										{t('exportAllAsZip')}
									</Button>
									<p className="text-xs text-muted-foreground mt-1">
										{t('zipExportDescription')}
									</p>
								</div>
							</div>
						</TabsContent>
					</Tabs>

					<DialogFooter>
						<Button onClick={() => setIsExportDialogOpen(false)}>
							{t('close')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Import Dialog */}
			<Dialog
				onOpenChange={(open) => !open && cancelImport()}
				open={isImportDialogOpen}
			>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>{t('importTitle')}</DialogTitle>
						<DialogDescription>
							{t('importConfirmation', {
								diaperChanges: importedData?.diaperChanges.length || 0,
								events: importedData?.events.length || 0,
								measurements: importedData?.measurements.length || 0,
								sessions: importedData?.sessions.length || 0,
							})}
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<Alert variant="destructive">
							<AlertDescription>{t('importWarning')}</AlertDescription>
						</Alert>
						<div className="space-y-2">
							<Label htmlFor="confirm-text">{t('confirmOverwrite')}</Label>
							<Input
								id="confirm-text"
								onChange={(e) => setConfirmText(e.target.value)}
								placeholder={language === 'de' ? 'überschreiben' : 'overwrite'}
								value={confirmText}
							/>
						</div>
					</div>
					<DialogFooter className="flex flex-col sm:flex-row gap-2">
						<Button
							className="sm:order-1"
							onClick={cancelImport}
							variant="outline"
						>
							{t('cancel')}
						</Button>
						<Button
							className="sm:order-2"
							disabled={
								confirmText !==
								(language === 'de' ? 'überschreiben' : 'overwrite')
							}
							onClick={handleImport}
						>
							<Download className="h-4 w-4 mr-1" />
							{t('importButton')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="flex gap-2">
				<Button
					onClick={() => setIsImportUrlDialogOpen(true)}
					size="sm"
					title={t('importData')}
					variant="outline"
				>
					<Download className="h-4 w-4 mr-1" />
					{t('importData')}
				</Button>
				<Button
					onClick={handleExport}
					size="sm"
					title={t('exportData')}
					variant="outline"
				>
					<Share2 className="h-4 w-4 mr-1" />
					{t('exportData')}
				</Button>
			</div>
		</>
	);
}
