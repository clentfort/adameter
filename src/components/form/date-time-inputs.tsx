import type {
	FieldErrors,
	FieldValues,
	Path,
	UseFormRegister,
} from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateTimeInputsProps<T extends FieldValues> {
	dateField: Path<T>;
	dateId?: string;
	dateLabel?: React.ReactNode;
	errors?: FieldErrors<T>;
	register: UseFormRegister<T>;
	timeField?: Path<T>;
	timeId?: string;
	timeLabel?: React.ReactNode;
}

export function DateTimeInputs<T extends FieldValues>({
	dateField,
	dateId = 'edit-date',
	dateLabel = <fbt common>Date</fbt>,
	errors,
	register,
	timeField,
	timeId = 'edit-time',
	timeLabel = <fbt common>Time</fbt>,
}: DateTimeInputsProps<T>) {
	const dateError = errors?.[dateField]?.message as string | undefined;
	const timeError = timeField
		? (errors?.[timeField]?.message as string | undefined)
		: undefined;

	if (!timeField) {
		return (
			<div className="space-y-2">
				<Label htmlFor={dateId}>{dateLabel}</Label>
				<Input id={dateId} type="date" {...register(dateField)} />
				{dateError && <p className="text-destructive text-sm">{dateError}</p>}
			</div>
		);
	}

	return (
		<div className="grid grid-cols-2 gap-4">
			<div className="space-y-2">
				<Label htmlFor={dateId}>{dateLabel}</Label>
				<Input id={dateId} type="date" {...register(dateField)} />
				{dateError && <p className="text-destructive text-sm">{dateError}</p>}
			</div>
			<div className="space-y-2">
				<Label htmlFor={timeId}>{timeLabel}</Label>
				<Input id={timeId} type="time" {...register(timeField)} />
				{timeError && <p className="text-destructive text-sm">{timeError}</p>}
			</div>
		</div>
	);
}
