import type { FeedingSession } from '@/types/feeding';
import type { FeedingInProgress } from '@/types/feeding-in-progress';
import { Duration, format, intervalToDuration } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFeedingInProgress } from '@/hooks/use-feeding-in-progress';
import { useTimeFormat } from '@/hooks/use-time-format';
import { formatDurationShort } from '@/utils/format-duration-short';
import { generateId } from '@/utils/generate-id';
import FeedingForm from './feeding-form';

interface BreastfeedingTrackerProps {
	nextBreast: 'left' | 'right';
	onSaveSession: (session: FeedingSession) => void;
	resumableSession?: FeedingSession;
}

// Legacy in-progress values may lack an id, so one is generated on save.
function toFeedingSession({
	breast,
	id,
	startTime,
}: FeedingInProgress): FeedingSession {
	const endTime = new Date();
	return {
		breast,
		durationInSeconds: Math.max(
			1,
			Math.floor((endTime.getTime() - new Date(startTime).getTime()) / 1000),
		),
		endTime: endTime.toISOString(),
		id: id ?? generateId(),
		startTime,
	};
}

export default function BreastfeedingTracker({
	nextBreast,
	onSaveSession,
	resumableSession,
}: BreastfeedingTrackerProps) {
	const [elapsedTime, setElapsedTime] = useState<null | Duration>(null);
	const [manualSession, setManualSession] = useState<FeedingSession | null>(
		null,
	);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const [feedingInProgress, setFeedingInProgress] = useFeedingInProgress();
	const [timeFormat] = useTimeFormat();

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
		setFeedingInProgress({
			breast,
			id: generateId(),
			startTime: new Date().toISOString(),
		});
		setElapsedTime({ seconds: 0 });
	};

	const resumeFeeding = (sessionToResume: FeedingSession) => {
		setFeedingInProgress({
			breast: sessionToResume.breast,
			id: sessionToResume.id,
			startTime: sessionToResume.startTime,
		});
	};

	const endFeeding = () => {
		if (!feedingInProgress) {
			return;
		}
		onSaveSession(toFeedingSession(feedingInProgress));
		resetTracker();
	};

	const handleManualSave = (session: FeedingSession) => {
		onSaveSession(session);
		setManualSession(null);
		resetTracker();
	};

	const resetTracker = () => {
		setFeedingInProgress(null);
		setElapsedTime(null);

		if (timerRef.current) {
			clearInterval(timerRef.current);
		}
	};

	return (
		<div className="w-full">
			{!feedingInProgress ? (
				<div className="grid grid-cols-2 gap-4">
					<BreastTrackerButton
						breast="left"
						nextBreast={nextBreast}
						onClick={() =>
							resumableSession && resumableSession.breast === 'left'
								? resumeFeeding(resumableSession)
								: startFeeding('left')
						}
						resumableSession={resumableSession}
					/>
					<BreastTrackerButton
						breast="right"
						nextBreast={nextBreast}
						onClick={() =>
							resumableSession && resumableSession.breast === 'right'
								? resumeFeeding(resumableSession)
								: startFeeding('right')
						}
						resumableSession={resumableSession}
					/>
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
								<p className="text-3xl font-bold" data-testid="feeding-timer">
									{formatDurationShort(elapsedTime ?? { seconds: 0 })}
								</p>
								{feedingInProgress.startTime && (
									<p className="text-xs text-muted-foreground mt-1">
										<fbt desc="Label indicating the start time of the current feeding session">
											Start
										</fbt>
										:{' '}
										{format(
											feedingInProgress.startTime,
											timeFormat === '24h' ? 'HH:mm' : 'p',
										)}
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
							onClick={() => {
								if (feedingInProgress) {
									setManualSession(toFeedingSession(feedingInProgress));
								}
							}}
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
			{manualSession && (
				<FeedingForm
					feeding={manualSession}
					onClose={() => setManualSession(null)}
					onSave={handleManualSave}
					title={
						<fbt desc="Title of the dialog to add a feeding entry manually">
							Add Feeding Entry
						</fbt>
					}
				/>
			)}
		</div>
	);
}

interface BreastStatusBadgeProps {
	breast: 'left' | 'right';
	type: 'next' | 'resume';
}

function BreastStatusBadge({ breast, type }: BreastStatusBadgeProps) {
	const bg = breast === 'left' ? 'bg-left-breast' : 'bg-right-breast';
	return (
		<Badge className={`absolute -top-2 -right-2 ${bg} text-white`}>
			{type === 'next' ? (
				<fbt desc="Badge on a button that tells the user that they should use this breast for the next feeding session">
					Next
				</fbt>
			) : (
				<fbt desc="Badge on a button that tells the user that they can resume the last feeding session on this breast">
					Resume
				</fbt>
			)}
		</Badge>
	);
}

interface BreastTrackerButtonProps {
	breast: 'left' | 'right';
	nextBreast: 'left' | 'right';
	onClick: () => void;
	resumableSession?: FeedingSession;
}

function BreastTrackerButton({
	breast,
	nextBreast,
	onClick,
	resumableSession,
}: BreastTrackerButtonProps) {
	const isResumable = resumableSession && resumableSession.breast === breast;
	const isNext = !resumableSession && nextBreast === breast;

	return (
		<div className="relative">
			<Button
				className={`h-24 text-lg w-full ${
					breast === 'left'
						? 'bg-left-breast hover:bg-left-breast-dark'
						: 'bg-right-breast hover:bg-right-breast-dark'
				} text-white`}
				onClick={onClick}
				size="lg"
			>
				{breast === 'left' ? (
					<fbt desc="Label on a button that starts a feeding session with the left breast">
						Left Breast
					</fbt>
				) : (
					<fbt desc="Label on a button that starts a feeding session with the right breast">
						Right Breast
					</fbt>
				)}
			</Button>
			{isResumable ? (
				<BreastStatusBadge breast={breast} type="resume" />
			) : (
				isNext && <BreastStatusBadge breast={breast} type="next" />
			)}
		</div>
	);
}
