'use client';

import { fbt } from 'fbtee';
import {
	Archive,
	ArrowLeft,
	ChevronRight,
	Coins,
	Globe,
	Moon,
	Package,
	Plus,
	Share2,
	Trash2,
	User,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useContext, useState } from 'react';
import ProfileForm from '@/components/profile-form';
import { DataSharingContent } from '@/components/root-layout/data-sharing-switcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import ProductForm from '@/components/product-form';
import { useCurrency } from '@/hooks/use-currency';
import { useDiaperProducts } from '@/hooks/use-diaper-products';
import { useLanguage } from '@/contexts/i18n-context';
import { useProfile } from '@/hooks/use-profile';
import { Locale } from '@/i18n';

export default function SettingsPage() {
	const [profile, setProfile] = useProfile();
	const { setTheme, theme } = useTheme();
	const { locale, setLocale } = useLanguage();
	const [currency, setCurrency] = useCurrency();
	const { room } = useContext(DataSynchronizationContext);
	const router = useRouter();

	const [activeSection, setActiveSection] = useState<
		'main' | 'profile' | 'sharing' | 'appearance' | 'diapers'
	>('main');

	const updateLocale = async (code: Locale) => {
		await setLocale(code);
	};

	const renderMain = () => (
		<div className="space-y-4 w-full pb-8">
			<button
				className="w-full flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm hover:bg-accent transition-colors"
				data-testid="settings-profile"
				onClick={() => setActiveSection('profile')}
			>
				<div className="flex items-center gap-3">
					<div
						className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${profile?.color || 'bg-primary'}`}
					>
						{profile?.name ? (
							profile.name[0].toUpperCase()
						) : (
							<User className="h-5 w-5" />
						)}
					</div>
					<div className="text-left">
						<p className="font-medium">
							{profile?.name ||
								fbt('Child Profile', 'Label for child profile settings')}
						</p>
						<p className="text-sm text-muted-foreground">
							{fbt(
								'Edit name, birthday, and more',
								'Subtext for profile settings',
							)}
						</p>
					</div>
				</div>
				<ChevronRight className="h-5 w-5 text-muted-foreground" />
			</button>

			<button
				className="w-full flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm hover:bg-accent transition-colors"
				data-testid="settings-appearance"
				onClick={() => setActiveSection('appearance')}
			>
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
						<Globe className="h-5 w-5" />
					</div>
					<div className="text-left">
						<p className="font-medium">
							<fbt desc="Label for appearance settings">Appearance</fbt>
						</p>
						<p className="text-sm text-muted-foreground">
							{fbt('Language and Theme', 'Subtext for appearance settings')}
						</p>
					</div>
				</div>
				<ChevronRight className="h-5 w-5 text-muted-foreground" />
			</button>

			<button
				className="w-full flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm hover:bg-accent transition-colors"
				data-testid="settings-sharing"
				onClick={() => setActiveSection('sharing')}
			>
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-300">
						<Share2 className="h-5 w-5" />
					</div>
					<div className="text-left">
						<p className="font-medium">
							<fbt desc="Label for sharing settings">Sharing</fbt>
						</p>
						<p className="text-sm text-muted-foreground">
							{room ? (
								<fbt desc="Text showing current room">
									Connected to: <fbt:param name="room">{room}</fbt:param>
								</fbt>
							) : (
								<fbt desc="Text showing no room is connected">Not syncing</fbt>
							)}
						</p>
					</div>
				</div>
				<ChevronRight className="h-5 w-5 text-muted-foreground" />
			</button>

			<button
				className="w-full flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm hover:bg-accent transition-colors"
				data-testid="settings-diapers"
				onClick={() => setActiveSection('diapers')}
			>
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-300">
						<Package className="h-5 w-5" />
					</div>
					<div className="text-left">
						<p className="font-medium">
							<fbt desc="Label for diaper products settings">
								Diaper Products
							</fbt>
						</p>
						<p className="text-sm text-muted-foreground">
							<fbt desc="Subtext for diaper products settings">
								Manage brands, sizes and costs
							</fbt>
						</p>
					</div>
				</div>
				<ChevronRight className="h-5 w-5 text-muted-foreground" />
			</button>
		</div>
	);

	const renderProfile = () => (
		<div className="space-y-4 w-full">
			<Card>
				<CardContent>
					<ProfileForm
						initialData={profile}
						onSave={(data) => {
							setProfile({ ...data, optedOut: false });
							setActiveSection('main');
						}}
					/>
				</CardContent>
			</Card>
		</div>
	);

	const renderAppearance = () => (
		<div className="space-y-4 w-full">
			<Card>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Globe className="h-4 w-4" />
							<p className="text-sm font-medium">
								<fbt desc="Label for language setting">Language</fbt>
							</p>
						</div>
						<Select
							onValueChange={(v) => updateLocale(v as Locale)}
							value={locale}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="de_DE">🇩🇪 German</SelectItem>
								<SelectItem value="en_US">🇺🇸 English</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Moon className="h-4 w-4" />
							<p className="text-sm font-medium">
								<fbt desc="Label for theme setting">Theme</fbt>
							</p>
						</div>
						<Select onValueChange={(v) => setTheme(v)} value={theme}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="light">
									<fbt desc="Light theme option">Light</fbt>
								</SelectItem>
								<SelectItem value="dark">
									<fbt desc="Dark theme option">Dark</fbt>
								</SelectItem>
								<SelectItem value="system">
									<fbt desc="System theme option">System</fbt>
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Coins className="h-4 w-4" />
							<p className="text-sm font-medium">
								<fbt desc="Label for currency setting">Currency</fbt>
							</p>
						</div>
						<Select
							onValueChange={(v) => setCurrency(v as any)}
							value={currency}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="GBP">£ GBP</SelectItem>
								<SelectItem value="EUR">€ EUR</SelectItem>
								<SelectItem value="USD">$ USD</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>
		</div>
	);

	const {
		add: addProduct,
		remove: removeProduct,
		update: updateProduct,
		value: products,
	} = useDiaperProducts();
	const [editingProductId, setEditingProductId] = useState<string | null>(null);
	const [isAddingProduct, setIsAddingProduct] = useState(false);

	const renderDiapers = () => {
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
	};

	const renderSharing = () => (
		<div className="space-y-4 w-full">
			<Card>
				<CardContent>
					<div className="flex flex-col gap-4">
						<p className="text-sm text-muted-foreground">
							<fbt desc="Description of sharing feature">
								Synchronize your data across multiple devices by joining a
								shared room.
							</fbt>
						</p>
						<DataSharingContent />
					</div>
				</CardContent>
			</Card>
		</div>
	);

	const getTitle = () => {
		switch (activeSection) {
			case 'profile':
				return fbt('Child Profile', 'Title for profile settings section');
			case 'appearance':
				return fbt('Appearance', 'Title for appearance settings section');
			case 'sharing':
				return fbt('Sharing', 'Title for sharing settings section');
			case 'diapers':
				if (isAddingProduct)
					return fbt('Add Product', 'Title for adding a product');
				if (editingProductId)
					return fbt('Edit Product', 'Title for editing a product');
				return fbt('Diaper Products', 'Title for diaper products section');
			default:
				return fbt('Settings', 'Title for settings page');
		}
	};

	return (
		<div className="flex flex-col items-center w-full max-w-md mx-auto">
			<div className="w-full flex justify-between items-center mb-6">
				<Button
					data-testid="back-button"
					onClick={() => {
						if (activeSection === 'main') {
							router.push('/');
						} else {
							setActiveSection('main');
						}
					}}
					size="icon"
					variant="outline"
				>
					<ArrowLeft className="h-4 w-4" />
					<span className="sr-only">Back</span>
				</Button>
				<h1 className="text-2xl font-bold">{getTitle()}</h1>
				<div className="w-10" /> {/* Spacer */}
			</div>

			{activeSection === 'main' && renderMain()}
			{activeSection === 'profile' && renderProfile()}
			{activeSection === 'appearance' && renderAppearance()}
			{activeSection === 'sharing' && renderSharing()}
			{activeSection === 'diapers' && renderDiapers()}
		</div>
	);
}
