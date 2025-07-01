'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { fbt } from 'fbtee';
import { Check, ChevronsUpDown } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
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
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { MedicationAdministration } from '@/types/medication';
import { MedicationRegimen } from '@/types/medication-regimen';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { dateToTimeInputValue } from '@/utils/date-to-time-input-value';
import {
	MedicationAdministrationFormData,
	medicationAdministrationSchema,
} from '../validation/medication-administration-schema';

interface MedicationAdministrationFormProps {
	// To get unique one-off medication names for suggestions
	allAdministrations: readonly MedicationAdministration[];
	initialData?: MedicationAdministration;
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: MedicationAdministrationFormData, id?: string) => void;
	regimens: readonly MedicationRegimen[];
}

interface ComboboxOption {
	dosageAmount?: number;
	dosageUnit?: string;
	label: string; // medication name
	regimenId?: string;
	type: 'regimen' | 'one-off';
	value: string; // medication name, or special value for regimen
}

export const MedicationAdministrationForm: React.FC<
	MedicationAdministrationFormProps
> = ({
	allAdministrations,
	initialData,
	isOpen,
	onClose,
	onSubmit,
	regimens,
}) => {
	const [datePart, setDatePart] = useState<string>(() =>
		dateToDateInputValue(
			initialData?.timestamp ? new Date(initialData.timestamp) : new Date(),
		),
	);
	const [timePart, setTimePart] = useState<string>(() =>
		dateToTimeInputValue(
			initialData?.timestamp ? new Date(initialData.timestamp) : new Date(),
		),
	);
	const [comboboxOpen, setComboboxOpen] = useState(false);

	const form = useForm<MedicationAdministrationFormData>({
		defaultValues: {
			administrationStatus: initialData?.administrationStatus || 'On Time',
			details: initialData?.details || '',
			dosageAmount: initialData?.dosageAmount || undefined,
			dosageUnit: initialData?.dosageUnit || '',
			medicationName: initialData?.medicationName || '',
			regimenId: initialData?.regimenId || undefined,
			timestamp: initialData?.timestamp || new Date().toISOString(),
		},
		resolver: zodResolver(medicationAdministrationSchema),
	});

	useEffect(() => {
		const newTimestamp = new Date(
			`${datePart}T${timePart}:00.000Z`,
		).toISOString();
		form.setValue('timestamp', newTimestamp, {
			shouldDirty: true,
			shouldValidate: true,
		});
	}, [datePart, timePart, form]);

	useEffect(() => {
		if (isOpen) {
			// Reset form when dialog opens or initialData changes
			const initialTimestamp = initialData?.timestamp
				? new Date(initialData.timestamp)
				: new Date();
			setDatePart(dateToDateInputValue(initialTimestamp));
			setTimePart(dateToTimeInputValue(initialTimestamp));

			form.reset({
				administrationStatus: initialData?.administrationStatus || 'On Time',
				details: initialData?.details || '',
				dosageAmount: initialData?.dosageAmount || undefined,
				dosageUnit: initialData?.dosageUnit || '',
				medicationName: initialData?.medicationName || '',
				regimenId: initialData?.regimenId || undefined,
				timestamp: initialTimestamp.toISOString(),
			});
		}
	}, [initialData, form, isOpen]);

	const medicationOptions = useMemo(() => {
		const options: ComboboxOption[] = [];
		const seenNames = new Set<string>();

		// Add regimens
		regimens.forEach((reg) => {
			const value = `regimen-${reg.id}-${reg.name}`; // Unique value for regimen
			options.push({
				dosageAmount: reg.dosageAmount,
				dosageUnit: reg.dosageUnit,
				label: reg.name,
				regimenId: reg.id,
				type: 'regimen',
				value,
			});
			seenNames.add(reg.name.toLowerCase());
		});

		// Add unique one-off medication names from past administrations
		allAdministrations.forEach((admin) => {
			if (
				!admin.regimenId &&
				admin.medicationName &&
				!seenNames.has(admin.medicationName.toLowerCase())
			) {
				options.push({
					dosageAmount: admin.dosageAmount,
					dosageUnit: admin.dosageUnit,
					label: admin.medicationName,
					type: 'one-off',
					value: admin.medicationName, // Use name itself as value for one-offs
				});
				seenNames.add(admin.medicationName.toLowerCase());
			}
		});
		return options;
	}, [regimens, allAdministrations]);

	const handleFormSubmit = (data: MedicationAdministrationFormData) => {
		onSubmit(data, initialData?.id);
		onClose();
	};

	if (!isOpen) {
		return null;
	}

	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{initialData ? (
							<fbt desc="Dialog title for editing a medication entry">
								Edit Medication Entry
							</fbt>
						) : (
							<fbt desc="Dialog title for adding a new medication entry">
								Add Medication Entry
							</fbt>
						)}
					</DialogTitle>
					<DialogDescription>
						{initialData ? (
							<fbt desc="Dialog description for editing a medication entry">
								Update the details of this medication administration.
							</fbt>
						) : (
							<fbt desc="Dialog description for adding a new medication entry">
								Log a new medication administration.
							</fbt>
						)}
					</DialogDescription>
				</DialogHeader>
				<form
					className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3"
					onSubmit={form.handleSubmit(handleFormSubmit)}
				>
					{/* Medication Name (Combobox) */}
					<div className="space-y-1">
						<Label htmlFor="medicationName">
							<fbt desc="Label for medication name input">Medication Name</fbt>
						</Label>
						<Controller
							control={form.control}
							name="medicationName"
							render={({ field }) => (
								<Popover onOpenChange={setComboboxOpen} open={comboboxOpen}>
									<PopoverTrigger asChild>
										<Button
											aria-expanded={comboboxOpen}
											className="w-full justify-between"
											role="combobox"
											variant="outline"
										>
											{field.value ? (
												medicationOptions.find(
													(option) =>
														option.value === field.value ||
														option.label === field.value,
												)?.label || field.value
											) : (
												<fbt desc="Placeholder text for medication name combobox">
													Select or type medication...
												</fbt>
											)}
											<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-[--radix-popover-trigger-width] p-0">
										<Command
											filter={(value, search) => {
												const option = medicationOptions.find(
													(opt) => opt.value === value,
												);
												if (
													option?.label
														.toLowerCase()
														.includes(search.toLowerCase())
												)
													return 1;
												return 0;
											}}
										>
											<CommandInput
												placeholder={fbt(
													'Search medication...',
													'Placeholder for medication search input in combobox',
												)}
											/>
											<CommandList>
												<CommandEmpty>
													<fbt desc="Message shown when no medication is found in combobox search">
														No medication found.
													</fbt>
												</CommandEmpty>
												<CommandGroup>
													{medicationOptions.map((option) => (
														<CommandItem
															key={option.value}
															onSelect={(currentValue) => {
																const selectedOption = medicationOptions.find(
																	(opt) => opt.value === currentValue,
																);
																if (selectedOption) {
																	form.setValue(
																		'medicationName',
																		selectedOption.label,
																		{ shouldDirty: true, shouldValidate: true },
																	);
																	form.setValue(
																		'dosageAmount',
																		selectedOption.dosageAmount ?? Number.NaN,
																		{ shouldDirty: true },
																	);
																	form.setValue(
																		'dosageUnit',
																		selectedOption.dosageUnit || '',
																		{ shouldDirty: true },
																	);
																	form.setValue(
																		'regimenId',
																		selectedOption.regimenId || undefined,
																		{ shouldDirty: true },
																	);
																} else {
																	// Manual entry
																	form.setValue(
																		'medicationName',
																		currentValue,
																		{ shouldDirty: true, shouldValidate: true },
																	); // Use raw input if not found
																	form.setValue('regimenId', undefined, {
																		shouldDirty: true,
																	}); // Clear regimenId for manual entry
																}
																setComboboxOpen(false);
															}}
															value={option.value}
														>
															<Check
																className={cn(
																	'mr-2 h-4 w-4',
																	field.value === option.label ||
																		field.value === option.value
																		? 'opacity-100'
																		: 'opacity-0',
																)}
															/>
															{option.label}{' '}
															{option.type === 'regimen' && (
																<span className="text-xs text-muted-foreground ml-2">
																	(Regimen)
																</span>
															)}
														</CommandItem>
													))}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
							)}
						/>
						{form.formState.errors.medicationName && (
							<p className="text-sm text-red-500">
								{form.formState.errors.medicationName.message}
							</p>
						)}
					</div>

					{/* Dosage Amount & Unit */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1">
							<Label htmlFor="dosageAmount">
								<fbt desc="Label for dosage amount input">Dosage Amount</fbt>
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
								<fbt desc="Label for dosage unit input">Unit</fbt>
							</Label>
							<Input
								id="dosageUnit"
								{...form.register('dosageUnit')}
								placeholder={fbt(
									'e.g., ml, mg, drops',
									'Placeholder for dosage unit input',
								)}
							/>
							{form.formState.errors.dosageUnit && (
								<p className="text-sm text-red-500">
									{form.formState.errors.dosageUnit.message}
								</p>
							)}
						</div>
					</div>

					{/* Timestamp (Date and Time) */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1">
							<Label htmlFor="adminDate">
								<fbt common>
									Date
								</fbt>
							</Label>
							<Input
								id="adminDate"
								onChange={(e) => setDatePart(e.target.value)}
								type="date"
								value={datePart}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="adminTime">
								<fbt common>
									Time
								</fbt>
							</Label>
							<Input
								id="adminTime"
								onChange={(e) => setTimePart(e.target.value)}
								type="time"
								value={timePart}
							/>
						</div>
					</div>
					{/* Hidden input for react-hook-form to track the combined timestamp */}
					<input type="hidden" {...form.register('timestamp')} />
					{form.formState.errors.timestamp && (
						<p className="text-sm text-red-500">
							{form.formState.errors.timestamp.message}
						</p>
					)}

					{/* Administration Status */}
					<div className="space-y-1">
						<Label>
							<fbt desc="Label for administration status radio group">
								Administration Status
							</fbt>
						</Label>
						<Controller
							control={form.control}
							name="administrationStatus"
							render={({ field }) => (
								<RadioGroup
									className="flex space-x-4 pt-1"
									onValueChange={field.onChange}
									value={field.value}
								>
									{(['On Time', 'Missed', 'Adjusted'] as const).map(
										(status) => (
											<div className="flex items-center space-x-2" key={status}>
												<RadioGroupItem
													id={`status-${status}`}
													value={status}
												/>
												<Label htmlFor={`status-${status}`}>{status}</Label>
											</div>
										),
									)}
								</RadioGroup>
							)}
						/>
						{form.formState.errors.administrationStatus && (
							<p className="text-sm text-red-500">
								{form.formState.errors.administrationStatus.message}
							</p>
						)}
					</div>

					{/* Details/Notes */}
					<div className="space-y-1">
						<Label htmlFor="details">
							<fbt desc="Label for optional details/notes textarea">
								Details/Notes (Optional)
							</fbt>
						</Label>
						<Textarea
							id="details"
							{...form.register('details')}
							placeholder={fbt(
								'e.g., child spit out some, given with food',
								'Placeholder for medication administration notes',
							)}
						/>
					</div>

					<DialogFooter>
						<Button onClick={onClose} type="button" variant="outline">
							<fbt common>Cancel</fbt>
						</Button>
						<Button disabled={form.formState.isSubmitting} type="submit">
							{initialData ? (
								<fbt desc="Button text to save changes to an existing medication entry">Save Changes</fbt>
							) : (
								<fbt desc="Button text to save a new medication entry">Save Entry</fbt>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
