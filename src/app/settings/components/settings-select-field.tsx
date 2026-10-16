import type { ReactNode } from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

export function SettingsSelectField<T extends string>({
	icon,
	id,
	label,
	onChange,
	options,
	value,
}: {
	icon: ReactNode;
	id?: string;
	label: ReactNode;
	onChange: (value: T) => void;
	options: { label: ReactNode; value: T }[];
	value: T;
}) {
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				{icon}
				<p className="text-sm font-medium">{label}</p>
			</div>
			<Select
				onValueChange={(v) => {
					if (v) {
						onChange(v as T);
					}
				}}
				value={value}
			>
				<SelectTrigger id={id}>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
