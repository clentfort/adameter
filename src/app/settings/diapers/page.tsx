'use client';

import { fbt } from 'fbtee';
import { Archive, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ProductForm from '@/components/product-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCurrency } from '@/hooks/use-currency';
import { useDiaperProducts } from '@/hooks/use-diaper-products';

export default function DiapersSettingsPage() {
	const {
		add: addProduct,
		remove: removeProduct,
		update: updateProduct,
		value: products,
	} = useDiaperProducts();
	const [editingProductId, setEditingProductId] = useState<string | null>(null);
	const [isAddingProduct, setIsAddingProduct] = useState(false);
	const [currency] = useCurrency();

	if (isAddingProduct || editingProductId) {
		const initialData = editingProductId
			? products.find((p) => p.id === editingProductId)
			: {};
		return (
			<Card>
				<CardContent>
					<ProductForm
						initialData={initialData}
						onCancel={() => {
							setIsAddingProduct(false);
							setEditingProductId(null);
						}}
						onSave={(data) => {
							if (editingProductId) {
								updateProduct(data);
							} else {
								addProduct(data);
							}
							setIsAddingProduct(false);
							setEditingProductId(null);
						}}
					/>
				</CardContent>
			</Card>
		);
	}

	const sortedProducts = [...products].sort((a, b) => {
		if (a.archived && !b.archived) return 1;
		if (!a.archived && b.archived) return -1;
		return a.name.localeCompare(b.name);
	});

	return (
		<div className="space-y-4 w-full">
			<Button
				className="w-full h-12 flex items-center gap-2 justify-center"
				onClick={() => setIsAddingProduct(true)}
			>
				<Plus className="h-5 w-5" />
				<fbt desc="Button to add a new diaper product">Add Product</fbt>
			</Button>

			<div className="space-y-2">
				{sortedProducts.map((product) => (
					<div
						className={`flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm ${product.archived ? 'opacity-60' : ''}`}
						key={product.id}
					>
						<div
							className="flex-grow cursor-pointer"
							onClick={() => setEditingProductId(product.id)}
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
											{currency === 'GBP'
												? '£'
												: currency === 'EUR'
													? '€'
													: '$'}
										</fbt:param>
										<fbt:param name="cost">
											{product.costPerDiaper.toFixed(2)}
										</fbt:param>
									</fbt>
								) : (
									<fbt desc="Text showing no cost is set">No cost set</fbt>
								)}
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Button
								onClick={() =>
									updateProduct({ ...product, archived: !product.archived })
								}
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
								onClick={() => removeProduct(product.id)}
								size="icon"
								variant="ghost"
							>
								<Trash2 className="h-4 w-4 text-destructive" />
							</Button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
