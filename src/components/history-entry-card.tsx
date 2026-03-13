import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface HistoryEntryCardProps {
	children?: ReactNode;
	className?: string;
	formattedTime?: ReactNode;
	header: ReactNode;
	onDelete: () => void;
	onEdit: () => void;
}

/**
 * Standardized card component for history entries (Diaper, Feeding, Growth, Events).
 * Provides a consistent layout with a header, secondary info line (time/date),
 * content area, and a dropdown menu for actions.
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
					{formattedTime && (
						<div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
							{formattedTime}
						</div>
					)}
					{children && <div className="mt-2">{children}</div>}
				</div>
				<div className="shrink-0 ml-2">
					<DropdownMenu>
						<DropdownMenuTrigger
							className={cn(
								"focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-md border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-3 aria-invalid:ring-3 [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground h-8 w-8",
							)}
							data-testid="history-entry-actions"
						>
							<EllipsisVertical className="h-4 w-4" />
							<span className="sr-only">
								<fbt desc="Open actions menu">Actions</fbt>
							</span>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={onEdit}>
								<Pencil className="mr-2 h-4 w-4" />
								<fbt common>Edit</fbt>
							</DropdownMenuItem>
							<DropdownMenuItem
								className="text-destructive"
								onClick={onDelete}
								variant="destructive"
							>
								<Trash2 className="mr-2 h-4 w-4" />
								<fbt common>Delete</fbt>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</div>
	);
}
