import type { FeedingSession } from '@/types/feeding';
import { Duration, format, intervalToDuration } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
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
import { useFeedingInProgress } from '@/hooks/use-feeing-in-progress';
import { formatDurationShort } from '@/utils/format-duration-short';

interface BreastfeedingTrackerProps {
	nextBreast: 'left' | 'right';
	onSessionComplete: (session: FeedingSession) => void;
}

// Keys for localStorage
const ACTIVE_BREAST_KEY = 'activeBreast';
const START_TIME_KEY = 'startTime';

export default function BreastfeedingTracker({
	nextBreast,
	onSessionComplete,
}: BreastfeedingTrackerProps) {
	const [elapsedTime, setElapsedTime] = useState<null | Duration>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [manualMinutes, setManualMinutes] = useState('');
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const [feedingInProgress, setFeedingInProgress] = useFeedingInProgress();

	// Check for active session on component mount
	useEffect(() => {
		if (!feedingInProgress) {
			return;
		}

		const parsedStartTime = new Date(feedingInProgress.startTime);

		function updateTimer() {
			const now = new Date();
			const elapsed = intervalToDuration({
				end: now,
				start: parsedStartTime,
			});
			setElapsedTime(elapsed);
		}

		updateTimer();
		timerRef.current = setInterval(() => {
			updateTimer();
		}, 1000);

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, [feedingInProgress]);

	const startFeeding = (breast: 'left' | 'right') => {
		const now = new Date();
		setFeedingInProgress({
			breast,
			startTime: now.toISOString(),
		});
		setElapsedTime({ seconds: 0 });

		// Store in localStorage
		localStorage.setItem(ACTIVE_BREAST_KEY, breast);
		localStorage.setItem(START_TIME_KEY, now.toISOString());
	};

	const endFeeding = () => {
		if (!feedingInProgress) {
			return;
		}
		const { breast, startTime } = feedingInProgress;
		const endTime = new Date();
		const durationInSeconds = Math.floor(
			(endTime.getTime() - new Date(startTime).getTime()) / 1000,
		);

		const session: FeedingSession = {
			breast,
			durationInSeconds,
			endTime: endTime.toISOString(),
			id: Date.now().toString(),
			startTime,
		};

		onSessionComplete(session);
		resetTracker();
	};

	const handleManualEntry = () => {
		if (
			!feedingInProgress ||
			!manualMinutes ||
			Number.isNaN(Number(manualMinutes))
		) {
			return;
		}
		const minutes = Number(manualMinutes);
		const now = new Date();
		const calculatedStartTime = new Date(now.getTime() - minutes * 60 * 1000);

		const session: FeedingSession = {
			breast: feedingInProgress.breast,
			durationInSeconds: minutes * 60,
			endTime: now.toISOString(),
			id: Date.now().toString(),
			startTime: calculatedStartTime.toISOString(),
		};

		onSessionComplete(session);
		setIsDialogOpen(false);
		resetTracker();
	};

	const resetTracker = () => {
		setFeedingInProgress();
		setElapsedTime(null);
		setManualMinutes('');

		// Clear from localStorage
		localStorage.removeItem(ACTIVE_BREAST_KEY);
		localStorage.removeItem(START_TIME_KEY);

		if (timerRef.current) {
			clearInterval(timerRef.current);
		}
	};

	return (
		<div className="w-full">
			{!feedingInProgress ? (
				<div className="grid grid-cols-2 gap-4">
					<div className="relative">
						<Button
							className="h-24 text-lg w-full bg-left-breast hover:bg-left-breast-dark text-white"
							onClick={() => startFeeding('left')}
							size="lg"
						>
							<fbt desc="Label on a button that starts a feeding session with the left breast">
								Left Breast
							</fbt>
						</Button>
						{nextBreast === 'left' && <NextBreastBadge breast="left" />}
					</div>
					<div className="relative">
						<Button
							className="h-24 text-lg w-full bg-right-breast hover:bg-right-breast-dark text-white"
							onClick={() => startFeeding('right')}
							size="lg"
						>
							<fbt desc="Label on a button that starts a feeding session with the right breast">
								Right Breast
							</fbt>
						</Button>
						{nextBreast === 'right' && <NextBreastBadge breast="right" />}
					</div>
				</div>
			) : (
				<div className="flex flex-col items-center gap-4">
					<div className="text-center mb-2 w-full">
						<div
							className={`p-3 rounded-lg ${
								feedingInProgress.breast === 'left'
									? 'bg-left-breast/10 border border-left-breast/30'
									: 'bg-right-breast/10 border border-right-breast/30'
							}`}
						>
							<p
								className={`text-lg font-medium ${
									feedingInProgress.breast === 'left'
										? 'text-left-breast-dark'
										: 'text-right-breast-dark'
								}`}
							>
								{feedingInProgress.breast === 'left' ? (
									<fbt desc="Label that shows that there is a feeding session in progress with the left breast">
										Left Breast
									</fbt>
								) : (
									<fbt desc="Label that shows that there is a feeding session in progress with the right breast">
										Right Breast
									</fbt>
								)}
							</p>
							<div className="mt-2">
								<p className="text-3xl font-bold">
									{formatDurationShort(elapsedTime ?? { seconds: 0 })}
								</p>
								{feedingInProgress.startTime && (
									<p className="text-xs text-muted-foreground mt-1">
										<fbt desc="Label indicating the start time of the current feeding session">
											Start
										</fbt>
										: {format(feedingInProgress.startTime, 'p')}
									</p>
								)}
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4 w-full">
						<Button
							className={`h-16 ${
								feedingInProgress.breast === 'left'
									? 'bg-left-breast hover:bg-left-breast-dark'
									: 'bg-right-breast hover:bg-right-breast-dark'
							}`}
							onClick={endFeeding}
							size="lg"
						>
							<fbt desc="Label on a button to mark the current feeding session as done">
								End Feeding
							</fbt>
						</Button>
						<Button
							className="h-16"
							onClick={() => setIsDialogOpen(true)}
							size="lg"
							variant="outline"
						>
							<fbt desc="Label on a button to mark the current feeding session as done and to enter the duration of the session by manually">
								Enter Time Manually
							</fbt>
						</Button>
					</div>
				</div>
			)}
			<Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>
							<fbt desc="Title of the dialog to enter feeding time manually">
								Enter Feeding Time Manually
							</fbt>
						</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label className="text-right col-span-1" htmlFor="minutes">
								<fbt desc="Label for an input of minutes">minutes</fbt>
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
								feedingInProgress?.breast === 'left'
									? 'bg-left-breast hover:bg-left-breast-dark'
									: 'bg-right-breast hover:bg-right-breast-dark'
							}
							onClick={handleManualEntry}
							type="submit"
						>
							<fbt common>Save</fbt>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

interface NextBreastBadgeProps {
	breast: 'left' | 'right';
}
function NextBreastBadge({ breast }: NextBreastBadgeProps) {
	const bg = breast === 'left' ? 'bg-left-breast' : 'bg-right-breast';
	return (
		<Badge className={`absolute -top-2 -right-2 ${bg}`}>
			<fbt desc="Badge on a button that tells the user that they should use this breast for the next feeding session">
				Next
			</fbt>
		</Badge>
	);
}
