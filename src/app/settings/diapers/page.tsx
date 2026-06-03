'use client';

import type { DiaperProduct, DiaperPurchase } from '@/types/diaper';
import { fbt } from 'fbtee';
import { Archive, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import ProductForm from '@/components/product-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Currency, useCurrency } from '@/hooks/use-currency';
import { useDiaperChangesSnapshot } from '@/hooks/use-diaper-changes';
import {
	useDiaperProduct,
	useRemoveDiaperProduct,
	useSortedDiaperProductIds,
	useUpsertDiaperProduct,
} from '@/hooks/use-diaper-products';
import {
	useDiaperPurchasesSnapshot,
	useUpsertDiaperPurchase,
} from '@/hooks/use-diaper-purchases';
import { SettingsHeader } from '../components/settings-header';

interface DiaperProductListItemProps {
	currency: Currency;
	estimatedStock?: number;
	onDelete: (productId: string) => void;
	onEdit: (productId: string) => void;
	onLogPurchase: (productId: string) => void;
	onToggleArchived: (product: DiaperProduct) => void;
	productId: string;
}

function DiaperProductListItem({
	currency,
	estimatedStock,
	onDelete,
	onEdit,
	onLogPurchase,
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
					{estimatedStock !== undefined && !product.isReusable && (
						<span className="ml-2">
							•{' '}
							<fbt desc="Estimated stock display">
								Stock:{' '}
								<fbt:param name="stock">
									{Math.max(0, estimatedStock)}
								</fbt:param>
							</fbt>
						</span>
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
				{!product.isReusable && (
					<Button
						onClick={(e) => {
							e.stopPropagation();
							onLogPurchase(product.id);
						}}
						size="icon"
						variant="ghost"
					>
						<ShoppingCart className="h-4 w-4" />
					</Button>
				)}
				<Button
					onClick={(e) => {
						e.stopPropagation();
						onToggleArchived(product);
					}}
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
					onClick={(e) => {
						e.stopPropagation();
						onDelete(product.id);
					}}
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
	const diaperChanges = useDiaperChangesSnapshot();
	const purchases = useDiaperPurchasesSnapshot();
	const upsertPurchase = useUpsertDiaperPurchase();

	const [editingProductId, setEditingProductId] = useState<string | null>(null);
	const [isAddingProduct, setIsAddingProduct] = useState(false);
	const [purchaseLogProductId, setPurchaseLogProductId] = useState<
		string | null
	>(null);

	const editingProduct = useDiaperProduct(editingProductId ?? undefined);
	const purchaseLogProduct = useDiaperProduct(
		purchaseLogProductId ?? undefined,
	);

	const estimatedStockByProduct = useMemo(() => {
		const stock: Record<string, number> = {};

		purchases.forEach((p) => {
			stock[p.diaperProductId] = (stock[p.diaperProductId] || 0) + p.count;
		});

		diaperChanges.forEach((c) => {
			if (c.diaperProductId) {
				stock[c.diaperProductId] = (stock[c.diaperProductId] || 0) - 1;
			}
		});

		return stock;
	}, [purchases, diaperChanges]);

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

	const handleSaveProduct = (product: DiaperProduct, purchase?: DiaperPurchase) => {
		let finalProduct = product;

		if (purchase) {
			const currentStock = Math.max(
				0,
				estimatedStockByProduct[product.id] || 0,
			);
			const oldAvg = product.costPerDiaper || 0;
			const newAvg =
				(currentStock * oldAvg + purchase.price) /
				(currentStock + purchase.count);

			finalProduct = {
				...product,
				costPerDiaper: Number.isFinite(newAvg)
					? Math.round(newAvg * 100) / 100
					: purchase.price / purchase.count,
			};
			upsertPurchase(purchase);
		}

		upsertProduct(finalProduct);
		setIsAddingProduct(false);
		setEditingProductId(null);
		setPurchaseLogProductId(null);
	};

	return (
		<>
			<SettingsHeader
				onBack={isAddingProduct || editingProductId ? handleBack : undefined}
				title={getTitle()}
			/>

			{isAddingProduct || editingProductId || purchaseLogProductId ? (
				<Card className="w-full">
					<CardContent>
						<ProductForm
							initialData={editingProduct ?? purchaseLogProduct ?? {}}
							onCancel={() => {
								setIsAddingProduct(false);
								setEditingProductId(null);
								setPurchaseLogProductId(null);
							}}
							onSave={handleSaveProduct}
							showPurchaseFields={!!(isAddingProduct || purchaseLogProductId)}
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
								estimatedStock={estimatedStockByProduct[productId]}
								key={productId}
								onDelete={removeProduct}
								onEdit={setEditingProductId}
								onLogPurchase={setPurchaseLogProductId}
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
