import type { ReactNode } from 'react';
import type {
	FeedingFormValues,
	FeedingSession,
	FeedingSessionFormData,
	FeedingType,
	MilkType,
} from '@/types/feeding';
import { useMemo } from 'react';
import { DateTimeInputs } from '@/components/form/date-time-inputs';
import { EntityFormDialog } from '@/components/form/entity-form-dialog';
import { Button } from '@/components/ui/button';
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
			? Math.round(feeding.durationInSeconds / 60).toString()
			: '',
		formulaProductId: feeding?.formulaProductId ?? '',
		milkType: feeding?.milkType ?? 'pumped',
		notes: feeding?.notes ?? '',
		teatId: feeding?.teatId ?? '',
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

	const [profile] = useProfile();
	const formulaProducts = useFormulaProductsSnapshot();
	const feedingProducts = useFeedingProductsSnapshot();

	const bottles = feedingProducts.filter((p) => p.type === 'bottle');
	const teats = feedingProducts.filter((p) => p.type === 'teat');

	const handleSave = (parsedValues: FeedingSessionFormData) => {
		const updatedSession: FeedingSession = {
			...feeding,
			...parsedValues,
			id: feeding?.id ?? Date.now().toString(),
		};

		onSave(updatedSession);
		onClose();
	};

	const showLeft = profile?.showLeftBreast ?? true;
	const showRight = profile?.showRightBreast ?? true;
	const showPumped = profile?.showPumpedMilk ?? true;
	const showFormula = profile?.showFormula ?? true;

	return (
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
			onClose={onClose}
			onSave={handleSave}
			title={title}
		>
			<div className="grid gap-4 py-4">
				<div className="space-y-2">
					<Label>
						<fbt desc="Label for feeding type selection">Type</fbt>
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
						<div className="flex items-center space-x-2">
							<RadioGroupItem id="type-pumping" value="pumping" />
							<Label htmlFor="type-pumping">Pumping</Label>
						</div>
					</RadioGroup>
				</div>

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
						<Input id="edit-duration" type="number" {...register('duration')} />
					</div>
					{(type === 'bottle' || type === 'pumping') && (
						<div className="space-y-2">
							<Label htmlFor="edit-amount">
								<fbt desc="Label for amount input">Amount (ml)</fbt>
							</Label>
							<Input id="edit-amount" type="number" {...register('amountMl')} />
						</div>
					)}
				</div>

				{type === 'bottle' && (
					<>
						<div className="space-y-2">
							<Label>Milk Type</Label>
							<RadioGroup
								className="flex gap-4"
								onValueChange={(value) => {
									setValue('milkType', value as MilkType, { shouldValidate: true });
								}}
								value={milkType}
							>
								{showPumped && (
									<div className="flex items-center space-x-2">
										<RadioGroupItem id="milk-pumped" value="pumped" />
										<Label htmlFor="milk-pumped">Pumped</Label>
									</div>
								)}
								{showFormula && (
									<div className="flex items-center space-x-2">
										<RadioGroupItem id="milk-formula" value="formula" />
										<Label htmlFor="milk-formula">Formula</Label>
									</div>
								)}
							</RadioGroup>
						</div>

						{milkType === 'formula' && formulaProducts.length > 0 && (
							<div className="space-y-2">
								<Label>Formula Product</Label>
								<Select
									onValueChange={(v) => setValue('formulaProductId', v ?? '')}
									value={watch('formulaProductId') ?? undefined}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select Formula" />
									</SelectTrigger>
									<SelectContent>
										{formulaProducts.map((p) => (
											<SelectItem key={p.id} value={p.id}>
												{p.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}

						<div className="grid grid-cols-2 gap-4">
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
							<div className="space-y-2">
								<Label>Teat / Tip</Label>
								<Select
									onValueChange={(v) => setValue('teatId', v ?? '')}
									value={watch('teatId') ?? undefined}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select Teat" />
									</SelectTrigger>
									<SelectContent>
										{teats.map((p) => (
											<SelectItem key={p.id} value={p.id}>
												{p.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</>
				)}

				<div className="space-y-2">
					<Label htmlFor="notes">Notes (optional)</Label>
					<Textarea id="notes" rows={2} {...register('notes')} />
				</div>
			</div>
		</EntityFormDialog>
	);
}
