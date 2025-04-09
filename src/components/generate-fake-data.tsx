'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateFakeData } from '@/utils/generate-fake-data';
import { useToast } from '@/hooks/use-toast';
import type { FeedingSession } from '@/types/feeding';
import type { Event } from '@/types/event';
import type { GrowthMeasurement } from '@/types/growth';

// Simple database icon
const DatabaseIcon = () => (
	<svg
		fill="none"
		height="16"
		stroke="currentColor"
		strokeLinecap="round"
		strokeLinejoin="round"
		strokeWidth="2"
		viewBox="0 0 24 24"
		width="16"
		xmlns="http://www.w3.org/2000/svg"
	>
		<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
		<path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
		<path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
	</svg>
);

interface GenerateFakeDataProps {
	onGenerate: (data: {
		events: Event[];
		measurements: GrowthMeasurement[];
		sessions: FeedingSession[];
	}) => void;
}

export default function GenerateFakeData({
	onGenerate,
}: GenerateFakeDataProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [days, setDays] = useState('7');
	const [feedingsPerDay, setFeedingsPerDay] = useState('12');
	const [confirmText, setConfirmText] = useState('');
	const [isGenerating, setIsGenerating] = useState(false);
	const { toast } = useToast();

	const handleGenerate = () => {
		if (confirmText !== 'generieren') return;

		const daysNum = Number.parseInt(days, 10) || 7;
		const feedingsNum = Number.parseInt(feedingsPerDay, 10) || 12;

		// Validate inputs
		if (daysNum <= 0 || daysNum > 90) {
			toast({
				description: 'Die Anzahl der Tage muss zwischen 1 und 90 liegen.',
				title: 'Ungültige Eingabe',
				variant: 'destructive',
			});
			return;
		}

		if (feedingsNum <= 0 || feedingsNum > 24) {
			toast({
				description:
					'Die Anzahl der Mahlzeiten pro Tag muss zwischen 1 und 24 liegen.',
				title: 'Ungültige Eingabe',
				variant: 'destructive',
			});
			return;
		}

		try {
			setIsGenerating(true);
			console.log('Starting fake data generation...');

			const fakeData = generateFakeData(daysNum, feedingsNum);

			console.log('Fake data generated:', fakeData);
			console.log(
				`Sessions: ${fakeData.sessions.length}, Events: ${fakeData.events.length}, Measurements: ${fakeData.measurements.length}`,
			);

			if (
				!fakeData ||
				!Array.isArray(fakeData.sessions) ||
				!Array.isArray(fakeData.events) ||
				!Array.isArray(fakeData.measurements)
			) {
				throw new Error(
					'Fehler beim Generieren der Testdaten: Ungültiges Datenformat',
				);
			}

			onGenerate(fakeData);

			toast({
				description: `${fakeData.sessions.length} Stillzeiten, ${fakeData.events.length} Ereignisse und ${fakeData.measurements.length} Messungen wurden generiert.`,
				title: 'Testdaten generiert',
			});

			setIsOpen(false);
			setConfirmText('');
		} catch (error) {
			console.error('Error generating fake data:', error);
			toast({
				description: 'Die Testdaten konnten nicht generiert werden.',
				title: 'Fehler',
				variant: 'destructive',
			});
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<>
			<Button
				className="flex items-center gap-1"
				onClick={() => setIsOpen(true)}
				size="sm"
				variant="outline"
			>
				<DatabaseIcon />
				<span>Testdaten</span>
			</Button>

			<Dialog
				onOpenChange={(open) => {
					if (!isGenerating) {
						setIsOpen(open);
						if (!open) {
							setConfirmText('');
						}
					}
				}}
				open={isOpen}
			>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Testdaten generieren</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
							<p className="text-sm">
								Diese Funktion generiert realistische Testdaten für
								Entwicklungszwecke. Die generierten Daten ersetzen alle
								vorhandenen Daten.
							</p>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="days">Anzahl Tage</Label>
								<Input
									id="days"
									max="90"
									min="1"
									onChange={(e) => setDays(e.target.value)}
									type="number"
									value={days}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="feedings">Mahlzeiten pro Tag</Label>
								<Input
									id="feedings"
									max="24"
									min="1"
									onChange={(e) => setFeedingsPerDay(e.target.value)}
									type="number"
									value={feedingsPerDay}
								/>
							</div>
						</div>

						<div className="space-y-2 mt-2">
							<Label htmlFor="confirm-text">
								Gib "generieren" ein, um zu bestätigen:
							</Label>
							<Input
								id="confirm-text"
								onChange={(e) => setConfirmText(e.target.value)}
								placeholder="generieren"
								value={confirmText}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							disabled={isGenerating}
							onClick={() => setIsOpen(false)}
							variant="outline"
						>
							Abbrechen
						</Button>
						<Button
							disabled={confirmText !== 'generieren' || isGenerating}
							onClick={handleGenerate}
						>
							{isGenerating ? 'Generiere...' : 'Testdaten generieren'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
