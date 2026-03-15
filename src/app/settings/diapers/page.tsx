'use client';

import type { DiaperProduct } from '@/types/diaper';
import { fbt } from 'fbtee';
import { Archive, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ProductForm from '@/components/product-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Currency, useCurrency } from '@/hooks/use-currency';
import {
	useDiaperProduct,
	useRemoveDiaperProduct,
	useSortedDiaperProductIds,
	useUpsertDiaperProduct,
} from '@/hooks/use-diaper-products';
import { SettingsHeader } from '../components/settings-header';

interface DiaperProductListItemProps {
	currency: Currency;
	onDelete: (productId: string) => void;
	onEdit: (productId: string) => void;
	onToggleArchived: (product: DiaperProduct) => void;
	productId: string;
}

function DiaperProductListItem({
	currency,
	onDelete,
	onEdit,
	onToggleArchived,
	productId,
}: DiaperProductListItemProps) {
	const product = useDiaperProduct(productId);

	if (!product) {
		return null;
	}

	return (
		<div
			className={`flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm ${product.archived ? 'opacity-60' : ''}`}
		>
			<div
				className="flex-grow cursor-pointer"
				onClick={() => onEdit(product.id)}
			>
				<div className="flex items-center gap-2">
					<p className="font-medium">{product.name}</p>
					{product.isReusable && (
						<span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">
							<fbt desc="Badge for reusable diapers">Reusable</fbt>
						</span>
					)}
				</div>
				<p className="text-xs text-muted-foreground">
					{product.costPerDiaper !== undefined ? (
						<fbt desc="Cost per diaper display">
							Cost per item:{' '}
							<fbt:param name="currency">
								{currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$'}
							</fbt:param>
							<fbt:param name="cost">
								{product.costPerDiaper.toFixed(2)}
							</fbt:param>
						</fbt>
					) : (
						<fbt desc="Text showing no cost is set">No cost set</fbt>
					)}
				</p>
				{product.isReusable && (
					<p className="text-xs text-muted-foreground">
						{typeof product.upfrontCost === 'number' ? (
							<fbt desc="Reusable diaper upfront cost display">
								Upfront cost:{' '}
								<fbt:param name="currency">
									{currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$'}
								</fbt:param>
								<fbt:param name="upfrontCost">
									{product.upfrontCost.toFixed(2)}
								</fbt:param>
							</fbt>
						) : (
							<fbt desc="Text showing no upfront cost is set for reusable diapers">
								No upfront cost set
							</fbt>
						)}
					</p>
				)}
			</div>
			<div className="flex items-center gap-2">
				<Button
					onClick={() => onToggleArchived(product)}
					size="icon"
					variant="ghost"
				>
					{product.archived ? (
						<Plus className="h-4 w-4" />
					) : (
						<Archive className="h-4 w-4 text-muted-foreground" />
					)}
				</Button>
				<Button
					onClick={() => onDelete(product.id)}
					size="icon"
					variant="ghost"
				>
					<Trash2 className="h-4 w-4 text-destructive" />
				</Button>
			</div>
		</div>
	);
}

export default function DiapersSettingsPage() {
	const [currency] = useCurrency();
	const upsertProduct = useUpsertDiaperProduct();
	const removeProduct = useRemoveDiaperProduct();
	const productIds = useSortedDiaperProductIds();
	const [editingProductId, setEditingProductId] = useState<string | null>(null);
	const [isAddingProduct, setIsAddingProduct] = useState(false);
	const editingProduct = useDiaperProduct(editingProductId ?? undefined);

	const handleBack = () => {
		if (isAddingProduct || editingProductId) {
			setIsAddingProduct(false);
			setEditingProductId(null);
		} else {
			window.history.back();
		}
	};

	const getTitle = () => {
		if (isAddingProduct)
			return fbt('Add Product', 'Title for adding a product');
		if (editingProductId)
			return fbt('Edit Product', 'Title for editing a product');
		return fbt('Diaper Products', 'Title for diaper products section');
	};

	return (
		<>
			<SettingsHeader
				onBack={isAddingProduct || editingProductId ? handleBack : undefined}
				title={getTitle()}
			/>

			{isAddingProduct || editingProductId ? (
				<Card className="w-full">
					<CardContent>
						<ProductForm
							initialData={editingProduct ?? {}}
							onCancel={() => {
								setIsAddingProduct(false);
								setEditingProductId(null);
							}}
							onSave={(data) => {
								upsertProduct(data);
								setIsAddingProduct(false);
								setEditingProductId(null);
							}}
						/>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-4 w-full">
					<Button
						className="w-full h-12 flex items-center gap-2 justify-center"
						onClick={() => setIsAddingProduct(true)}
					>
						<Plus className="h-5 w-5" />
						<fbt desc="Button to add a new diaper product">Add Product</fbt>
					</Button>

					<div className="space-y-2">
						{productIds.map((productId) => (
							<DiaperProductListItem
								currency={currency}
								key={productId}
								onDelete={removeProduct}
								onEdit={setEditingProductId}
								onToggleArchived={(product) => {
									upsertProduct({
										...product,
										archived: !product.archived,
									});
								}}
								productId={productId}
							/>
						))}
					</div>
				</div>
			)}
		</>
	);
}
