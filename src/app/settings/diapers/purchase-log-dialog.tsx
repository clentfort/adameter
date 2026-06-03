'use client';

import type { DiaperPurchase, DiaperPurchaseFormValues } from '@/types/diaper';
import { zodResolver } from '@hookform/resolvers/zod';
import { fbt } from 'fbtee';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { diaperPurchaseFormSchema } from '@/types/diaper';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';

interface PurchaseLogDialogProps {
	diaperProductId: string;
	onClose: () => void;
	onSave: (purchase: DiaperPurchase) => void;
	productName: string;
}

export default function PurchaseLogDialog({
	diaperProductId,
	onClose,
	onSave,
	productName,
}: PurchaseLogDialogProps) {
	const {
		formState: { isValid },
		handleSubmit,
		register,
	} = useForm<DiaperPurchaseFormValues>({
		defaultValues: {
			count: '',
			date: dateToDateInputValue(new Date()),
			price: '',
		},
		mode: 'onChange',
		resolver: zodResolver(diaperPurchaseFormSchema),
	});

	const handleSave = (values: DiaperPurchaseFormValues) => {
		onSave({
			count: Number.parseInt(values.count, 10),
			date: values.date,
			diaperProductId,
			id: crypto.randomUUID(),
			price: Number.parseFloat(values.price),
		});
	};

	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={true}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						<fbt desc="Title for logging a diaper purchase">
							Log Purchase for <fbt:param name="productName">{productName}</fbt:param>
						</fbt>
					</DialogTitle>
				</DialogHeader>
				<form className="space-y-4 py-4" onSubmit={handleSubmit(handleSave)}>
					<div className="space-y-2">
						<Label htmlFor="purchase-date">
							<fbt desc="Label for purchase date input">Date</fbt>
						</Label>
						<Input
							id="purchase-date"
							required
							type="date"
							{...register('date')}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="purchase-count">
							<fbt desc="Label for number of diapers in pack">Diaper Count</fbt>
						</Label>
						<Input
							id="purchase-count"
							min="1"
							placeholder="e.g. 50"
							required
							type="number"
							{...register('count')}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="purchase-price">
							<fbt desc="Label for total price of pack">Total Price</fbt>
						</Label>
						<Input
							id="purchase-price"
							min="0"
							placeholder="0.00"
							required
							step="0.01"
							type="number"
							{...register('price')}
						/>
					</div>
					<DialogFooter>
						<Button onClick={onClose} type="button" variant="outline">
							<fbt common>Cancel</fbt>
						</Button>
						<Button disabled={!isValid} type="submit">
							<fbt desc="Button to save diaper purchase">Log Purchase</fbt>
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
