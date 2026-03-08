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
	{ bg: string; border: string }
> = {
	diaper: {
		bg: 'bg-amber-50/50 dark:bg-amber-950/20',
		border: 'border-amber-200',
	},
	event: { bg: '', border: 'border-border' },
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
	emoji?: ReactNode;
	formattedTime?: string;
	onDelete?: () => void;
	onEdit?: () => void;
	rightContent?: ReactNode;
	style?: CSSProperties;
	title?: ReactNode;
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
	rightContent,
	style,
	title,
	variant = 'event',
}: HistoryEntryCardProps) {
	const { bg, border } = variantStyles[variant];

	return (
		<div
			className={cn('border rounded-lg p-4 shadow-xs', border, bg, className)}
			data-testid={dataTestId}
			style={style}
		>
			<div className="flex justify-between items-start gap-2">
				<div className="flex-1 min-w-0">
					<div className="flex items-start gap-2">
						{emoji && (
							<div aria-hidden="true" className="shrink-0 mt-1" role="img">
								{emoji}
							</div>
						)}
						<div className="flex-1 min-w-0">
							<div className="flex justify-between items-start gap-2">
								<div className="flex flex-col min-w-0">
									{title && (
										<div className="font-medium text-lg leading-tight">
											{title}
										</div>
									)}
									{formattedTime && (
										<p
											className={cn(
												'font-medium',
												title ? 'text-xs text-muted-foreground' : 'text-lg',
											)}
										>
											{formattedTime}
										</p>
									)}
								</div>
								<div className="flex flex-col items-end shrink-0 gap-1">
									{(onEdit || onDelete) && (
										<div className="flex gap-1 shrink-0">
											{onEdit && <EditIconButton onClick={onEdit} />}
											{onDelete && <DeleteIconButton onClick={onDelete} />}
										</div>
									)}
									{rightContent && (
										<div className="shrink-0 text-right">{rightContent}</div>
									)}
								</div>
							</div>
							<div className="mt-2 space-y-1">{children}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
