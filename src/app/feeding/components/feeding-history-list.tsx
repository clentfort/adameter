import type { FeedingSession } from '@/types/feeding';
import { isSameDay } from 'date-fns';
import HistoryEntryCard from '@/components/history-entry-card';
import HistoryListWithRange from '@/components/history-list-with-range';
import { BREAST_COLORS } from '@/constants/colors';
import { useFeedingSession } from '@/hooks/use-feeding-sessions';
import { useFeedingSessionsByDate } from '@/hooks/use-tinybase-indexes';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated';
import { formatEntryTime } from '@/utils/format-history-date';
import FeedingForm from './feeding-form';

interface HistoryListProps {
	onSessionDelete: (sessionId: string) => void;
	onSessionUpdate: (session: FeedingSession) => void;
}

function FeedingHistoryEntry({
	onDelete,
	onEdit,
	sessionId,
}: {
	onDelete: (sessionId: string) => void;
	onEdit: (sessionId: string) => void;
	sessionId: string;
}) {
	const session = useFeedingSession(sessionId);

	if (!session) {
		return null;
	}

	const isLeftBreast = session.breast === 'left';
	const accentColor = isLeftBreast ? BREAST_COLORS.left : BREAST_COLORS.right;
	const startDate = new Date(session.startTime);
	const endDate = new Date(session.endTime);
	const crossesMidnight = !isSameDay(startDate, endDate);

	return (
		<HistoryEntryCard
			accentColor={accentColor}
			data-testid="feeding-history-entry"
			formattedTime={<span>{formatEntryTime(session.startTime)}</span>}
			header={
				<span>
					{isLeftBreast ? (
						<fbt desc="Label indicating a feeding was done with the left breast">
							Left Breast
						</fbt>
					) : (
						<fbt desc="Label indicating a feeding was done with the right breast">
							Right Breast
						</fbt>
					)}
				</span>
			}
			onDelete={() => onDelete(session.id)}
			onEdit={() => onEdit(session.id)}
		>
			<div className="text-sm space-y-1">
				<div className="flex items-center gap-1">
					<span>⏳</span>
					<span className="font-medium">
						{formatDurationAbbreviated(session.durationInSeconds)}
					</span>
				</div>
				{session.notes && (
					<p className="text-muted-foreground whitespace-pre-wrap">
						{session.notes}
					</p>
				)}
				{crossesMidnight && (
					<p className="text-xs text-muted-foreground italic">
						<fbt desc="A note describing that the feeding session crosses midnight">
							This session crosses midnight
						</fbt>
					</p>
				)}
			</div>
		</HistoryEntryCard>
	);
}

const FeedingEditDialog = ({
	onClose,
	onSave,
	sessionId,
}: {
	onClose: () => void;
	onSave: (session: FeedingSession) => void;
	sessionId: string;
}) => {
	const session = useFeedingSession(sessionId);
	if (!session) return null;

	return (
		<FeedingForm
			feeding={session}
			onClose={onClose}
			onSave={onSave}
			title={
				<fbt desc="Title of a dialog that allows the user to edit a feeding session">
					Edit Feeding Session
				</fbt>
			}
		/>
	);
};

export default function HistoryList({
	onSessionDelete,
	onSessionUpdate,
}: HistoryListProps) {
	const { dateKeys, indexes, indexId } = useFeedingSessionsByDate();

	return (
		<HistoryListWithRange
			baseUrl="/feeding"
			dateKeys={dateKeys}
			editDialog={(id, onClose) => (
				<FeedingEditDialog
					onClose={onClose}
					onSave={onSessionUpdate}
					sessionId={id}
				/>
			)}
			indexes={indexes}
			indexId={indexId}
			onDelete={onSessionDelete}
		>
			{(sessionId, { setToDelete, setToEdit }) => (
				<FeedingHistoryEntry
					key={sessionId}
					onDelete={setToDelete}
					onEdit={setToEdit}
					sessionId={sessionId}
				/>
			)}
		</HistoryListWithRange>
	);
}
