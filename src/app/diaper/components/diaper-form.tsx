import type { ReactNode } from 'react';
import type {
	DiaperChange,
	DiaperFormData,
	DiaperFormValues,
} from '@/types/diaper';
import { fbt } from 'fbtee';
import { Plus } from 'lucide-react';
import { useState } from 'react';
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
import { diaperFormToDataSchema } from '@/types/diaper';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { dateToTimeInputValue } from '@/utils/date-to-time-input-value';
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
	const upsertProduct = useUpsertDiaperProduct();
	const changes = useDiaperChangesSnapshot();
	const sortedProductIds = useFrecencySortedDiaperProductIds(changes);

	const [isAddingProduct, setIsAddingProduct] = useState(false);
	const change = 'change' in props ? props.change : undefined;

	const presetDiaperProductId =
		'presetDiaperProductId' in props ? props.presetDiaperProductId : undefined;
	const presetType = 'presetType' in props ? props.presetType : undefined;

	const form = useEntityForm<DiaperFormValues, undefined, DiaperFormData>(
		diaperFormToDataSchema,
		() => getDefaultValues(change, presetDiaperProductId, presetType),
		[change, presetDiaperProductId, presetType],
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
			temperature: parsedValues.temperature,
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

							<div className="text-sm font-medium">
								<fbt desc="Label for the diaper row in the contents matrix">
									Diaper
								</fbt>
							</div>
							<Button
								className={`h-12 w-full transition-all ${
									containsUrine
										? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 shadow-xs ring-2 ring-yellow-600 ring-offset-1'
										: 'bg-background hover:bg-muted text-muted-foreground'
								}`}
								data-testid="toggle-diaper-urine"
								onClick={() => {
									setValue('containsUrine', !containsUrine, {
										shouldValidate: true,
									});
								}}
								type="button"
								variant="outline"
							>
								<span className="text-xl">💧</span>
							</Button>
							<Button
								className={`h-12 w-full transition-all ${
									containsStool
										? 'bg-amber-700 hover:bg-amber-800 text-white shadow-xs ring-2 ring-amber-900 ring-offset-1'
										: 'bg-background hover:bg-muted text-muted-foreground'
								}`}
								data-testid="toggle-diaper-stool"
								onClick={() => {
									setValue('containsStool', !containsStool, {
										shouldValidate: true,
									});
								}}
								type="button"
								variant="outline"
							>
								<span className="text-xl">💩</span>
							</Button>

							<div className="text-sm font-medium">
								<fbt desc="Label for the potty row in the contents matrix">
									Potty
								</fbt>
							</div>
							<Button
								className={`h-12 w-full transition-all ${
									pottyUrine
										? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 shadow-xs ring-2 ring-yellow-600 ring-offset-1'
										: 'bg-background hover:bg-muted text-muted-foreground'
								}`}
								data-testid="toggle-potty-urine"
								onClick={() => {
									setValue('pottyUrine', !pottyUrine, {
										shouldValidate: true,
									});
								}}
								type="button"
								variant="outline"
							>
								<span className="text-xl">💧</span>
							</Button>
							<Button
								className={`h-12 w-full transition-all ${
									pottyStool
										? 'bg-amber-700 hover:bg-amber-800 text-white shadow-xs ring-2 ring-amber-900 ring-offset-1'
										: 'bg-background hover:bg-muted text-muted-foreground'
								}`}
								data-testid="toggle-potty-stool"
								onClick={() => {
									setValue('pottyStool', !pottyStool, {
										shouldValidate: true,
									});
								}}
								type="button"
								variant="outline"
							>
								<span className="text-xl">💩</span>
							</Button>
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
							<div className="flex-grow">
								<Select
									onValueChange={(value) => {
										setValue('diaperProductId', value ?? '', {
											shouldValidate: true,
										});
									}}
									value={diaperProductId}
								>
									<SelectTrigger id="edit-diaper-product">
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
							<fbt desc="Label on an input to specificy the body temperature in degree Celsius">
								Temperature (°C)
							</fbt>
						</Label>
						<Input
							className={
								temperature && isAbnormalTemperature(Number.parseFloat(temperature))
									? 'border-red-500'
									: ''
							}
							id="edit-temperature"
							placeholder={fbt(
								'e.g. 37.2',
								'Placeholder text for an input to set the body temperature in degree Celsius',
							)}
							step="0.1"
							type="number"
							{...register('temperature')}
						/>
						{temperature && isAbnormalTemperature(Number.parseFloat(temperature)) && (
							<p className="text-xs text-red-500 mt-1">
								<fbt desc="A warning that the temperature is outside the normal range">
									Warning: Temperature outside normal range (36.5°C - 37.5°C)
								</fbt>
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
