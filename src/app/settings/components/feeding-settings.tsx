'use client';

import { fbt } from 'fbtee';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCurrency } from '@/hooks/use-currency';
import {
	useFeedingProduct,
	useRemoveFeedingProduct,
	useSortedFeedingProductIds,
	useUpsertFeedingProduct,
} from '@/hooks/use-feeding-products';
import {
	useFormulaProduct,
	useRemoveFormulaProduct,
	useSortedFormulaProductIds,
	useUpsertFormulaProduct,
} from '@/hooks/use-formula-products';
import { useProfile } from '@/hooks/use-profile';
import type { FormulaProduct } from '@/types/feeding-products';
import type { FeedingProduct } from '@/types/feeding-products';

interface FeedingSettingsProps {
	onBack: () => void;
}

export function FeedingSettings({ onBack }: FeedingSettingsProps) {
	const [profile, setProfile] = useProfile();
	const upsertFormulaProduct = useUpsertFormulaProduct();
	const removeFormulaProduct = useRemoveFormulaProduct();
	const formulaProductIds = useSortedFormulaProductIds();

	const upsertFeedingProduct = useUpsertFeedingProduct();
	const removeFeedingProduct = useRemoveFeedingProduct();
	const bottleIds = useSortedFeedingProductIds('bottle');
	const teatIds = useSortedFeedingProductIds('teat');

	const [editingFormulaId, setEditingFormulaId] = useState<string | null>(null);
	const [isAddingFormula, setIsAddingFormula] = useState(false);

	const [editingProductId, setEditingProductId] = useState<string | null>(null);
	const [isAddingProduct, setIsAddingProduct] = useState(false);
	const [productType, setProductType] = useState<'bottle' | 'teat'>('bottle');

	const updateVisibility = (key: string, value: boolean) => {
		setProfile({ ...profile, [key]: value });
	};

	if (isAddingFormula || editingFormulaId) {
		return (
			<FormulaForm
				initialData={editingFormulaId ? formulaProductIds.find(id => id === editingFormulaId) : undefined}
				onCancel={() => {
					setIsAddingFormula(false);
					setEditingFormulaId(null);
				}}
				onSave={(data) => {
					upsertFormulaProduct(data);
					setIsAddingFormula(false);
					setEditingFormulaId(null);
				}}
			/>
		);
	}

	if (isAddingProduct || editingProductId) {
		return (
			<FeedingProductForm
				initialData={editingProductId ? editingProductId : undefined}
				onCancel={() => {
					setIsAddingProduct(false);
					setEditingProductId(null);
				}}
				onSave={(data) => {
					upsertFeedingProduct(data);
					setIsAddingProduct(false);
					setEditingProductId(null);
				}}
				type={productType}
			/>
		);
	}

	return (
		<div className="space-y-6 w-full pb-8">
			<Card>
				<CardHeader>
					<CardTitle>
						<fbt desc="Title for visibility settings">Visibility</fbt>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<Label htmlFor="show-left-breast">
							<fbt desc="Label for left breast visibility">Left Breast</fbt>
						</Label>
						<Switch
							checked={profile?.showLeftBreast ?? true}
							id="show-left-breast"
							onCheckedChange={(v) => updateVisibility('showLeftBreast', v)}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="show-right-breast">
							<fbt desc="Label for right breast visibility">Right Breast</fbt>
						</Label>
						<Switch
							checked={profile?.showRightBreast ?? true}
							id="show-right-breast"
							onCheckedChange={(v) => updateVisibility('showRightBreast', v)}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="show-pumped">
							<fbt desc="Label for pumped milk visibility">Pumped Milk</fbt>
						</Label>
						<Switch
							checked={profile?.showPumpedMilk ?? true}
							id="show-pumped"
							onCheckedChange={(v) => updateVisibility('showPumpedMilk', v)}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="show-formula">
							<fbt desc="Label for formula visibility">Formula</fbt>
						</Label>
						<Switch
							checked={profile?.showFormula ?? true}
							id="show-formula"
							onCheckedChange={(v) => updateVisibility('showFormula', v)}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0">
					<CardTitle>
						<fbt desc="Title for formula products section">Formula Products</fbt>
					</CardTitle>
					<Button onClick={() => setIsAddingFormula(true)} size="sm" variant="outline">
						<Plus className="h-4 w-4 mr-1" />
						<fbt desc="Add formula product button label">Add</fbt>
					</Button>
				</CardHeader>
				<CardContent className="space-y-2">
					{formulaProductIds.map((id) => (
						<FormulaItem
							id={id}
							key={id}
							onDelete={removeFormulaProduct}
							onEdit={setEditingFormulaId}
						/>
					))}
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0">
					<CardTitle>
						<fbt desc="Title for bottles section">Bottles</fbt>
					</CardTitle>
					<Button
						onClick={() => {
							setProductType('bottle');
							setIsAddingProduct(true);
						}}
						size="sm"
						variant="outline"
					>
						<Plus className="h-4 w-4 mr-1" />
						<fbt desc="Add bottle button label">Add</fbt>
					</Button>
				</CardHeader>
				<CardContent className="space-y-2">
					{bottleIds.map((id) => (
						<ProductItem
							id={id}
							key={id}
							onDelete={removeFeedingProduct}
							onEdit={(id) => {
								setProductType('bottle');
								setEditingProductId(id);
							}}
						/>
					))}
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0">
					<CardTitle>
						<fbt desc="Title for teats section">Teats / Tips</fbt>
					</CardTitle>
					<Button
						onClick={() => {
							setProductType('teat');
							setIsAddingProduct(true);
						}}
						size="sm"
						variant="outline"
					>
						<Plus className="h-4 w-4 mr-1" />
						<fbt desc="Add teat button label">Add</fbt>
					</Button>
				</CardHeader>
				<CardContent className="space-y-2">
					{teatIds.map((id) => (
						<ProductItem
							id={id}
							key={id}
							onDelete={removeFeedingProduct}
							onEdit={(id) => {
								setProductType('teat');
								setEditingProductId(id);
							}}
						/>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

function FormulaItem({ id, onDelete, onEdit }: { id: string; onDelete: (id: string) => void; onEdit: (id: string) => void }) {
	const product = useFormulaProduct(id);
	const [currency] = useCurrency();
	if (!product) return null;

	return (
		<div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg border">
			<div className="cursor-pointer flex-grow" onClick={() => onEdit(id)}>
				<p className="font-medium">{product.name}</p>
				<p className="text-xs text-muted-foreground">
					<fbt desc="Cost per ml display">
						Cost per ml:{' '}
						<fbt:param name="currency">
							{currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$'}
						</fbt:param>
						<fbt:param name="cost">
							{(product.costPerMl ?? 0).toFixed(4)}
						</fbt:param>
					</fbt>
				</p>
			</div>
			<Button onClick={() => onDelete(id)} size="icon" variant="ghost">
				<Trash2 className="h-4 w-4 text-destructive" />
			</Button>
		</div>
	);
}

function ProductItem({ id, onDelete, onEdit }: { id: string; onDelete: (id: string) => void; onEdit: (id: string) => void }) {
	const product = useFeedingProduct(id);
	if (!product) return null;

	return (
		<div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg border">
			<div className="cursor-pointer flex-grow" onClick={() => onEdit(id)}>
				<p className="font-medium">{product.name}</p>
			</div>
			<Button onClick={() => onDelete(id)} size="icon" variant="ghost">
				<Trash2 className="h-4 w-4 text-destructive" />
			</Button>
		</div>
	);
}

function FormulaForm({ initialData, onCancel, onSave }: { initialData?: string; onCancel: () => void; onSave: (data: FormulaProduct) => void }) {
	const product = useFormulaProduct(initialData ?? '');
	const [name, setName] = useState(product?.name ?? '');
	const [cost, setCost] = useState(product?.costPerMl?.toString() ?? '');

	return (
		<Card>
			<CardContent className="pt-6 space-y-4">
				<div className="space-y-2">
					<Label htmlFor="formula-name">Name</Label>
					<Input id="formula-name" onChange={(e) => setName(e.target.value)} value={name} />
				</div>
				<div className="space-y-2">
					<Label htmlFor="formula-cost">Cost per ml</Label>
					<Input id="formula-cost" onChange={(e) => setCost(e.target.value)} step="0.0001" type="number" value={cost} />
				</div>
				<div className="flex justify-end gap-2">
					<Button onClick={onCancel} variant="outline">Cancel</Button>
					<Button
						disabled={!name}
						onClick={() => onSave({
							costPerMl: Number.parseFloat(cost) || 0,
							id: product?.id ?? crypto.randomUUID(),
							name,
						})}
					>
						Save
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function FeedingProductForm({ initialData, onCancel, onSave, type }: { initialData?: string; onCancel: () => void; onSave: (data: FeedingProduct) => void; type: 'bottle' | 'teat' }) {
	const product = useFeedingProduct(initialData ?? '');
	const [name, setName] = useState(product?.name ?? '');

	return (
		<Card>
			<CardContent className="pt-6 space-y-4">
				<div className="space-y-2">
					<Label htmlFor="product-name">Name</Label>
					<Input id="product-name" onChange={(e) => setName(e.target.value)} value={name} />
				</div>
				<div className="flex justify-end gap-2">
					<Button onClick={onCancel} variant="outline">Cancel</Button>
					<Button
						disabled={!name}
						onClick={() => onSave({
							id: product?.id ?? crypto.randomUUID(),
							name,
							type,
						})}
					>
						Save
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
