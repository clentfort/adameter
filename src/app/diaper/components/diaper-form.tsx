import type { ReactNode } from 'react';
import type {
	DiaperChange,
	DiaperFormData,
	DiaperFormValues,
} from '@/types/diaper';
import type { MatrixField } from './diaper-contents-matrix';
import { fbt } from 'fbtee';
import { Plus } from 'lucide-react';
import { nanoid } from 'nanoid';
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
import { Textarea } from '@/components/ui/textarea';
import { useAutomaticLocation } from '@/hooks/use-automatic-location';
import { useDiaperChangesSnapshot } from '@/hooks/use-diaper-changes';
import {
	useDiaperProduct,
	useFrecencySortedDiaperProductIds,
	useUpsertDiaperProduct,
} from '@/hooks/use-diaper-products';
import { useEntityForm } from '@/hooks/use-entity-form';
import { useUnitSystem } from '@/hooks/use-unit-system';
import { diaperFormToDataSchema } from '@/types/diaper';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { dateToTimeInputValue } from '@/utils/date-to-time-input-value';
import {
	celsiusToFahrenheit,
	fahrenheitToCelsius,
} from '@/utils/unit-conversions';
import { isAbnormalTemperature } from '../utils/is-abnormal-temperature';
import { DiaperContentsMatrix } from './diaper-contents-matrix';

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
		locationLatitude: change?.locationLatitude?.toString() ?? '',
		locationLongitude: change?.locationLongitude?.toString() ?? '',
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
	const [unitSystem] = useUnitSystem();
	const isImperial = unitSystem === 'imperial';
	const upsertProduct = useUpsertDiaperProduct();
	const changes = useDiaperChangesSnapshot();
	const sortedProductIds = useFrecencySortedDiaperProductIds(changes);

	const [isAddingProduct, setIsAddingProduct] = useState(false);
	const change = 'change' in props ? props.change : undefined;
	const { resolveLocation } = useAutomaticLocation({ enabled: !change });

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

	const handleSave = async (parsedValues: DiaperFormData) => {
		let temperature = parsedValues.temperature;
		if (isImperial && temperature != null) {
			temperature = Math.round(fahrenheitToCelsius(temperature) * 10) / 10;
		}

		const { latitude, longitude } = await resolveLocation(
			parsedValues.locationLatitude ?? change?.locationLatitude,
			parsedValues.locationLongitude ?? change?.locationLongitude,
			parsedValues.timestamp,
		);

		const updatedChange: DiaperChange = {
			...change,
			containsStool: parsedValues.containsStool,
			containsUrine: parsedValues.containsUrine,
			diaperProductId: parsedValues.diaperProductId,
			id: change?.id || nanoid(),
			leakage: parsedValues.leakage,
			locationLatitude: latitude,
			locationLongitude: longitude,
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
					<DiaperContentsMatrix
						containsStool={containsStool}
						containsUrine={containsUrine}
						leakage={hasLeakage}
						onLeakageChange={(checked) => {
							setValue('leakage', checked, { shouldValidate: true });
						}}
						onToggle={(field: MatrixField) => {
							const currentValues = {
								containsStool,
								containsUrine,
								pottyStool,
								pottyUrine,
							};
							setValue(field, !currentValues[field], {
								shouldValidate: true,
							});
						}}
						pottyStool={pottyStool}
						pottyUrine={pottyUrine}
					/>

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
