'use client';

import type { FeedingSession } from '@/types/feeding';
import type { FeedingInProgress } from '@/types/feeding-in-progress';
import { Duration, format, intervalToDuration } from 'date-fns';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFeedingsInProgressSnapshot, useRemoveFeedingInProgress, useUpsertFeedingInProgress } from '@/hooks/use-feedings-in-progress';
import { useProfile } from '@/hooks/use-profile';
import { formatDurationShort } from '@/utils/format-duration-short';
import FeedingForm from './feeding-form';

interface BreastfeedingTrackerProps {
	nextBreast: 'left' | 'right';
	onCreateSession: (session: FeedingSession) => void;
	onUpdateSession: (session: FeedingSession) => void;
	resumableSession?: FeedingSession;
}

export default function BreastfeedingTracker({
	nextBreast,
	onCreateSession,
	onUpdateSession,
	resumableSession,
}: BreastfeedingTrackerProps) {
	const feedingsInProgress = useFeedingsInProgressSnapshot();
	const upsertFeedingInProgress = useUpsertFeedingInProgress();
	const removeFeedingInProgress = useRemoveFeedingInProgress();
	const [manualSession, setManualSession] = useState<FeedingSession | null>(null);
	const [profile] = useProfile();

	const startFeeding = (breast?: 'left' | 'right') => {
		const now = new Date();
		upsertFeedingInProgress({
			breast,
			id: crypto.randomUUID(),
			startTime: now.toISOString(),
			type: breast ? 'breast' : 'bottle',
		});
	};

	const resumeFeeding = (sessionToResume: FeedingSession) => {
		upsertFeedingInProgress({
			breast: sessionToResume.breast,
			id: sessionToResume.id,
			startTime: sessionToResume.startTime,
			type: sessionToResume.type as 'breast' | 'bottle',
		});
	};

	const handleManualSave = (session: FeedingSession) => {
		onCreateSession(session);
		setManualSession(null);
	};

	const showLeft = profile?.showLeftBreast ?? true;
	const showRight = profile?.showRightBreast ?? true;
	const showBottle = (profile?.showPumpedMilk ?? true) || (profile?.showFormula ?? true);

	return (
		<div className="w-full space-y-6">
			<div className={`grid gap-4 ${[showLeft, showRight, showBottle].filter(Boolean).length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
				{showLeft && (
					<div className="relative">
						<Button
							className="h-24 text-lg w-full bg-left-breast hover:bg-left-breast-dark text-white"
							onClick={() =>
								resumableSession && resumableSession.breast === 'left'
									? resumeFeeding(resumableSession)
									: startFeeding('left')
							}
							size="lg"
						>
							<fbt desc="Label on a button that starts a feeding session with the left breast">
								Left
							</fbt>
						</Button>
						{resumableSession && resumableSession.breast === 'left' ? (
							<ResumeBadge breast="left" />
						) : (
							!resumableSession &&
							nextBreast === 'left' && <NextBreastBadge breast="left" />
						)}
					</div>
				)}
				{showRight && (
					<div className="relative">
						<Button
							className="h-24 text-lg w-full bg-right-breast hover:bg-right-breast-dark text-white"
							onClick={() =>
								resumableSession && resumableSession.breast === 'right'
									? resumeFeeding(resumableSession)
									: startFeeding('right')
							}
							size="lg"
						>
							<fbt desc="Label on a button that starts a feeding session with the right breast">
								Right
							</fbt>
						</Button>
						{resumableSession && resumableSession.breast === 'right' ? (
							<ResumeBadge breast="right" />
						) : (
							!resumableSession &&
							nextBreast === 'right' && <NextBreastBadge breast="right" />
						)}
					</div>
				)}
				{showBottle && (
					<div className="relative">
						<Button
							className="h-24 text-lg w-full bg-blue-500 hover:bg-blue-600 text-white"
							onClick={() => startFeeding()}
							size="lg"
						>
							<fbt desc="Label on a button that starts a bottle feeding session">
								Bottle
							</fbt>
						</Button>
					</div>
				)}
			</div>

			{feedingsInProgress.length > 0 && (
				<div className="grid grid-cols-1 gap-4">
					{feedingsInProgress.map((feeding) => (
						<ActiveTimer
							feeding={feeding}
							key={feeding.id}
							onEnd={(session) => {
								removeFeedingInProgress(feeding.id);
								setManualSession(session);
							}}
						/>
					))}
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

function ActiveTimer({ feeding, onEnd }: { feeding: FeedingInProgress, onEnd: (session: FeedingSession) => void }) {
	const [elapsedTime, setElapsedTime] = useState<Duration>({ seconds: 0 });

	useEffect(() => {
		const parsedStartTime = new Date(feeding.startTime);
		const updateTimer = () => {
			setElapsedTime(intervalToDuration({
				end: new Date(),
				start: parsedStartTime,
			}));
		};
		updateTimer();
		const interval = setInterval(updateTimer, 1000);
		return () => clearInterval(interval);
	}, [feeding.startTime]);

	const endFeeding = () => {
		const endTime = new Date();
		const durationInSeconds = Math.max(1, Math.floor((endTime.getTime() - new Date(feeding.startTime).getTime()) / 1000));

		onEnd({
			breast: feeding.breast,
			durationInSeconds,
			endTime: endTime.toISOString(),
			id: feeding.id,
			startTime: feeding.startTime,
			type: feeding.type,
		});
	};

	return (
		<div className={`p-4 rounded-xl border flex items-center justify-between ${
			feeding.type === 'bottle' ? 'bg-blue-50 border-blue-200' :
			feeding.breast === 'left' ? 'bg-left-breast/5 border-left-breast/20' : 'bg-right-breast/5 border-right-breast/20'
		}`}>
			<div>
				<p className={`font-medium ${
					feeding.type === 'bottle' ? 'text-blue-700' :
					feeding.breast === 'left' ? 'text-left-breast-dark' : 'text-right-breast-dark'
				}`}>
					{feeding.type === 'bottle' ? 'Bottle Feeding' : feeding.breast === 'left' ? 'Left Breast' : 'Right Breast'}
				</p>
				<p className="text-2xl font-bold">{formatDurationShort(elapsedTime)}</p>
				<p className="text-xs text-muted-foreground mt-1">Start: {format(feeding.startTime, 'p')}</p>
			</div>
			<Button
				className={
					feeding.type === 'bottle'
						? 'bg-blue-500 hover:bg-blue-600'
						: feeding.breast === 'left'
							? 'bg-left-breast hover:bg-left-breast-dark'
							: 'bg-right-breast hover:bg-right-breast-dark'
				}
				data-testid="end-feeding-button"
				onClick={endFeeding}
				size="lg"
			>
				<fbt desc="Label on a button to end a feeding session that is in progress">
					End
				</fbt>
			</Button>
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

interface ResumeBadgeProps {
	breast: 'left' | 'right';
}
function ResumeBadge({ breast }: ResumeBadgeProps) {
	const bg = breast === 'left' ? 'bg-left-breast' : 'bg-right-breast';
	return (
		<Badge className={`absolute -top-2 -right-2 ${bg}`}>
			<fbt desc="Badge on a button that tells the user that they can resume the last feeding session on this breast">
				Resume
			</fbt>
		</Badge>
	);
}
