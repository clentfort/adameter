'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { fbt } from 'fbtee';
import { PlusCircleIcon, XCircleIcon } from 'lucide-react'; // Using lucide-react for icons
import React from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MedicationRegimen } from '@/types/medication-regimen';
import {
	MedicationRegimenFormData,
	medicationRegimenSchema,
	transformFormDataToMedicationRegimen,
} from '../validation/medication-regimen-schema';

interface MedicationRegimenFormProps {
	initialData?: MedicationRegimen; // For potential future edit functionality
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: MedicationRegimen) => void;
}

export const MedicationRegimenForm: React.FC<MedicationRegimenFormProps> = ({
	initialData,
	isOpen,
	onClose,
	onSubmit,
}) => {
	const form = useForm<MedicationRegimenFormData>({
		defaultValues: {
			asNeededDetails:
				initialData?.schedule?.type === 'asNeeded'
					? initialData.schedule.details
					: '',
			dailyTimes:
				initialData?.schedule?.type === 'daily'
					? initialData.schedule.times.map((t) => ({ time: t }))
					: [{ time: '10:00' }],
			dosageAmount: initialData?.dosageAmount ?? Number.NaN,
			dosageUnit: initialData?.dosageUnit || '',
			endDate: initialData?.endDate
				? new Date(initialData.endDate).toISOString().split('T')[0]
				: '',
			intervalFirstDoseTime:
				initialData?.schedule?.type === 'interval'
					? initialData.schedule.firstDoseTime
					: undefined,
			intervalUnit:
				initialData?.schedule?.type === 'interval'
					? initialData.schedule.intervalUnit
					: 'hours',
			intervalValue:
				initialData?.schedule?.type === 'interval'
					? initialData.schedule.intervalValue
					: undefined,
			name: initialData?.name || '',
			notes: initialData?.notes || '',
			prescriber: initialData?.prescriber || 'Self',
			prescriberName: initialData?.prescriberName || '',
			scheduleType: initialData?.schedule?.type || 'daily',
			startDate: initialData?.startDate
				? new Date(initialData.startDate).toISOString().split('T')[0]
				: new Date().toISOString().split('T')[0],
			weeklyDaysOfWeek:
				initialData?.schedule?.type === 'weekly'
					? initialData.schedule.daysOfWeek
					: [],
			weeklyTimes:
				initialData?.schedule?.type === 'weekly'
					? initialData.schedule.times.map((t) => ({ time: t }))
					: [{ time: '10:00' }],
		},
		resolver: zodResolver(medicationRegimenSchema),
	});

	const {
		append: appendDailyTime,
		fields: dailyTimesFields,
		remove: removeDailyTime,
	} = useFieldArray({
		control: form.control,
		name: 'dailyTimes',
	});

	const {
		append: appendWeeklyTime,
		fields: weeklyTimesFields,
		remove: removeWeeklyTime,
	} = useFieldArray({
		control: form.control,
		name: 'weeklyTimes',
	});

	const scheduleType = form.watch('scheduleType');
	const prescriber = form.watch('prescriber');

	const handleFormSubmit = (data: MedicationRegimenFormData) => {
		const newRegimen = transformFormDataToMedicationRegimen(
			data,
			initialData?.id,
		);
		onSubmit(newRegimen);
		onClose();
	};

	if (!isOpen) {
		return null;
	}

	const daysOfWeekOptions: MedicationRegimenFormData['weeklyDaysOfWeek'] = [
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
		'Sunday',
	];

	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
			<DialogContent className="sm:max-w-2xl">
				{' '}
				{/* Increased width for complex form */}
				<DialogHeader>
					<DialogTitle>
						{initialData ? (
							<fbt desc="Dialog title for editing a medication regimen">
								Edit Medication Regimen
							</fbt>
						) : (
							<fbt desc="Dialog title for adding a new medication regimen">
								Add New Medication Regimen
							</fbt>
						)}
					</DialogTitle>
					<DialogDescription>
						{initialData ? (
							<fbt desc="Dialog description for editing a medication regimen">
								Update the details of this medication regimen.
							</fbt>
						) : (
							<fbt desc="Dialog description for adding a new medication regimen">
								Define a new medication regimen for your baby.
							</fbt>
						)}
					</DialogDescription>
				</DialogHeader>
				<form
					className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3" // Added max-height and scroll
					onSubmit={form.handleSubmit(handleFormSubmit)}
				>
					{/* Basic Information */}
					<div className="space-y-1">
						<Label htmlFor="name">
							<fbt desc="Label for medication name">Medication Name</fbt>
						</Label>
						<Input id="name" {...form.register('name')} />
						{form.formState.errors.name && (
							<p className="text-sm text-red-500">
								{form.formState.errors.name.message}
							</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1">
							<Label htmlFor="dosageAmount">
								<fbt desc="Label for dosage amount">Dosage Amount</fbt>
							</Label>
							<Input
								id="dosageAmount"
								step="any"
								type="number"
								{...form.register('dosageAmount', { valueAsNumber: true })}
							/>
							{form.formState.errors.dosageAmount && (
								<p className="text-sm text-red-500">
									{form.formState.errors.dosageAmount.message}
								</p>
							)}
						</div>
						<div className="space-y-1">
							<Label htmlFor="dosageUnit">
								<fbt desc="Label for dosage unit">Unit</fbt>
							</Label>
							<Input
								id="dosageUnit"
								{...form.register('dosageUnit')}
								placeholder={fbt(
									'e.g., ml, mg, drops',
									'Placeholder for dosage unit',
								).toString()}
							/>
							{form.formState.errors.dosageUnit && (
								<p className="text-sm text-red-500">
									{form.formState.errors.dosageUnit.message}
								</p>
							)}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1">
							<Label htmlFor="startDate">
								<fbt desc="Label for start date">Start Date</fbt>
							</Label>
							<Input
								id="startDate"
								type="date"
								{...form.register('startDate')}
							/>
							{form.formState.errors.startDate && (
								<p className="text-sm text-red-500">
									{form.formState.errors.startDate.message}
								</p>
							)}
						</div>
						<div className="space-y-1">
							<Label htmlFor="endDate">
								<fbt desc="Label for end date (optional)">
									End Date (Optional)
								</fbt>
							</Label>
							<Input id="endDate" type="date" {...form.register('endDate')} />
							{form.formState.errors.endDate && (
								<p className="text-sm text-red-500">
									{form.formState.errors.endDate.message}
								</p>
							)}
						</div>
					</div>

					{/* Prescriber Information */}
					<div className="space-y-1">
						<Label>
							<fbt desc="Label for prescriber type">Prescriber</fbt>
						</Label>
						<Controller
							control={form.control}
							name="prescriber"
							render={({ field }) => (
								<RadioGroup
									className="flex space-x-4 pt-1"
									onValueChange={field.onChange}
									value={field.value}
								>
									{(['Self', 'Midwife', 'Doctor'] as const).map((p) => (
										<div className="flex items-center space-x-2" key={p}>
											<RadioGroupItem id={`prescriber-${p}`} value={p} />
											<Label htmlFor={`prescriber-${p}`}>{p}</Label>
										</div>
									))}
								</RadioGroup>
							)}
						/>
						{form.formState.errors.prescriber && (
							<p className="text-sm text-red-500">
								{form.formState.errors.prescriber.message}
							</p>
						)}
					</div>

					{(prescriber === 'Midwife' || prescriber === 'Doctor') && (
						<div className="space-y-1">
							<Label htmlFor="prescriberName">
								<fbt desc="Label for prescriber name (optional)">
									Prescriber Name (Optional)
								</fbt>
							</Label>
							<Input id="prescriberName" {...form.register('prescriberName')} />
							{form.formState.errors.prescriberName && (
								<p className="text-sm text-red-500">
									{form.formState.errors.prescriberName.message}
								</p>
							)}
						</div>
					)}

					{/* Schedule Information */}
					<div className="space-y-1">
						<Label>
							<fbt desc="Label for schedule type">Schedule Type</fbt>
						</Label>
						<Controller
							control={form.control}
							name="scheduleType"
							render={({ field }) => (
								<Select onValueChange={field.onChange} value={field.value}>
									<SelectTrigger>
										<SelectValue
											placeholder={fbt(
												'Select schedule type',
												'Placeholder for schedule type select',
											).toString()}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="daily">
											<fbt desc="Daily schedule option">Daily</fbt>
										</SelectItem>
										<SelectItem value="interval">
											<fbt desc="Interval schedule option">Interval</fbt>
										</SelectItem>
										<SelectItem value="weekly">
											<fbt desc="Weekly schedule option">Weekly</fbt>
										</SelectItem>
										<SelectItem value="asNeeded">
											<fbt desc="As Needed schedule option">
												As Needed (PRN)
											</fbt>
										</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
					</div>

					{/* Conditional Schedule Fields */}
					{scheduleType === 'daily' && (
						<div className="space-y-2 p-3 border rounded-md">
							<Label className="font-medium">
								<fbt desc="Section title for daily schedule times">
									Times per day
								</fbt>
							</Label>
							{dailyTimesFields.map((field, index) => (
								<div className="flex items-center gap-2" key={field.id}>
									<Input
										type="time"
										{...form.register(`dailyTimes.${index}.time` as const)}
										className="w-full"
									/>
									{dailyTimesFields.length > 1 && (
										<Button
											onClick={() => removeDailyTime(index)}
											size="icon"
											type="button"
											variant="ghost"
										>
											<XCircleIcon className="h-5 w-5 text-red-500" />
										</Button>
									)}
								</div>
							))}
							<Button
								onClick={() => appendDailyTime({ time: '' })}
								size="sm"
								type="button"
								variant="outline"
							>
								<PlusCircleIcon className="h-4 w-4 mr-2" />
								<fbt desc="Button to add another time for daily schedule">
									Add Time
								</fbt>
							</Button>
							{form.formState.errors.dailyTimes && (
								<p className="text-sm text-red-500">
									{form.formState.errors.dailyTimes.message}
								</p>
							)}
						</div>
					)}

					{scheduleType === 'interval' && (
						<div className="space-y-2 p-3 border rounded-md">
							<Label className="font-medium">
								<fbt desc="Section title for interval schedule">
									Interval Details
								</fbt>
							</Label>
							<div className="space-y-1">
								<Label htmlFor="intervalFirstDoseTime">
									<fbt desc="Label for first dose time in interval schedule">
										First Dose Time (after start date)
									</fbt>
								</Label>
								<Input
									id="intervalFirstDoseTime"
									type="time"
									{...form.register('intervalFirstDoseTime')}
								/>
								{form.formState.errors.intervalFirstDoseTime && (
									<p className="text-sm text-red-500">
										{form.formState.errors.intervalFirstDoseTime.message}
									</p>
								)}
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<Label htmlFor="intervalValue">
										<fbt desc="Label for interval value">Interval Value</fbt>
									</Label>
									<Input
										id="intervalValue"
										type="number"
										{...form.register('intervalValue', { valueAsNumber: true })}
									/>
									{form.formState.errors.intervalValue && (
										<p className="text-sm text-red-500">
											{form.formState.errors.intervalValue.message}
										</p>
									)}
								</div>
								<div className="space-y-1">
									<Label htmlFor="intervalUnit">
										<fbt desc="Label for interval unit">Interval Unit</fbt>
									</Label>
									<Controller
										control={form.control}
										name="intervalUnit"
										render={({ field }) => (
											<Select
												defaultValue="hours"
												onValueChange={field.onChange}
												value={field.value}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="hours">
														<fbt desc="Hours option for interval unit">
															Hours
														</fbt>
													</SelectItem>
													<SelectItem value="days">
														<fbt desc="Days option for interval unit">Days</fbt>
													</SelectItem>
												</SelectContent>
											</Select>
										)}
									/>
									{form.formState.errors.intervalUnit && (
										<p className="text-sm text-red-500">
											{form.formState.errors.intervalUnit.message}
										</p>
									)}
								</div>
							</div>
						</div>
					)}

					{scheduleType === 'weekly' && (
						<div className="space-y-2 p-3 border rounded-md">
							<Label className="font-medium">
								<fbt desc="Section title for weekly schedule">
									Weekly Details
								</fbt>
							</Label>
							<div className="space-y-1">
								<Label>
									<fbt desc="Label for days of week selection">
										Days of the Week
									</fbt>
								</Label>
								<Controller
									control={form.control}
									name="weeklyDaysOfWeek"
									render={({ field }) => (
										<div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
											{daysOfWeekOptions?.map((day) => (
												<div className="flex items-center space-x-2" key={day}>
													<Checkbox
														checked={field.value?.includes(day)}
														id={`weekly-${day}`}
														onCheckedChange={(checked) => {
															const currentDays = field.value || [];
															if (checked) {
																field.onChange([...currentDays, day]);
															} else {
																field.onChange(
																	currentDays.filter((d) => d !== day),
																);
															}
														}}
													/>
													<Label
														className="font-normal"
														htmlFor={`weekly-${day}`}
													>
														{day}
													</Label>
												</div>
											))}
										</div>
									)}
								/>
								{form.formState.errors.weeklyDaysOfWeek && (
									<p className="text-sm text-red-500">
										{form.formState.errors.weeklyDaysOfWeek.message}
									</p>
								)}
							</div>
							<Label className="font-medium">
								<fbt desc="Section title for weekly schedule times">
									Times on selected days
								</fbt>
							</Label>
							{weeklyTimesFields.map((field, index) => (
								<div className="flex items-center gap-2" key={field.id}>
									<Input
										type="time"
										{...form.register(`weeklyTimes.${index}.time` as const)}
										className="w-full"
									/>
									{weeklyTimesFields.length > 1 && (
										<Button
											onClick={() => removeWeeklyTime(index)}
											size="icon"
											type="button"
											variant="ghost"
										>
											<XCircleIcon className="h-5 w-5 text-red-500" />
										</Button>
									)}
								</div>
							))}
							<Button
								onClick={() => appendWeeklyTime({ time: '' })}
								size="sm"
								type="button"
								variant="outline"
							>
								<PlusCircleIcon className="h-4 w-4 mr-2" />
								<fbt desc="Button to add another time for weekly schedule">
									Add Time
								</fbt>
							</Button>
							{form.formState.errors.weeklyTimes && (
								<p className="text-sm text-red-500">
									{form.formState.errors.weeklyTimes.message}
								</p>
							)}
						</div>
					)}

					{scheduleType === 'asNeeded' && (
						<div className="space-y-1 p-3 border rounded-md">
							<Label htmlFor="asNeededDetails">
								<fbt desc="Label for as needed details">
									Details (e.g., &ldquo;When fever above 38C&rdquo;)
								</fbt>
							</Label>
							<Textarea
								id="asNeededDetails"
								{...form.register('asNeededDetails')}
							/>
							{form.formState.errors.asNeededDetails && (
								<p className="text-sm text-red-500">
									{form.formState.errors.asNeededDetails.message}
								</p>
							)}
						</div>
					)}

					{/* Notes */}
					<div className="space-y-1">
						<Label htmlFor="notes">
							<fbt desc="Label for optional notes about the regimen">
								Notes (Optional)
							</fbt>
						</Label>
						<Textarea
							id="notes"
							{...form.register('notes')}
							placeholder={fbt(
								'e.g., Take with food, Complete the full course',
								'Placeholder for regimen notes',
							).toString()}
						/>
					</div>

					<DialogFooter>
						<Button onClick={onClose} type="button" variant="outline">
							<fbt common>Cancel</fbt>
						</Button>
						<Button disabled={form.formState.isSubmitting} type="submit">
							{initialData ? (
								<fbt desc="Button text to save changes to an existing regimen">
									Save Changes
								</fbt>
							) : (
								<fbt desc="Button text to save a new regimen">Save Regimen</fbt>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
