'use client';

import { fbt } from 'fbtee';
import {
	Archive,
	ArrowLeft,
	ChevronRight,
	Coins,
	Database,
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
import ProductForm from '@/components/product-form';
import ProfileForm from '@/components/profile-form';
import { DataSharingContent } from '@/components/root-layout/data-sharing-switcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import { useLanguage } from '@/contexts/i18n-context';
import { Currency, useCurrency } from '@/hooks/use-currency';
import { useDiaperChanges } from '@/hooks/use-diaper-changes';
import { useDiaperProducts } from '@/hooks/use-diaper-products';
import { useEvents } from '@/hooks/use-events';
import { useFeedingSessions } from '@/hooks/use-feeding-sessions';
import { useGrowthMeasurements } from '@/hooks/use-growth-measurements';
import { useProfile } from '@/hooks/use-profile';
import { useTeething } from '@/hooks/use-teething';
import { Locale } from '@/i18n';
import { fromCsv, mergeData, toCsv } from '../data/utils/csv';
import { createZip, downloadZip, extractFiles } from '../data/utils/zip';

export default function SettingsPage() {
	const [profile, setProfile] = useProfile();
	const { setTheme, theme } = useTheme();
	const { locale, setLocale } = useLanguage();
	const [currency, setCurrency] = useCurrency();
	const { room } = useContext(DataSynchronizationContext);
	const router = useRouter();
	const { toast } = useToast();

	const [activeSection, setActiveSection] = useState<
		'main' | 'profile' | 'sharing' | 'appearance' | 'diapers' | 'data'
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

			<button
				className="w-full flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm hover:bg-accent transition-colors"
				data-testid="settings-data"
				onClick={() => setActiveSection('data')}
			>
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300">
						<Database className="h-5 w-5" />
					</div>
					<div className="text-left">
						<p className="font-medium">
							<fbt desc="Label for data settings">Data Management</fbt>
						</p>
						<p className="text-sm text-muted-foreground">
							<fbt desc="Subtext for data settings">Import and export data</fbt>
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

	const diaperChangesState = useDiaperChanges();
	const eventsState = useEvents();
	const feedingSessionsState = useFeedingSessions();
	const growthMeasurementsState = useGrowthMeasurements();
	const teethingState = useTeething();

	const [isProcessing, setIsProcessing] = useState(false);

	const handleExport = async () => {
		setIsProcessing(true);
		try {
			const dataStores = {
				diaperChanges: diaperChangesState.value,
				diaperProducts: products,
				events: eventsState.value,
				feedingSessions: feedingSessionsState.value,
				growthMeasurements: growthMeasurementsState.value,
				teething: teethingState.value,
			};

			const files = Object.entries(dataStores)
				.filter(([, data]) => data.length > 0)
				.map(([name, data]) => ({
					content: toCsv(name, data as Record<string, unknown>[]),
					name: `${name}.csv`,
				}));

			const zipBlob = await createZip(files);
			downloadZip(zipBlob);
			toast.success(fbt('Data exported successfully.', 'Export success toast'));
		} catch {
			toast.error(fbt('Failed to export data.', 'Export error toast'));
		} finally {
			setIsProcessing(false);
		}
	};

	const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setIsProcessing(true);
		try {
			const files = await extractFiles(file);
			for (const { content, name } of files) {
				let state: {
					update: (item: any) => void;
					value: any[];
				} | null = null;

				switch (name) {
					case 'diaperChanges':
						state = diaperChangesState;
						break;
					case 'diaperProducts':
						state = { update: updateProduct, value: products };
						break;
					case 'events':
						state = eventsState;
						break;
					case 'feedingSessions':
						state = feedingSessionsState;
						break;
					case 'growthMeasurements':
						state = growthMeasurementsState;
						break;
					case 'teething':
						state = teethingState;
						break;
				}

				if (state) {
					const data = fromCsv(content) as ({ id: string } & Record<
						string,
						string | number | boolean
					>)[];
					const merged = mergeData(
						state.value as Record<string, unknown>[],
						data,
					);
					merged.forEach((item) => {
						state?.update(item);
					});
				}
			}
			toast.success(fbt('Data imported successfully.', 'Import success toast'));
		} catch {
			toast.error(fbt('Failed to import data.', 'Import error toast'));
		} finally {
			setIsProcessing(false);
		}
	};

	const renderData = () => (
		<div className="space-y-4 w-full pb-8">
			<Card>
				<CardHeader>
					<CardTitle>
						<fbt desc="Title for export section">Export Data</fbt>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground mb-4">
						<fbt desc="Description of export feature">
							Download all your data as a ZIP file containing CSVs.
						</fbt>
					</p>
					<Button
						className="w-full"
						disabled={isProcessing}
						onClick={handleExport}
					>
						{isProcessing ? (
							<fbt desc="Loading state for export">Exporting...</fbt>
						) : (
							<fbt desc="Action to export data">Export</fbt>
						)}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>
						<fbt desc="Title for import section">Import Data</fbt>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground mb-4">
						<fbt desc="Description of import feature">
							Import data from a ZIP file containing CSVs. Existing data will
							not be overwritten.
						</fbt>
					</p>
					<Input
						accept=".zip"
						disabled={isProcessing}
						onChange={handleImport}
						type="file"
					/>
				</CardContent>
			</Card>

			<div className="text-center pt-4">
				<p className="text-xs text-muted-foreground">
					<fbt desc="Version information label">Version:</fbt>{' '}
					<span className="font-mono">
						{process.env.NEXT_PUBLIC_GIT_COMMIT_SHA || 'dev'}
					</span>
				</p>
			</div>
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
							onValueChange={(v) => setCurrency(v as Currency)}
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
			case 'data':
				return fbt('Data Management', 'Title for data management section');
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
			{activeSection === 'data' && renderData()}
		</div>
	);
}
