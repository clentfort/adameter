import type { FeedingSession } from '@/types/feeding';
import { feedingSchema, type FeedingFormValues } from '@/types/feeding';
import { zodResolver } from '@hookform/resolvers/zod';
import { fbt } from 'fbtee';
import { ReactNode, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { dateToTimeInputValue } from '@/utils/date-to-time-input-value';

interface FeedingFormProps {
	feeding?: FeedingSession;
	onClose: () => void;
	onSave: (session: FeedingSession) => void;
	title: ReactNode;
}

export default function FeedingForm({
	feeding,
	onClose,
	onSave,
	title,
}: FeedingFormProps) {
	const {
		formState: { isValid },
		handleSubmit,
		register,
		reset,
		setValue,
		watch,
	} = useForm<FeedingFormValues>({
		defaultValues: {
			breast: feeding?.breast ?? 'left',
			date: dateToDateInputValue(feeding?.startTime ?? new Date()),
			duration: feeding?.durationInSeconds
				? Math.round(feeding.durationInSeconds / 60).toString()
				: '',
			time: dateToTimeInputValue(feeding?.startTime ?? new Date()),
		},
		mode: 'onChange',
		resolver: zodResolver(feedingSchema),
	});

	const breast = watch('breast');

	useEffect(() => {
		if (feeding) {
			reset({
				breast: feeding.breast,
				date: dateToDateInputValue(new Date(feeding.startTime)),
				duration: Math.round(feeding.durationInSeconds / 60).toString(),
				time: dateToTimeInputValue(new Date(feeding.startTime)),
			});
		}
	}, [feeding, reset]);

	const onSubmit = (values: FeedingFormValues) => {
		const durationInMinutes = Number(values.duration);
		const [year, month, day] = values.date.split('-').map(Number);
		const [hours, minutes] = values.time.split(':').map(Number);

		const startTime = new Date(year, month - 1, day, hours, minutes);
		const endTime = new Date(
			startTime.getTime() + durationInMinutes * 60 * 1000,
		);

		const updatedSession: FeedingSession = {
			...feeding,
			breast: values.breast,
			durationInSeconds: durationInMinutes * 60,
			endTime: endTime.toISOString(),
			id: feeding?.id ?? Date.now().toString(),
			startTime: startTime.toISOString(),
		};

		onSave(updatedSession);
		onClose();
	};

	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={true}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="grid gap-4 py-4">
						<div className="space-y-2">
							<Label>
								<fbt desc="Label for a radio group that allows the user to select which breat was used to feed">
									Breast
								</fbt>
							</Label>
							<RadioGroup
								className="flex gap-4"
								onValueChange={(value) =>
									setValue('breast', value as 'left' | 'right', {
										shouldValidate: true,
									})
								}
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

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit-date">
									<fbt desc="Label for a date input">Date</fbt>
								</Label>
								<Input id="edit-date" type="date" {...register('date')} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-time">
									<fbt desc="Label for a time input that sets the starting time of a feeding session">
										Start Time
									</fbt>
								</Label>
								<Input id="edit-time" type="time" {...register('time')} />
							</div>
						</div>

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
					</div>
					<DialogFooter>
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
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
