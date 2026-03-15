'use client';

import type {
	DiaperProduct,
	DiaperProductFormData,
	DiaperProductFormValues,
} from '@/types/diaper';
import { zodResolver } from '@hookform/resolvers/zod';
import { fbt } from 'fbtee';
import { ScanBarcode } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { BarcodeScanner } from '@/components/barcode-scanner';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { lookupProductByBarcode } from '@/lib/barcode-api';
import { diaperProductFormToDataSchema } from '@/types/diaper';

interface ProductFormProps {
	initialData?: Partial<DiaperProduct>;
	onCancel: () => void;
	onSave: (data: DiaperProduct) => void;
}

function getDefaultValues(
	initialData: Partial<DiaperProduct> | undefined,
): DiaperProductFormValues {
	return {
		barcode: initialData?.barcode ?? '',
		costPerDiaper: initialData?.costPerDiaper?.toString() ?? '',
		isReusable: initialData?.isReusable ?? false,
		name: initialData?.name ?? '',
		notes: initialData?.notes ?? '',
		upfrontCost: initialData?.upfrontCost?.toString() ?? '',
	};
}

export default function ProductForm({
	initialData,
	onCancel,
	onSave,
}: ProductFormProps) {
	const [isScanning, setIsScanning] = useState(false);
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
		onSave({
			...(initialData as DiaperProduct),
			barcode: parsedValues.barcode,
			costPerDiaper: parsedValues.costPerDiaper,
			id: initialData?.id ?? crypto.randomUUID(),
			isReusable: parsedValues.isReusable,
			name: parsedValues.name,
			notes: parsedValues.notes,
			upfrontCost: parsedValues.upfrontCost,
		});
	};

	const handleBarcodeScan = async (barcode: string) => {
		setIsScanning(false);
		setValue('barcode', barcode, { shouldDirty: true, shouldValidate: true });

		const productInfo = await lookupProductByBarcode(barcode);
		if (productInfo?.name) {
			setValue('name', productInfo.name, {
				shouldDirty: true,
				shouldValidate: true,
			});
			toast.success(
				fbt(
					'Product name found: ' + fbt.param('name', productInfo.name),
					'Toast message when product name is found via barcode',
				),
			);
		}
	};

	return (
		<form className="space-y-4 pt-4" onSubmit={handleSubmit(handleSave)}>
			<div className="space-y-2">
				<Label htmlFor="product-barcode">
					<fbt desc="Label for product barcode input">Barcode</fbt>
				</Label>
				<div className="flex gap-2">
					<Input
						id="product-barcode"
						placeholder={fbt(
							'Scan or enter barcode',
							'Placeholder for barcode input',
						)}
						{...register('barcode')}
					/>
					<Button
						onClick={() => setIsScanning(true)}
						size="icon"
						type="button"
						variant="outline"
					>
						<ScanBarcode className="h-4 w-4" />
					</Button>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="product-name">
					<fbt desc="Label for product name input">Product Name</fbt>
				</Label>
				<Input
					id="product-name"
					placeholder={fbt(
						'e.g. Pampers Size 1',
						'Placeholder for product name',
					)}
					required
					{...register('name')}
				/>
			</div>

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

			<Dialog onOpenChange={setIsScanning} open={isScanning}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							<fbt desc="Title for barcode scanner dialog">Scan Barcode</fbt>
						</DialogTitle>
					</DialogHeader>
					<BarcodeScanner onScan={handleBarcodeScan} />
				</DialogContent>
			</Dialog>
		</form>
	);
}
