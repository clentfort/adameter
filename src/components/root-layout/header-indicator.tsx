import { ReactNode } from 'react';

interface HeaderIndicatorProps {
	children: ReactNode;
	icon: ReactNode;
	label: ReactNode;
}

export default function HeaderIndicator({
	children,
	icon,
	label,
}: HeaderIndicatorProps) {
	return (
		<div className="text-center bg-muted/20 rounded-lg p-2 flex-1 flex flex-col justify-center">
			<div className="flex items-center justify-center gap-1">
				<span className="text-sm">{icon}</span>
				<p className="text-xs text-muted-foreground font-medium">{label}</p>
			</div>
			<div className="text-sm font-medium">{children}</div>
		</div>
	);
}
