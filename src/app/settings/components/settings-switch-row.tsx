import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function SettingsSwitchRow({
	checked,
	description,
	icon,
	id,
	label,
	onCheckedChange,
}: {
	checked: boolean;
	description: ReactNode;
	icon?: ReactNode;
	id: string;
	label: ReactNode;
	onCheckedChange: (checked: boolean) => void;
}): JSX.Element {
	return (
		<div className="flex items-center justify-between">
			<div className="space-y-0.5">
				{icon ? (
					<div className="flex items-center gap-2">
						{icon}
						<Label className="text-sm font-medium" htmlFor={id}>
							{label}
						</Label>
					</div>
				) : (
					<Label className="text-sm font-medium" htmlFor={id}>
						{label}
					</Label>
				)}
				<p className="text-xs text-muted-foreground">{description}</p>
			</div>
			<Switch checked={checked} id={id} onCheckedChange={onCheckedChange} />
		</div>
	);
}
