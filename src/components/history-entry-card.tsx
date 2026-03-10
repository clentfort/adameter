import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import DeleteIconButton from '@/components/icon-buttons/delete';
import EditIconButton from '@/components/icon-buttons/edit';

interface HistoryEntryCardProps {
	children: ReactNode;
	className?: string;
	'data-testid'?: string;
	formattedTime?: string;
	onDelete: () => void;
	onEdit: () => void;
	style?: CSSProperties;
	title?: ReactNode;
}

export function HistoryEntryCard({
	children,
	className,
	'data-testid': dataTestId,
	formattedTime,
	onDelete,
	onEdit,
	style,
	title,
}: HistoryEntryCardProps) {
	return (
		<div
			className={cn('border rounded-lg p-4 shadow-xs', className)}
			data-testid={dataTestId}
			style={style}
		>
			<div className="flex justify-between items-start gap-2">
				<div className="flex-1 min-w-0">
					<div className="flex flex-col min-w-0">
						{title && (
							<div className="font-medium text-lg leading-tight">{title}</div>
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
					<div className="mt-2 space-y-1">{children}</div>
				</div>
				<div className="flex gap-1 shrink-0 mt-0.5">
					<EditIconButton onClick={onEdit} />
					<DeleteIconButton onClick={onDelete} />
				</div>
			</div>
		</div>
	);
}
