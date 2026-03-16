import type { ReactNode } from 'react';
import type {
	FeedingFormValues,
	FeedingSession,
	FeedingSessionFormData,
	FeedingType,
} from '@/types/feeding';
import { useMemo, useState } from 'react';
import { DateTimeInputs } from '@/components/form/date-time-inputs';
import { EntityFormDialog } from '@/components/form/entity-form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useEntityForm } from '@/hooks/use-entity-form';
import { useFeedingProductsSnapshot } from '@/hooks/use-feeding-products';
import { useFormulaProductsSnapshot } from '@/hooks/use-formula-products';
import { useProfile } from '@/hooks/use-profile';
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
		amountMl: feeding?.amountMl?.toString() ?? '',
		bottleId: feeding?.bottleId ?? '',
		breast: feeding?.breast ?? 'left',
		date: dateToDateInputValue(feeding?.startTime ?? new Date()),
		duration: feeding?.durationInSeconds
			? (feeding.durationInSeconds / 60).toString()
			: '',
		formulaProductId: feeding?.formulaProductId ?? '',
		milkType: feeding?.milkType ?? 'pumped',
		notes: feeding?.notes ?? '',
		time: dateToTimeInputValue(feeding?.startTime ?? new Date()),
		type: feeding?.type ?? 'breast',
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

	const type = watch('type');
	const breast = watch('breast');
	const milkType = watch('milkType');
	const formulaProductId = watch('formulaProductId');

	const [profile] = useProfile();
	const formulaProducts = useFormulaProductsSnapshot();
	const feedingProducts = useFeedingProductsSnapshot();

	const [showAbortWarning, setShowAbortWarning] = useState(false);

	const bottles = feedingProducts.filter((p) => p.type === 'bottle');

	const handleSave = (parsedValues: FeedingSessionFormData) => {
		const updatedSession: FeedingSession = {
			...feeding,
			...parsedValues,
			id: feeding?.id ?? Date.now().toString(),
		};

		onSave(updatedSession);
		onClose();
	};

	const handleClose = () => {
		// Only show warning if this form was opened from an active timer (feeding.id exists and durationInSeconds is set)
		if (feeding?.id && feeding?.durationInSeconds !== undefined) {
			setShowAbortWarning(true);
		} else {
			onClose();
		}
	};

	const showLeft = profile?.showLeftBreast ?? true;
	const showRight = profile?.showRightBreast ?? true;
	const showPumped = profile?.showPumpedMilk ?? true;
	const showFormula = profile?.showFormula ?? true;

	const milkOptions = useMemo(() => {
		const options = [];
		if (showPumped) {
			options.push({ label: 'Pumped Milk', value: 'pumped' });
		}
		formulaProducts.forEach((p) => {
			options.push({ label: `Formula: ${p.name}`, value: `formula:${p.id}` });
		});
		return options;
	}, [showPumped, formulaProducts]);

	const selectedMilkValue = milkType === 'formula' ? `formula:${formulaProductId}` : 'pumped';

	return (
		<>
		<EntityFormDialog
			footer={
				<div className="flex justify-end gap-2 w-full mt-6">
					<Button onClick={onClose} type="button" variant="outline">
						<fbt common>Cancel</fbt>
					</Button>
					<Button
						className={
							type === 'bottle'
								? 'bg-blue-500 hover:bg-blue-600'
								: type === 'pumping'
									? 'bg-orange-500 hover:bg-orange-600'
									: breast === 'left'
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
			onClose={handleClose}
			onSave={handleSave}
			title={title}
		>
			<div className="grid gap-4 py-4">
				<div className="space-y-2">
					<Label>
						<fbt desc="Label for feeding category selection">Category</fbt>
					</Label>
					<RadioGroup
						className="flex gap-4"
						onValueChange={(value) => {
							const newType = value as 'feeding' | 'pumping';
							if (newType === 'feeding') {
								setValue('type', 'breast', { shouldValidate: true });
							} else {
								setValue('type', 'pumping', { shouldValidate: true });
							}
						}}
						value={type === 'pumping' ? 'pumping' : 'feeding'}
					>
						<div className="flex items-center space-x-2">
							<RadioGroupItem id="cat-feeding" value="feeding" />
							<Label htmlFor="cat-feeding">Feeding</Label>
						</div>
						<div className="flex items-center space-x-2">
							<RadioGroupItem id="cat-pumping" value="pumping" />
							<Label htmlFor="cat-pumping">Pumping</Label>
						</div>
					</RadioGroup>
				</div>

				{type !== 'pumping' ? (
					<div className="space-y-2">
						<Label>
							<fbt desc="Label for feeding method selection">Method</fbt>
						</Label>
						<RadioGroup
							className="flex gap-4"
							onValueChange={(value) => {
								setValue('type', value as FeedingType, { shouldValidate: true });
							}}
							value={type}
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem id="type-breast" value="breast" />
								<Label htmlFor="type-breast">Breast</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem id="type-bottle" value="bottle" />
								<Label htmlFor="type-bottle">Bottle</Label>
							</div>
						</RadioGroup>
					</div>
				) : null}

				{type !== 'bottle' && (
					<div className="space-y-2">
						<Label>
							<fbt desc="Label for breast selection">Breast</fbt>
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
							{showLeft && (
								<div className="flex items-center space-x-2">
									<RadioGroupItem
										className="text-left-breast border-left-breast"
										id="edit-left"
										value="left"
									/>
									<Label className="text-left-breast-dark" htmlFor="edit-left">
										Left
									</Label>
								</div>
							)}
							{showRight && (
								<div className="flex items-center space-x-2">
									<RadioGroupItem
										className="text-right-breast border-right-breast"
										id="edit-right"
										value="right"
									/>
									<Label className="text-right-breast-dark" htmlFor="edit-right">
										Right
									</Label>
								</div>
							)}
						</RadioGroup>
					</div>
				)}

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

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="edit-duration">
							<fbt desc="Label for duration input">Duration (min)</fbt>
						</Label>
						<Input id="edit-duration" step="any" type="number" {...register('duration')} />
					</div>
					{(type === 'bottle' || type === 'pumping') && (
						<div className="space-y-2">
							<Label htmlFor="edit-amount">
								<fbt desc="Label for amount input">Amount (ml)</fbt>
							</Label>
							<Input id="edit-amount" step="any" type="number" {...register('amountMl')} />
						</div>
					)}
				</div>

				{type === 'bottle' && (
					<>
						<div className="space-y-2">
							<Label>Milk</Label>
							<Select
								onValueChange={(v) => {
									if (!v) return;
									if (v === 'pumped') {
										setValue('milkType', 'pumped', { shouldValidate: true });
										setValue('formulaProductId', '');
									} else if (v.startsWith('formula:')) {
										setValue('milkType', 'formula', { shouldValidate: true });
										setValue('formulaProductId', v.replace('formula:', ''));
									}
								}}
								value={selectedMilkValue}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select Milk" />
								</SelectTrigger>
								<SelectContent>
									{milkOptions.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Bottle</Label>
							<Select
								onValueChange={(v) => setValue('bottleId', v ?? '')}
								value={watch('bottleId') ?? undefined}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select Bottle" />
								</SelectTrigger>
								<SelectContent>
									{bottles.map((p) => (
										<SelectItem key={p.id} value={p.id}>
											{p.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</>
				)}

				<div className="space-y-2">
					<Label htmlFor="notes">Notes (optional)</Label>
					<Textarea id="notes" rows={2} {...register('notes')} />
				</div>
			</div>
		</EntityFormDialog>

		<AlertDialog onOpenChange={setShowAbortWarning} open={showAbortWarning}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Abort session?</AlertDialogTitle>
					<AlertDialogDescription>
						The recorded data for this feeding session will be lost.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Continue Editing</AlertDialogCancel>
					<AlertDialogAction
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						onClick={onClose}
					>
						Abort
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
		</>
	);
}
