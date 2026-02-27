'use client';

import { fbt } from 'fbtee';
import { useState } from 'react';
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
	const [name, setName] = useState(initialData?.name || '');
	const [costPerDiaper, setCostPerDiaper] = useState(
		initialData?.costPerDiaper?.toString() || '',
	);
	const [isReusable, setIsReusable] = useState(
		initialData?.isReusable || false,
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name) return;

		onSave({
			...(initialData as DiaperProduct),
			costPerDiaper: costPerDiaper
				? Number.parseFloat(costPerDiaper)
				: undefined,
			id: initialData?.id || crypto.randomUUID(),
			isReusable,
			name,
		});
	};

	return (
		<form className="space-y-4 pt-4" onSubmit={handleSubmit}>
			<div className="space-y-2">
				<Label htmlFor="product-name">
					<fbt desc="Label for product name input">Product Name</fbt>
				</Label>
				<Input
					id="product-name"
					onChange={(e) => setName(e.target.value)}
					placeholder={fbt(
						'e.g. Pampers Size 1',
						'Placeholder for product name',
					)}
					required
					value={name}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="product-cost">
					<fbt desc="Label for cost per diaper input">Cost per Diaper</fbt>
				</Label>
				<Input
					id="product-cost"
					onChange={(e) => setCostPerDiaper(e.target.value)}
					placeholder="0.00"
					step="0.01"
					type="number"
					value={costPerDiaper}
				/>
			</div>

			<div className="flex items-center space-x-2">
				<Switch
					checked={isReusable}
					id="product-reusable"
					onCheckedChange={setIsReusable}
				/>
				<Label htmlFor="product-reusable">
					<fbt desc="Label for reusable diaper switch">Reusable Diaper</fbt>
				</Label>
			</div>

			<div className="flex justify-end gap-2 pt-2">
				<Button onClick={onCancel} type="button" variant="outline">
					<fbt common>Cancel</fbt>
				</Button>
				<Button type="submit">
					<fbt common>Save</fbt>
				</Button>
			</div>
		</form>
	);
}
