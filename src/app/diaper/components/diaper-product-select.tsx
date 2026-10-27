import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import ProductForm from '@/components/product-form';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	useDiaperProduct,
	useFrecencySortedDiaperProductIds,
	useUpsertDiaperProduct,
} from '@/hooks/use-diaper-products';

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

export interface DiaperProductSelectProps {
	currentProductId?: string;
	onChange: (id: string) => void;
	value: string;
}

export function DiaperProductSelect({
	currentProductId,
	onChange,
	value,
}: DiaperProductSelectProps): ReactNode {
	const [isAddingProduct, setIsAddingProduct] = useState(false);
	const upsertProduct = useUpsertDiaperProduct();
	const sortedProductIds = useFrecencySortedDiaperProductIds();
	const selectedProduct = useDiaperProduct(
		value.length > 0 ? value : undefined,
	);

	return (
		<>
			<div className="space-y-2">
				<Label htmlFor="edit-diaper-product">
					<fbt desc="Label on a select that allows the user to pick a diaper product">
						Product
					</fbt>
				</Label>
				<div className="flex gap-2">
					<div className="flex-1 min-w-0">
						<Select
							onValueChange={(newValue) => {
								onChange(newValue ?? '');
							}}
							value={value}
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
										currentProductId={currentProductId}
										key={productId}
										productId={productId}
										selectedProductId={value}
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
								onChange(product.id);
								setIsAddingProduct(false);
							}}
						/>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
}
