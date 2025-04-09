'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FeedingSession } from '@/types/feeding';
import { useTranslate } from '@/utils/translate';
import { useEffect, useRef, useState } from 'react';

interface BreastfeedingTrackerProps {
	nextBreast: 'left' | 'right' | null;
	onSessionComplete: (session: FeedingSession) => void;
}

// Keys for localStorage
const ACTIVE_BREAST_KEY = 'activeBreast';
const START_TIME_KEY = 'startTime';

export default function BreastfeedingTracker({
	nextBreast,
	onSessionComplete,
}: BreastfeedingTrackerProps) {
	const [activeBreast, setActiveBreast] = useState<'left' | 'right' | null>(
		null,
	);
	const [startTime, setStartTime] = useState<Date | null>(null);
	const [elapsedTime, setElapsedTime] = useState(0);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [manualMinutes, setManualMinutes] = useState('');
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const t = useTranslate();

	// Check for active session on component mount
	useEffect(() => {
		const storedBreast = localStorage.getItem(ACTIVE_BREAST_KEY) as
			| 'left'
			| 'right'
			| null;
		const storedStartTime = localStorage.getItem(START_TIME_KEY);

		if (storedBreast && storedStartTime) {
			const parsedStartTime = new Date(storedStartTime);
			setActiveBreast(storedBreast);
			setStartTime(parsedStartTime);

			// Calculate elapsed time immediately
			const now = new Date();
			const elapsed = Math.floor(
				(now.getTime() - parsedStartTime.getTime()) / 1000,
			);
			setElapsedTime(elapsed);
		}
	}, []);

	// Update timer every second when active
	useEffect(() => {
		if (startTime) {
			timerRef.current = setInterval(() => {
				const now = new Date();
				const elapsed = Math.floor(
					(now.getTime() - startTime.getTime()) / 1000,
				);
				setElapsedTime(elapsed);
			}, 1000);
		}

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, [startTime]);

	const startFeeding = (breast: 'left' | 'right') => {
		const now = new Date();
		setActiveBreast(breast);
		setStartTime(now);
		setElapsedTime(0);

		// Store in localStorage
		localStorage.setItem(ACTIVE_BREAST_KEY, breast);
		localStorage.setItem(START_TIME_KEY, now.toISOString());
	};

	const endFeeding = () => {
		if (startTime && activeBreast) {
			const endTime = new Date();
			const durationInSeconds = Math.floor(
				(endTime.getTime() - startTime.getTime()) / 1000,
			);

			const session: FeedingSession = {
				breast: activeBreast,
				durationInSeconds,
				endTime: endTime.toISOString(),
				id: Date.now().toString(),
				startTime: startTime.toISOString(),
			};

			onSessionComplete(session);
			resetTracker();
		}
	};

	const handleManualEntry = () => {
		if (activeBreast && manualMinutes && !isNaN(Number(manualMinutes))) {
			const minutes = Number(manualMinutes);
			const now = new Date();
			const calculatedStartTime = new Date(now.getTime() - minutes * 60 * 1000);

			const session: FeedingSession = {
				breast: activeBreast,
				durationInSeconds: minutes * 60,
				endTime: now.toISOString(),
				id: Date.now().toString(),
				startTime: calculatedStartTime.toISOString(),
			};

			onSessionComplete(session);
			setIsDialogOpen(false);
			resetTracker();
		}
	};

	const resetTracker = () => {
		setActiveBreast(null);
		setStartTime(null);
		setElapsedTime(0);
		setManualMinutes('');

		// Clear from localStorage
		localStorage.removeItem(ACTIVE_BREAST_KEY);
		localStorage.removeItem(START_TIME_KEY);

		if (timerRef.current) {
			clearInterval(timerRef.current);
		}
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	return (
		<div className="w-full">
			{!activeBreast ? (
				<div className="grid grid-cols-2 gap-4">
					<div className="relative">
						<Button
							className="h-24 text-lg w-full bg-left-breast hover:bg-left-breast-dark text-white"
							onClick={() => startFeeding('left')}
							size="lg"
						>
							{t('leftBreast')}
						</Button>
						{nextBreast === 'left' && (
							<Badge className="absolute -top-2 -right-2 bg-left-breast">
								{t('next')}
							</Badge>
						)}
					</div>
					<div className="relative">
						<Button
							className="h-24 text-lg w-full bg-right-breast hover:bg-right-breast-dark text-white"
							onClick={() => startFeeding('right')}
							size="lg"
						>
							{t('rightBreast')}
						</Button>
						{nextBreast === 'right' && (
							<Badge className="absolute -top-2 -right-2 bg-right-breast">
								{t('next')}
							</Badge>
						)}
					</div>
				</div>
			) : (
				<div className="flex flex-col items-center gap-4">
					<div className="text-center mb-2 w-full">
						<div
							className={`p-3 rounded-lg ${
								activeBreast === 'left'
									? 'bg-left-breast/10 border border-left-breast/30'
									: 'bg-right-breast/10 border border-right-breast/30'
							}`}
						>
							<p
								className={`text-lg font-medium ${
									activeBreast === 'left'
										? 'text-left-breast-dark'
										: 'text-right-breast-dark'
								}`}
							>
								{activeBreast === 'left' ? t('leftBreast') : t('rightBreast')}
							</p>
							<div className="mt-2">
								<p className="text-3xl font-bold">{formatTime(elapsedTime)}</p>
								{startTime && (
									<p className="text-xs text-muted-foreground mt-1">
										{`${t('start')}:`}{' '}
										{startTime.getHours().toString().padStart(2, '0')}:
										{startTime.getMinutes().toString().padStart(2, '0')}
										{t.language === 'de' ? ' Uhr' : ''}
									</p>
								)}
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4 w-full">
						<Button
							className={`h-16 ${
								activeBreast === 'left'
									? 'bg-left-breast hover:bg-left-breast-dark'
									: 'bg-right-breast hover:bg-right-breast-dark'
							}`}
							onClick={endFeeding}
							size="lg"
						>
							{t('endFeeding')}
						</Button>
						<Button
							className="h-16"
							onClick={() => setIsDialogOpen(true)}
							size="lg"
							variant="outline"
						>
							{t('enterTimeManually')}
						</Button>
					</div>
				</div>
			)}

			<Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>{t('enterFeedingTimeManually')}</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label className="text-right col-span-1" htmlFor="minutes">
								{t('minutes')}
							</Label>
							<Input
								className="col-span-3"
								id="minutes"
								min="1"
								onChange={(e) => setManualMinutes(e.target.value)}
								type="number"
								value={manualMinutes}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							className={
								activeBreast === 'left'
									? 'bg-left-breast hover:bg-left-breast-dark'
									: 'bg-right-breast hover:bg-right-breast-dark'
							}
							onClick={handleManualEntry}
							type="submit"
						>
							{t('save')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
