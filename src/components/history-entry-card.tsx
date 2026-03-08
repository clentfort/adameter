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
	{ bg: string; border: string; }
> = {
	diaper: {
		bg: 'bg-amber-50/50 dark:bg-amber-950/20',
		border: 'border-amber-200',
	},
	event: { bg: '', border: 'border-gray-200' },
	feeding: {
		bg: 'bg-blue-50/50 dark:bg-blue-950/20',
		border: 'border-blue-200',
	},
	growth: {
		bg: 'bg-green-50/50 dark:bg-green-950/20',
		border: 'border-green-200',
	},
	teething: {
		bg: 'bg-purple-50/50 dark:bg-purple-950/20',
		border: 'border-purple-200',
	},
};

interface HistoryEntryCardProps {
	children: ReactNode;
	className?: string;
	'data-testid'?: string;
	emoji?: string;
	formattedTime?: string;
	onDelete?: () => void;
	onEdit?: () => void;
	style?: CSSProperties;
	variant?: HistoryEntryVariant;
}

export function HistoryEntryCard({
	children,
	className,
	'data-testid': dataTestId,
	emoji,
	formattedTime,
	onDelete,
	onEdit,
	style,
	variant = 'event',
}: HistoryEntryCardProps) {
	const { bg, border } = variantStyles[variant];

	return (
		<div
			className={cn('border rounded-lg p-4 shadow-xs', border, bg, className)}
			data-testid={dataTestId}
			style={style}
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
