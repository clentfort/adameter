'use client';

import { diaperProductSchema, type DiaperProductFormValues } from '@/types/diaper';
import { zodResolver } from '@hookform/resolvers/zod';
import { fbt } from 'fbtee';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DiaperProduct } from '@/types/diaper';

interface ProductFormProps {
	initialData?: Partial<DiaperProduct>;
	onCancel: () => void;
	onSave: (data: DiaperProduct) => void;
}

export default function ProductForm({
	initialData,
	onCancel,
	onSave,
}: ProductFormProps) {
	const {
		formState: { isValid },
		handleSubmit,
		register,
		setValue,
		watch,
	} = useForm<DiaperProductFormValues>({
		defaultValues: {
			costPerDiaper: initialData?.costPerDiaper?.toString() || '',
			isReusable: initialData?.isReusable || false,
			name: initialData?.name || '',
		},
		mode: 'onChange',
		resolver: zodResolver(diaperProductSchema),
	});

	const isReusable = watch('isReusable');

	const onSubmit = (values: DiaperProductFormValues) => {
		onSave({
			...(initialData as DiaperProduct),
			costPerDiaper: values.costPerDiaper
				? Number.parseFloat(values.costPerDiaper)
				: undefined,
			id: initialData?.id || crypto.randomUUID(),
			isReusable: values.isReusable,
			name: values.name,
		});
	};

	return (
		<form className="space-y-4 pt-4" onSubmit={handleSubmit(onSubmit)}>
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
					onCheckedChange={(checked) =>
						setValue('isReusable', checked, { shouldValidate: true })
					}
				/>
				<Label htmlFor="product-reusable">
					<fbt desc="Label for reusable diaper switch">Reusable Diaper</fbt>
				</Label>
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
