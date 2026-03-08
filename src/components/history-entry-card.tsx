import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import DeleteIconButton from '@/components/icon-buttons/delete';
import EditIconButton from '@/components/icon-buttons/edit';

export type HistoryEntryVariant =
	| 'diaper'
	| 'feeding'
	| 'growth'
	| 'teething'
	| 'event';

const variantStyles: Record<
	HistoryEntryVariant,
	{ border: string; bg: string }
> = {
	diaper: {
		border: 'border-amber-200',
		bg: 'bg-amber-50/50 dark:bg-amber-950/20',
	},
	feeding: {
		border: 'border-blue-200',
		bg: 'bg-blue-50/50 dark:bg-blue-950/20',
	},
	growth: {
		border: 'border-green-200',
		bg: 'bg-green-50/50 dark:bg-green-950/20',
	},
	teething: {
		border: 'border-purple-200',
		bg: 'bg-purple-50/50 dark:bg-purple-950/20',
	},
	event: { border: 'border-gray-200', bg: '' },
};

interface HistoryEntryCardProps {
	children: ReactNode;
	variant?: HistoryEntryVariant;
	emoji?: string;
	formattedTime?: string;
	onEdit?: () => void;
	onDelete?: () => void;
	className?: string;
	style?: CSSProperties;
	'data-testid'?: string;
}

export function HistoryEntryCard({
	children,
	variant = 'event',
	emoji,
	formattedTime,
	onEdit,
	onDelete,
	className,
	style,
	'data-testid': dataTestId,
}: HistoryEntryCardProps) {
	const { border, bg } = variantStyles[variant];

	return (
		<div
			className={cn('border rounded-lg p-4 shadow-xs', border, bg, className)}
			style={style}
			data-testid={dataTestId}
		>
			<div className="flex justify-between items-start">
				<div className="flex-1">
					{(emoji || formattedTime) && (
						<div className="flex items-center gap-2">
							{emoji && (
								<span aria-hidden="true" role="img">
									{emoji}
								</span>
							)}
							{formattedTime && (
								<p className="font-medium text-lg">{formattedTime}</p>
							)}
						</div>
					)}
					<div className="mt-2 space-y-1">{children}</div>
				</div>
				{(onEdit || onDelete) && (
					<div className="flex gap-1 mt-2 shrink-0">
						{onEdit && <EditIconButton onClick={onEdit} />}
						{onDelete && <DeleteIconButton onClick={onDelete} />}
					</div>
				)}
			</div>
		</div>
	);
}
