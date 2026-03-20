import type { ReactNode } from 'react';
import type {
	DiaperChange,
	DiaperFormData,
	DiaperFormValues,
} from '@/types/diaper';
import { fbt } from 'fbtee';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DateTimeInputs } from '@/components/form/date-time-inputs';
import { EntityFormDialog } from '@/components/form/entity-form-dialog';
import ProductForm from '@/components/product-form';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useDiaperChangesSnapshot } from '@/hooks/use-diaper-changes';
import {
	useDiaperProduct,
	useFrecencySortedDiaperProductIds,
	useUpsertDiaperProduct,
} from '@/hooks/use-diaper-products';
import { useEntityForm } from '@/hooks/use-entity-form';
import { useUnitSystem } from '@/hooks/use-unit-system';
import { cn } from '@/lib/utils';
import { diaperFormToDataSchema } from '@/types/diaper';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { dateToTimeInputValue } from '@/utils/date-to-time-input-value';
import {
	celsiusToFahrenheit,
	fahrenheitToCelsius,
} from '@/utils/unit-conversions';
import { isAbnormalTemperature } from '../utils/is-abnormal-temperature';

export interface AddDiaperProps {
	onClose: () => void;
	onSave: (change: DiaperChange) => void;
	presetDiaperProductId?: string;
	presetType?: 'urine' | 'stool' | undefined;
	title: ReactNode;
}

export interface EditDiaperProps {
	change: DiaperChange;
	onClose: () => void;
	onSave: (change: DiaperChange) => void;
	title: ReactNode;
}

type DiaperFormProps = AddDiaperProps | EditDiaperProps;

interface DiaperProductSelectItemProps {
	currentProductId: string | undefined;
	productId: string;
	selectedProductId: string;
}

interface MatrixToggleButtonProps {
	isSelected: boolean;
	label: string;
	onClick: () => void;
	testId: string;
}

function MatrixToggleButton({
	isSelected,
	label,
	onClick,
	testId,
}: MatrixToggleButtonProps) {
	return (
		<Button
			className={cn(
				'h-12 w-full transition-all',
				isSelected
					? 'ring-2 ring-primary ring-offset-1 border-primary bg-primary/10 shadow-xs'
					: 'text-muted-foreground',
			)}
			data-testid={testId}
			onClick={onClick}
			type="button"
			variant="outline"
		>
			<span className="text-xl">{label}</span>
		</Button>
	);
}

interface MatrixRowProps {
	isStoolSelected: boolean;
	isUrineSelected: boolean;
	onStoolToggle: () => void;
	onUrineToggle: () => void;
	rowLabel: ReactNode;
	stoolTestId: string;
	urineTestId: string;
}

function MatrixRow({
	isStoolSelected,
	isUrineSelected,
	onStoolToggle,
	onUrineToggle,
	rowLabel,
	stoolTestId,
	urineTestId,
}: MatrixRowProps) {
	return (
		<>
			<div className="text-sm font-medium">{rowLabel}</div>
			<MatrixToggleButton
				isSelected={isUrineSelected}
				label="💧"
				onClick={onUrineToggle}
				testId={urineTestId}
			/>
			<MatrixToggleButton
				isSelected={isStoolSelected}
				label="💩"
				onClick={onStoolToggle}
				testId={stoolTestId}
			/>
		</>
	);
}

function DiaperProductSelectItem({
	currentProductId,
	productId,
	selectedProductId,
}: DiaperProductSelectItemProps) {
	const product = useDiaperProduct(productId);

	if (!product) {
		return null;
	}

	if (
		product.archived &&
		product.id !== selectedProductId &&
		product.id !== currentProductId
	) {
		return null;
	}

	return <SelectItem value={product.id}>{product.name}</SelectItem>;
}

function getDefaultValues(
	change: DiaperChange | undefined,
	presetDiaperProductId: string | undefined,
	presetType: 'stool' | 'urine' | undefined,
): DiaperFormValues {
	return {
		containsStool: change?.containsStool ?? presetType === 'stool',
		containsUrine:
			change?.containsUrine ??
			(presetType === undefined ||
				presetType === 'urine' ||
				presetType === 'stool'),
		date: dateToDateInputValue(change?.timestamp ?? new Date()),
		diaperProductId: change?.diaperProductId ?? presetDiaperProductId ?? '',
		leakage: change?.leakage ?? false,
		notes: change?.notes ?? '',
		pottyStool: change?.pottyStool ?? false,
		pottyUrine: change?.pottyUrine ?? false,
		temperature: change?.temperature?.toString() ?? '',
		time: dateToTimeInputValue(change?.timestamp ?? new Date()),
	};
}

export default function DiaperForm(props: AddDiaperProps): ReactNode;
export default function DiaperForm(props: EditDiaperProps): ReactNode;
export default function DiaperForm({
	onClose,
	onSave,
	title,
	...props
}: DiaperFormProps) {
	const unitSystem = useUnitSystem();
	const isImperial = unitSystem === 'imperial';
	const upsertProduct = useUpsertDiaperProduct();
	const changes = useDiaperChangesSnapshot();
	const sortedProductIds = useFrecencySortedDiaperProductIds(changes);

	const [isAddingProduct, setIsAddingProduct] = useState(false);
	const change = 'change' in props ? props.change : undefined;

	const presetDiaperProductId =
		'presetDiaperProductId' in props ? props.presetDiaperProductId : undefined;
	const presetType = 'presetType' in props ? props.presetType : undefined;

	const defaultValues = useMemo(() => {
		const values = getDefaultValues(change, presetDiaperProductId, presetType);
		if (isImperial && values.temperature) {
			const celsius = Number.parseFloat(values.temperature);
			if (!Number.isNaN(celsius)) {
				values.temperature = celsiusToFahrenheit(celsius).toFixed(1);
			}
		}
		return values;
	}, [change, presetDiaperProductId, presetType, isImperial]);

	const form = useEntityForm<DiaperFormValues, undefined, DiaperFormData>(
		diaperFormToDataSchema,
		defaultValues,
	);

	const { formState, register, setValue, watch } = form;

	const containsUrine = watch('containsUrine');
	const containsStool = watch('containsStool');
	const pottyUrine = watch('pottyUrine');
	const pottyStool = watch('pottyStool');
	const hasLeakage = watch('leakage');
	const diaperProductId = watch('diaperProductId') ?? '';
	const selectedProduct = useDiaperProduct(
		diaperProductId.length > 0 ? diaperProductId : undefined,
	);
	const temperature = watch('temperature');

	const handleSave = (parsedValues: DiaperFormData) => {
		let temperature = parsedValues.temperature;
		if (isImperial && temperature != null) {
			temperature = Math.round(fahrenheitToCelsius(temperature) * 10) / 10;
		}

		const updatedChange: DiaperChange = {
			...change,
			containsStool: parsedValues.containsStool,
			containsUrine: parsedValues.containsUrine,
			diaperProductId: parsedValues.diaperProductId,
			id: change?.id || Date.now().toString(),
			leakage: parsedValues.leakage,
			notes: parsedValues.notes,
			pottyStool: parsedValues.pottyStool,
			pottyUrine: parsedValues.pottyUrine,
			temperature,
			timestamp: parsedValues.timestamp,
		};

		onSave(updatedChange);
		onClose();
	};

	return (
		<>
			<EntityFormDialog
				form={form}
				onClose={onClose}
				onSave={handleSave}
				title={title}
			>
				<div className="grid gap-4 py-2">
					<div className="space-y-3">
						<div className="grid grid-cols-3 gap-3 items-center">
							<div />
							<div className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
								<fbt desc="Urine column header">Urine</fbt>
							</div>
							<div className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
								<fbt desc="Stool column header">Stool</fbt>
							</div>

							<MatrixRow
								isStoolSelected={containsStool}
								isUrineSelected={containsUrine}
								onStoolToggle={() =>
									setValue('containsStool', !containsStool, {
										shouldValidate: true,
									})
								}
								onUrineToggle={() =>
									setValue('containsUrine', !containsUrine, {
										shouldValidate: true,
									})
								}
								rowLabel={
									<fbt desc="Label for the diaper row in the contents matrix">
										Diaper
									</fbt>
								}
								stoolTestId="toggle-diaper-stool"
								urineTestId="toggle-diaper-urine"
							/>

							<MatrixRow
								isStoolSelected={pottyStool}
								isUrineSelected={pottyUrine}
								onStoolToggle={() =>
									setValue('pottyStool', !pottyStool, {
										shouldValidate: true,
									})
								}
								onUrineToggle={() =>
									setValue('pottyUrine', !pottyUrine, {
										shouldValidate: true,
									})
								}
								rowLabel={
									<fbt desc="Label for the potty row in the contents matrix">
										Potty
									</fbt>
								}
								stoolTestId="toggle-potty-stool"
								urineTestId="toggle-potty-urine"
							/>
						</div>

						<div className="flex items-center space-x-2">
							<Switch
								checked={hasLeakage}
								id="edit-leakage"
								onCheckedChange={(checked) => {
									setValue('leakage', checked, { shouldValidate: true });
								}}
							/>
							<Label htmlFor="edit-leakage">
								<fbt desc="Label for a switch button that indicates that a diaper has leaked">
									Diaper leaked
								</fbt>
							</Label>
						</div>
					</div>

					<DateTimeInputs
						dateField="date"
						errors={formState.errors}
						register={register}
						timeField="time"
					/>

					<div className="space-y-2">
						<Label htmlFor="edit-diaper-product">
							<fbt desc="Label on a select that allows the user to pick a diaper product">
								Product
							</fbt>
						</Label>
						<div className="flex gap-2">
							<div className="flex-1 min-w-0">
								<Select
									onValueChange={(value) => {
										setValue('diaperProductId', value ?? '', {
											shouldValidate: true,
										});
									}}
									value={diaperProductId}
								>
									<SelectTrigger className="w-full" id="edit-diaper-product">
										<SelectValue
											placeholder={
												<fbt desc="Placeholder text on a select that allows the user to pick a diaper product">
													Select Product
												</fbt>
											}
										>
											{selectedProduct?.name}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{sortedProductIds.map((productId) => (
											<DiaperProductSelectItem
												currentProductId={change?.diaperProductId}
												key={productId}
												productId={productId}
												selectedProductId={diaperProductId}
											/>
										))}
									</SelectContent>
								</Select>
							</div>
							<Button
								onClick={() => setIsAddingProduct(true)}
								size="icon"
								type="button"
								variant="outline"
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="edit-temperature">
							{isImperial ? (
								<fbt desc="Label on an input to specify the body temperature in degree Fahrenheit">
									Temperature (°F)
								</fbt>
							) : (
								<fbt desc="Label on an input to specificy the body temperature in degree Celsius">
									Temperature (°C)
								</fbt>
							)}
						</Label>
						<Input
							className={
								temperature &&
								isAbnormalTemperature(
									isImperial
										? fahrenheitToCelsius(Number.parseFloat(temperature))
										: Number.parseFloat(temperature),
								)
									? 'border-red-500'
									: ''
							}
							id="edit-temperature"
							placeholder={
								isImperial
									? fbt(
											'e.g. 99.0',
											'Placeholder text for an input to set the body temperature in degree Fahrenheit',
										)
									: fbt(
											'e.g. 37.2',
											'Placeholder text for an input to set the body temperature in degree Celsius',
										)
							}
							step="0.1"
							type="number"
							{...register('temperature')}
						/>
						{temperature &&
							isAbnormalTemperature(
								isImperial
									? fahrenheitToCelsius(Number.parseFloat(temperature))
									: Number.parseFloat(temperature),
							) && (
								<p className="text-xs text-red-500 mt-1">
									{isImperial ? (
										<fbt desc="A warning that the temperature is outside the normal range (Fahrenheit)">
											Warning: Temperature outside normal range (97.7°F -
											99.5°F)
										</fbt>
									) : (
										<fbt desc="A warning that the temperature is outside the normal range">
											Warning: Temperature outside normal range (36.5°C -
											37.5°C)
										</fbt>
									)}
								</p>
							)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="edit-notes">
							<fbt desc="Label for a textbox to note any notes">Notes</fbt>
						</Label>
						<Textarea
							id="edit-notes"
							placeholder={fbt(
								'e.g. redness, rash, etc.',
								'Placeholder text for a textbox to note any notes',
							)}
							{...register('notes')}
						/>
					</div>
				</div>
			</EntityFormDialog>

			{isAddingProduct && (
				<Dialog
					onOpenChange={(open) => {
						if (!open) {
							setIsAddingProduct(false);
						}
					}}
					open={true}
				>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>
								<fbt desc="Title for the quick-add product dialog">
									Add Product
								</fbt>
							</DialogTitle>
						</DialogHeader>
						<ProductForm
							onCancel={() => setIsAddingProduct(false)}
							onSave={(product) => {
								upsertProduct(product);
								setValue('diaperProductId', product.id, {
									shouldValidate: true,
								});
								setIsAddingProduct(false);
							}}
						/>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
}
