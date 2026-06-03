'use client';

import type {
	DiaperProduct,
	DiaperProductFormData,
	DiaperProductFormValues,
	DiaperPurchase,
} from '@/types/diaper';
import { zodResolver } from '@hookform/resolvers/zod';
import { fbt } from 'fbtee';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { DIAPER_BRANDS } from '@/app/diaper/utils/diaper-brands';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PRODUCT_COLORS } from '@/constants/colors';
import { diaperProductFormToDataSchema } from '@/types/diaper';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';

interface ProductFormProps {
	initialData?: Partial<DiaperProduct>;
	onCancel: () => void;
	onSave: (data: DiaperProduct, purchase?: DiaperPurchase) => void;
	showPurchaseFields?: boolean;
}

function getDefaultValues(
	initialData: Partial<DiaperProduct> | undefined,
): DiaperProductFormValues {
	return {
		color: initialData?.color ?? '',
		costPerDiaper: initialData?.costPerDiaper?.toString() ?? '',
		isReusable: initialData?.isReusable ?? false,
		name: initialData?.name ?? '',
		notes: initialData?.notes ?? '',
		purchaseCount: '',
		purchaseDate: dateToDateInputValue(new Date()),
		purchasePrice: '',
		upfrontCost: initialData?.upfrontCost?.toString() ?? '',
	};
}

export default function ProductForm({
	initialData,
	onCancel,
	onSave,
	showPurchaseFields,
}: ProductFormProps) {
	const {
		formState: { isValid },
		handleSubmit,
		register,
		reset,
		setValue,
		watch,
	} = useForm<DiaperProductFormValues, undefined, DiaperProductFormData>({
		defaultValues: getDefaultValues(initialData),
		mode: 'onChange',
		resolver: zodResolver(diaperProductFormToDataSchema),
	});

	const isReusable = watch('isReusable');

	useEffect(() => {
		reset(getDefaultValues(initialData));
	}, [initialData, reset]);

	const handleSave = (parsedValues: DiaperProductFormData) => {
		const productId = initialData?.id ?? crypto.randomUUID();
		const product: DiaperProduct = {
			...(initialData as DiaperProduct),
			color:
				parsedValues.color ||
				PRODUCT_COLORS[Math.floor(Math.random() * PRODUCT_COLORS.length)],
			costPerDiaper: parsedValues.costPerDiaper,
			id: productId,
			isReusable: parsedValues.isReusable,
			name: parsedValues.name,
			notes: parsedValues.notes,
			upfrontCost: parsedValues.upfrontCost,
		};

		let purchase: DiaperPurchase | undefined;
		if (
			!parsedValues.isReusable &&
			parsedValues.purchaseCount &&
			parsedValues.purchasePrice
		) {
			purchase = {
				count: Number.parseInt(parsedValues.purchaseCount, 10),
				date: parsedValues.purchaseDate || dateToDateInputValue(new Date()),
				diaperProductId: productId,
				id: crypto.randomUUID(),
				price: Number.parseFloat(parsedValues.purchasePrice),
			};
		}

		onSave(product, purchase);
	};

	return (
		<form className="space-y-4 pt-4" onSubmit={handleSubmit(handleSave)}>
			<div className="space-y-2">
				<Label htmlFor="product-name">
					<fbt desc="Label for product name input">Product Name</fbt>
				</Label>
				<Input
					id="product-name"
					list="diaper-brands"
					placeholder={fbt(
						'e.g. Pampers Size 1',
						'Placeholder for product name',
					)}
					required
					{...register('name')}
				/>
				<datalist id="diaper-brands">
					{DIAPER_BRANDS.map((brand) => (
						<option key={brand.value} value={brand.label} />
					))}
				</datalist>
			</div>

			{!isReusable && showPurchaseFields && (
				<div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-primary/5 border-primary/20">
					<div className="col-span-2 text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-tight">
						<fbt desc="Header for logging a purchase within product form">
							Log Purchase
						</fbt>
					</div>
					<div className="space-y-2">
						<Label htmlFor="purchase-count">
							<fbt desc="Label for purchase count in product form">Count</fbt>
						</Label>
						<Input
							id="purchase-count"
							placeholder="e.g. 50"
							type="number"
							{...register('purchaseCount')}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="purchase-price">
							<fbt desc="Label for purchase price in product form">Price</fbt>
						</Label>
						<Input
							id="purchase-price"
							placeholder="0.00"
							step="0.01"
							type="number"
							{...register('purchasePrice')}
						/>
					</div>
					<div className="col-span-2 space-y-2">
						<Label htmlFor="purchase-date">
							<fbt desc="Label for purchase date in product form">Date</fbt>
						</Label>
						<Input
							id="purchase-date"
							type="date"
							{...register('purchaseDate')}
						/>
					</div>
				</div>
			)}

			{isReusable && (
				<div className="space-y-2">
					<Label htmlFor="product-cost">
						<fbt desc="Label for cost per diaper input">Cost per Diaper</fbt>
					</Label>
					<Input
						id="product-cost"
						placeholder="0.00"
						step="0.01"
						type="number"
						{...register('costPerDiaper')}
					/>
				</div>
			)}

			{!isReusable && initialData?.costPerDiaper !== undefined && (
				<div className="p-3 bg-muted/30 rounded-lg border flex justify-between items-center">
					<span className="text-sm text-muted-foreground font-medium">
						<fbt desc="Label for current calculated cost per diaper">
							Current Avg. Cost
						</fbt>
					</span>
					<span className="font-bold text-sm">
						<fbt desc="Calculated cost display">
							$<fbt:param name="cost">
								{initialData.costPerDiaper.toFixed(2)}
							</fbt:param>
						</fbt>
					</span>
				</div>
			)}

			<div className="flex items-center space-x-2">
				<Switch
					checked={isReusable}
					id="product-reusable"
					onCheckedChange={(checked) => {
						setValue('isReusable', checked, {
							shouldDirty: true,
							shouldValidate: true,
						});
						if (!checked) {
							setValue('upfrontCost', '', { shouldValidate: true });
						}
					}}
				/>
				<Label htmlFor="product-reusable">
					<fbt desc="Label for reusable diaper switch">Reusable Diaper</fbt>
				</Label>
			</div>

			{isReusable && (
				<div className="space-y-2">
					<Label htmlFor="product-upfront-cost">
						<fbt desc="Label for reusable diaper upfront cost input">
							Upfront Cost
						</fbt>
					</Label>
					<Input
						id="product-upfront-cost"
						min="0"
						placeholder="0.00"
						step="0.01"
						type="number"
						{...register('upfrontCost')}
					/>
				</div>
			)}

			<div className="space-y-2">
				<Label htmlFor="product-notes">
					<fbt desc="Label for notes input">Notes (optional)</fbt>
				</Label>
				<Textarea
					id="product-notes"
					placeholder={fbt(
						'e.g. skin compatibility, fit, etc.',
						'Placeholder for product notes',
					)}
					rows={3}
					{...register('notes')}
				/>
			</div>

			<div className="flex justify-end gap-2 pt-2">
				<Button onClick={onCancel} type="button" variant="outline">
					<fbt common>Cancel</fbt>
				</Button>
				<Button disabled={!isValid} type="submit">
					<fbt common>Save</fbt>
				</Button>
			</div>
		</form>
	);
}
