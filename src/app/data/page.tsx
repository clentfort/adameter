'use client';

import type { ChangeEvent } from 'react';
import type {
	PerformanceLogEntry,
	PerformanceSummary,
} from '@/lib/performance-logging';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import { diaperChanges } from '@/data/diaper-changes';
import { events } from '@/data/events';
import { feedingSessions } from '@/data/feeding-sessions';
import { growthMeasurements } from '@/data/growth-measurments';
import { medicationRegimensProxy as medicationRegimens } from '@/data/medication-regimens';
import { medicationsProxy as medications } from '@/data/medications';
import {
	captureYjsEpochSnapshot,
	saveYjsEpochSnapshot,
} from '@/data/yjs-epoch-snapshot';
import {
	clearPerformanceLogs,
	createPerformanceReport,
	getCurrentPerformanceRoom,
	getPerformanceDeviceLabel,
	getPerformanceLogs,
	getPerformanceSummaries,
	logPerformanceEvent,
	PERFORMANCE_LOG_UPDATED_EVENT,
	setPerformanceDeviceLabel,
} from '@/lib/performance-logging';
import {
	getYjsEpoch,
	getYjsEpochMode,
	setYjsEpoch,
	setYjsEpochMode,
} from '@/lib/yjs-epoch';
import { fromCsv, mergeData, toCsv } from './utils/csv';
import { createZip, downloadZip, extractFiles } from './utils/zip';

const DIAGNOSTICS_REFRESH_INTERVAL_MS = 2500;

const dataStores: Record<string, { id: string }[]> = {
	diaperChanges,
	events,
	feedingSessions,
	growthMeasurements,
	medicationRegimens,
	medications,
};

function formatDuration(durationMs: number) {
	return `${durationMs.toFixed(2)} ms`;
}

export default function DataPage() {
	const { toast } = useToast();
	const { room } = useContext(DataSynchronizationContext);
	const [deviceLabel, setDeviceLabel] = useState('');
	const [mode, setMode] = useState<'production' | 'test'>('production');
	const [epoch, setEpoch] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [logs, setLogs] = useState<PerformanceLogEntry[]>([]);
	const [summaries, setSummaries] = useState<PerformanceSummary[]>([]);

	const refreshDiagnostics = useCallback(() => {
		setLogs(getPerformanceLogs());
		setSummaries(getPerformanceSummaries(12));
	}, []);

	useEffect(() => {
		setDeviceLabel(getPerformanceDeviceLabel());
		const currentMode = getYjsEpochMode();
		setMode(currentMode);
		setEpoch(getYjsEpoch(currentMode));
		refreshDiagnostics();

		const onUpdate = () => {
			refreshDiagnostics();
		};

		window.addEventListener(PERFORMANCE_LOG_UPDATED_EVENT, onUpdate);
		const interval = setInterval(
			refreshDiagnostics,
			DIAGNOSTICS_REFRESH_INTERVAL_MS,
		);

		return () => {
			window.removeEventListener(PERFORMANCE_LOG_UPDATED_EVENT, onUpdate);
			clearInterval(interval);
		};
	}, [refreshDiagnostics]);

	const roomToShow = room ?? getCurrentPerformanceRoom() ?? '';

	const recentLogs = useMemo(() => logs.slice(-10).reverse(), [logs]);
	const latestLogAt = logs.length > 0 ? logs[logs.length - 1].at : undefined;

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
		} catch {
			toast.error('Failed to export data.');
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
			for (const { name, content } of files) {
				const data = fromCsv(content);
				mergeData(dataStores[name], data);
			}
			toast.success('Data imported successfully.');
		} catch {
			toast.error('Failed to import data.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleSaveDeviceLabel = () => {
		setPerformanceDeviceLabel(deviceLabel);
		toast.success('Device label saved.');
		refreshDiagnostics();
	};

	const handleCopyRoom = async () => {
		if (!roomToShow) {
			toast.error('No active room found.');
			return;
		}

		try {
			await navigator.clipboard.writeText(roomToShow);
			toast.success('Room copied to clipboard.');
		} catch {
			toast.error('Failed to copy room.');
		}
	};

	const handleCopyDiagnostics = async () => {
		try {
			await navigator.clipboard.writeText(createPerformanceReport());
			toast.success('Diagnostics copied to clipboard.');
		} catch {
			toast.error('Failed to copy diagnostics.');
		}
	};

	const handleShareDiagnostics = async () => {
		const report = createPerformanceReport();

		try {
			if (typeof navigator.share === 'function') {
				await navigator.share({
					text: report,
					title: 'AdaMeter performance report',
				});
				return;
			}

			await navigator.clipboard.writeText(report);
			toast.success('Share is unavailable. Report copied instead.');
		} catch {
			toast.error('Failed to share diagnostics.');
		}
	};

	const handleClearDiagnostics = () => {
		clearPerformanceLogs();
		refreshDiagnostics();
		toast.success('Diagnostics log cleared.');
	};

	const handleStartTestEpoch = async () => {
		const nextEpoch = getYjsEpoch('test') + 1;
		const snapshot = captureYjsEpochSnapshot();

		try {
			await saveYjsEpochSnapshot(snapshot, {
				epoch: nextEpoch,
				mode: 'test',
			});
		} catch {
			toast.error('Failed to persist epoch snapshot. Aborting epoch rotation.');
			return;
		}

		setYjsEpochMode('test');
		setYjsEpoch(nextEpoch, 'test');
		setMode('test');
		setEpoch(nextEpoch);

		logPerformanceEvent('yjs.epoch.rotated', {
			metadata: {
				nextEpoch,
				targetMode: 'test',
				room: roomToShow,
				snapshotItems:
					snapshot.diaperChanges.length +
					snapshot.events.length +
					snapshot.feedingSessions.length +
					snapshot.growthMeasurements.length +
					snapshot.medicationRegimens.length +
					snapshot.medications.length,
			},
		});

		toast.success('Started new test epoch. Reloading now...');
		setTimeout(() => {
			window.location.reload();
		}, 50);
	};

	const handleSwitchToProductionRoom = () => {
		setYjsEpochMode('production');
		setYjsEpoch(0, 'production');
		setMode('production');
		setEpoch(0);

		logPerformanceEvent('yjs.mode.switched', {
			metadata: {
				nextEpoch: 0,
				nextMode: 'production',
				room: roomToShow,
			},
		});

		toast.success('Switched to production room. Reloading now...');
		setTimeout(() => {
			window.location.reload();
		}, 50);
	};

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Performance Diagnostics</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">
						Logging is always enabled. Use this section on each phone to capture
						startup and interaction performance.
					</p>

					<div className="grid gap-2">
						<p className="text-sm">
							<span className="font-medium">Current Yjs mode:</span> {mode}
						</p>
						<p className="text-sm">
							<span className="font-medium">Current Yjs epoch:</span> {epoch}
						</p>
					</div>

					<div className="grid gap-2">
						<p className="text-sm">
							<span className="font-medium">Current PartyKit room:</span>{' '}
							{roomToShow || 'Not set'}
						</p>
						<div>
							<Button onClick={handleCopyRoom} size="sm" variant="outline">
								Copy Room
							</Button>
						</div>
					</div>

					<div className="grid gap-2">
						<label className="text-sm font-medium" htmlFor="device-label">
							Device label (for example: Chris phone / Wife phone)
						</label>
						<div className="flex gap-2">
							<Input
								id="device-label"
								onChange={(event) => setDeviceLabel(event.target.value)}
								placeholder="My phone"
								value={deviceLabel}
							/>
							<Button onClick={handleSaveDeviceLabel} size="sm" type="button">
								Save
							</Button>
						</div>
					</div>

					<div className="grid gap-1 text-sm">
						<p>
							<span className="font-medium">Logged events:</span> {logs.length}
						</p>
						<p>
							<span className="font-medium">Latest event:</span>{' '}
							{latestLogAt
								? new Date(latestLogAt).toLocaleString()
								: 'No logs yet'}
						</p>
					</div>

					<div className="flex flex-wrap gap-2">
						<Button onClick={handleStartTestEpoch} size="sm" variant="outline">
							Start New Test Epoch
						</Button>
						<Button
							onClick={handleSwitchToProductionRoom}
							size="sm"
							variant="outline"
						>
							Switch To Production
						</Button>
						<Button onClick={handleCopyDiagnostics} size="sm" variant="outline">
							Copy Report
						</Button>
						<Button
							onClick={handleShareDiagnostics}
							size="sm"
							variant="outline"
						>
							Share Report
						</Button>
						<Button
							onClick={handleClearDiagnostics}
							size="sm"
							variant="outline"
						>
							Clear Logs
						</Button>
					</div>

					{summaries.length > 0 && (
						<div className="space-y-2">
							<p className="font-medium text-sm">Top timings (by P95)</p>
							<div className="space-y-2">
								{summaries.map((summary) => (
									<div
										className="rounded-md border p-2 text-xs"
										key={summary.name}
									>
										<p className="font-medium">{summary.name}</p>
										<p>
											count {summary.count} / avg{' '}
											{formatDuration(summary.averageMs)} / p95{' '}
											{formatDuration(summary.p95Ms)} / max{' '}
											{formatDuration(summary.maxMs)}
										</p>
									</div>
								))}
							</div>
						</div>
					)}

					{recentLogs.length > 0 && (
						<div className="space-y-2">
							<p className="font-medium text-sm">Recent events</p>
							<div className="space-y-1">
								{recentLogs.map((log) => (
									<div className="rounded-md border p-2 text-xs" key={log.id}>
										<p className="font-medium">{log.name}</p>
										<p>
											{new Date(log.at).toLocaleTimeString()} - room:{' '}
											{log.room || 'none'}
											{typeof log.durationMs === 'number'
												? ` - ${formatDuration(log.durationMs)}`
												: ''}
										</p>
									</div>
								))}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Export Data</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="mb-4">
						Download all your data as a ZIP file containing CSVs.
					</p>
					<Button disabled={isLoading} onClick={handleExport}>
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
						Import data from a ZIP file containing CSVs. Existing data will not
						be overwritten.
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
