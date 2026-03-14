import type { ReactNode } from 'react';
import type {
	FeedingFormValues,
	FeedingSession,
	FeedingSessionFormData,
} from '@/types/feeding';
import { fbt } from 'fbtee';
import { useMemo } from 'react';
import { DateTimeInputs } from '@/components/form/date-time-inputs';
import { EntityFormDialog } from '@/components/form/entity-form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useEntityForm } from '@/hooks/use-entity-form';
import { feedingSessionFormToDataSchema } from '@/types/feeding';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { dateToTimeInputValue } from '@/utils/date-to-time-input-value';

interface FeedingFormProps {
	feeding?: FeedingSession;
	onClose: () => void;
	onSave: (session: FeedingSession) => void;
	title: ReactNode;
}

function getDefaultValues(
	feeding: FeedingSession | undefined,
): FeedingFormValues {
	return {
		breast: feeding?.breast ?? 'left',
		date: dateToDateInputValue(feeding?.startTime ?? new Date()),
		duration: feeding?.durationInSeconds
			? Math.round(feeding.durationInSeconds / 60).toString()
			: '',
		notes: feeding?.notes ?? '',
		time: dateToTimeInputValue(feeding?.startTime ?? new Date()),
	};
}

export default function FeedingForm({
	feeding,
	onClose,
	onSave,
	title,
}: FeedingFormProps) {
	const defaultValues = useMemo(() => getDefaultValues(feeding), [feeding]);

	const form = useEntityForm<
		FeedingFormValues,
		undefined,
		FeedingSessionFormData
	>(feedingSessionFormToDataSchema, defaultValues);

	const { formState, register, setValue, watch } = form;

	const breast = watch('breast');

	const handleSave = (parsedValues: FeedingSessionFormData) => {
		const updatedSession: FeedingSession = {
			...feeding,
			breast: parsedValues.breast,
			durationInSeconds: parsedValues.durationInSeconds,
			endTime: parsedValues.endTime,
			id: feeding?.id ?? Date.now().toString(),
			notes: parsedValues.notes,
			startTime: parsedValues.startTime,
		};

		onSave(updatedSession);
		onClose();
	};

	return (
		<EntityFormDialog
			footer={
				<div className="flex justify-end gap-2 mt-6">
					<Button onClick={onClose} type="button" variant="outline">
						<fbt common>Cancel</fbt>
					</Button>
					<Button
						className={
							breast === 'left'
								? 'bg-left-breast hover:bg-left-breast-dark'
								: 'bg-right-breast hover:bg-right-breast-dark'
						}
						data-testid="save-button"
						type="submit"
					>
						<fbt common>Save</fbt>
					</Button>
				</div>
			}
			form={form}
			onClose={onClose}
			onSave={handleSave}
			title={title}
		>
			<div className="grid gap-4 py-4">
				<div className="space-y-2">
					<Label>
						<fbt desc="Label for a radio group that allows the user to select which breat was used to feed">
							Breast
						</fbt>
					</Label>
					<RadioGroup
						className="flex gap-4"
						onValueChange={(value) => {
							setValue('breast', value as 'left' | 'right', {
								shouldValidate: true,
							});
						}}
						value={breast}
					>
						<div className="flex items-center space-x-2">
							<RadioGroupItem
								className="text-left-breast border-left-breast"
								data-testid="left-breast-radio"
								id="edit-left"
								value="left"
							/>
							<Label className="text-left-breast-dark" htmlFor="edit-left">
								<fbt desc="Label for a radio button that indicates the left breast was used to feed">
									Left Breast
								</fbt>
							</Label>
						</div>
						<div className="flex items-center space-x-2">
							<RadioGroupItem
								className="text-right-breast border-right-breast"
								data-testid="right-breast-radio"
								id="edit-right"
								value="right"
							/>
							<Label className="text-right-breast-dark" htmlFor="edit-right">
								<fbt desc="Label for a radio button that indicates the right breast was used to feed">
									Right Breast
								</fbt>
							</Label>
						</div>
					</RadioGroup>
				</div>

				<DateTimeInputs
					dateField="date"
					dateLabel={<fbt desc="Label for a date input">Date</fbt>}
					errors={formState.errors}
					register={register}
					timeField="time"
					timeLabel={
						<fbt desc="Label for a time input that sets the starting time of a feeding session">
							Start Time
						</fbt>
					}
				/>

				<div className="space-y-2">
					<Label htmlFor="edit-duration">
						<fbt desc="Label for a number input that sets the duration of a feeding session in minutes">
							Duration (minutes)
						</fbt>
					</Label>
					<Input
						id="edit-duration"
						min="1"
						type="number"
						{...register('duration')}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="edit-notes">
						<fbt desc="Label for a textbox to note any notes">Notes</fbt>
					</Label>
					<Textarea
						id="edit-notes"
						placeholder={fbt(
							'e.g. good latch, sleepy, etc.',
							'Placeholder text for a textbox to note any notes during feeding',
						)}
						{...register('notes')}
					/>
				</div>
			</div>
		</EntityFormDialog>
	);
}
