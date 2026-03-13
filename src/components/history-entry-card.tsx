import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import DeleteIconButton from './icon-buttons/delete';
import EditIconButton from './icon-buttons/edit';

interface HistoryEntryCardProps {
	children?: ReactNode;
	className?: string;
	formattedTime: string;
	header: ReactNode;
	onDelete: () => void;
	onEdit: () => void;
}

/**
 * Standardized card component for history entries (Diaper, Feeding, Growth, Events).
 * Provides a consistent layout with a header, timestamp, content area, and action buttons.
 */
export default function HistoryEntryCard({
	children,
	className,
	formattedTime,
	header,
	onDelete,
	onEdit,
	...props
}: HistoryEntryCardProps & ComponentPropsWithoutRef<'div'>) {
	return (
		<div
			className={cn('border rounded-lg p-4 shadow-xs', className)}
			data-testid="history-entry-card"
			{...props}
		>
			<div className="flex justify-between items-start">
				<div className="flex-1 min-w-0">
					<div className="text-lg font-medium leading-tight">{header}</div>
					<p className="text-xs text-muted-foreground mt-1">{formattedTime}</p>
					{children && <div className="mt-2">{children}</div>}
				</div>
				<div className="flex gap-1 shrink-0 ml-2">
					<EditIconButton onClick={onEdit} />
					<DeleteIconButton onClick={onDelete} />
				</div>
			</div>
		</div>
	);
}
