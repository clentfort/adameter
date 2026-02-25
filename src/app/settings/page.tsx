'use client';

import { fbt } from 'fbtee';
import {
	ArrowLeft,
	ChevronRight,
	Globe,
	Moon,
	PoundSterling,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import { useLanguage } from '@/contexts/i18n-context';
import { useCurrency } from '@/hooks/use-currency';
import { useDiaperAverageCost } from '@/hooks/use-diaper-average-cost';
import { useDiaperBrands } from '@/hooks/use-diaper-brands';
import { useProfile } from '@/hooks/use-profile';
import { Locale } from '@/i18n';
import { DiaperBrand } from '@/types/diaper-brand';

export default function SettingsPage() {
	const [profile, setProfile] = useProfile();
	const { setTheme, theme } = useTheme();
	const { locale, setLocale } = useLanguage();
	const [currency, setCurrency] = useCurrency();
	const [averageCost, setAverageCost] = useDiaperAverageCost();
	const {
		add: addBrand,
		remove: removeBrand,
		update: updateBrand,
		value: brands,
	} = useDiaperBrands();
	const { room } = useContext(DataSynchronizationContext);
	const router = useRouter();

	const [activeSection, setActiveSection] = useState<
		'main' | 'profile' | 'sharing' | 'appearance' | 'diapers'
	>('main');
	const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
	const [newBrand, setNewBrand] = useState<Partial<DiaperBrand>>({
		costPerDiaper: 0,
		isReusable: false,
		name: '',
		perUseCost: 0,
		upfrontCost: 0,
	});

	const updateLocale = async (code: Locale) => {
		await setLocale(code);
	};

	const renderMain = () => (
		<div className="space-y-4 w-full">
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
					<div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-600 dark:text-orange-300">
						<PoundSterling className="h-5 w-5" />
					</div>
					<div className="text-left">
						<p className="font-medium">
							<fbt desc="Label for diaper cost settings">Diaper Costs</fbt>
						</p>
						<p className="text-sm text-muted-foreground">
							<fbt desc="Subtext for diaper cost settings">
								Configure brands and costs
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
							<PoundSterling className="h-4 w-4" />
							<p className="text-sm font-medium">
								<fbt desc="Label for currency setting">Currency</fbt>
							</p>
						</div>
						<Select onValueChange={(v) => setCurrency(v)} value={currency}>
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

	const renderDiapers = () => (
		<div className="space-y-4 w-full">
			<Card>
				<CardContent className="space-y-6">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="average-cost">
								<fbt desc="Label for average disposable cost setting">
									Average Disposable Cost
								</fbt>
							</Label>
							<Input
								className="w-24 text-right"
								id="average-cost"
								onChange={(e) =>
									setAverageCost(Number.parseFloat(e.target.value) || 0)
								}
								step="0.01"
								type="number"
								value={averageCost}
							/>
						</div>
						<p className="text-xs text-muted-foreground">
							<fbt desc="Help text for average cost setting">
								Used as a baseline to calculate savings from reusable diapers.
							</fbt>
						</p>
					</div>

					<div className="space-y-4 pt-4 border-t">
						<div className="flex items-center justify-between">
							<h3 className="font-medium">
								<fbt desc="Title for diaper brands list in settings">
									Diaper Brands
								</fbt>
							</h3>
						</div>

						<div className="space-y-4">
							{brands.map((brand) => (
								<div
									className="flex flex-col gap-2 p-3 border rounded-lg bg-accent/20"
									key={brand.id}
								>
									<div className="flex items-center justify-between">
										<span className="font-semibold">{brand.name}</span>
										<div className="flex items-center gap-2">
											<Button
												onClick={() => {
													setEditingBrandId(brand.id);
													setNewBrand(brand);
												}}
												size="sm"
												variant="ghost"
											>
												<fbt common>Edit</fbt>
											</Button>
											<Button
												onClick={() => removeBrand(brand.id)}
												size="icon"
												variant="ghost"
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</div>
									</div>
									<div className="text-xs text-muted-foreground flex gap-4">
										<span>
											{brand.isReusable ? (
												<fbt desc="Label for reusable diaper in list">
													Reusable
												</fbt>
											) : (
												<fbt desc="Label for disposable diaper in list">
													Disposable
												</fbt>
											)}
										</span>
										{!brand.isReusable && (
											<span>
												<fbt desc="Cost per diaper label">
													Cost/Unit:{' '}
													<fbt:param name="cost">
														{brand.costPerDiaper.toFixed(2)}
													</fbt:param>
												</fbt>
											</span>
										)}
										{brand.isReusable && (
											<>
												<span>
													<fbt desc="Upfront cost label">
														Upfront:{' '}
														<fbt:param name="cost">
															{brand.upfrontCost.toFixed(2)}
														</fbt:param>
													</fbt>
												</span>
												{brand.perUseCost !== undefined &&
													brand.perUseCost > 0 && (
														<span>
															<fbt desc="Usage cost label">
																Usage:{' '}
																<fbt:param name="cost">
																	{brand.perUseCost.toFixed(2)}
																</fbt:param>
															</fbt>
														</span>
													)}
											</>
										)}
									</div>
								</div>
							))}

							<div className="space-y-4 p-4 border rounded-xl bg-card">
								<h4 className="text-sm font-semibold">
									{editingBrandId ? (
										<fbt desc="Title for editing a brand">Edit Brand</fbt>
									) : (
										<fbt desc="Title for adding a brand">Add New Brand</fbt>
									)}
								</h4>
								<div className="space-y-3">
									<div className="space-y-1">
										<Label htmlFor="brand-name">
											<fbt desc="Brand name label">Name</fbt>
										</Label>
										<Input
											id="brand-name"
											onChange={(e) =>
												setNewBrand({ ...newBrand, name: e.target.value })
											}
											placeholder="e.g. Pampers, Stoffy"
											value={newBrand.name || ''}
										/>
									</div>
									<div className="flex items-center justify-between py-2">
										<Label htmlFor="brand-reusable">
											<fbt desc="Reusable toggle label">Reusable</fbt>
										</Label>
										<Switch
											checked={newBrand.isReusable || false}
											id="brand-reusable"
											onCheckedChange={(checked) =>
												setNewBrand({ ...newBrand, isReusable: checked })
											}
										/>
									</div>
									{!newBrand.isReusable && (
										<div className="space-y-1">
											<Label htmlFor="brand-cost">
												<fbt desc="Cost per diaper label">Cost per Diaper</fbt>
											</Label>
											<Input
												id="brand-cost"
												onChange={(e) =>
													setNewBrand({
														...newBrand,
														costPerDiaper:
															Number.parseFloat(e.target.value) || 0,
													})
												}
												step="0.01"
												type="number"
												value={newBrand.costPerDiaper || 0}
											/>
										</div>
									)}
									{newBrand.isReusable && (
										<>
											<div className="space-y-1">
												<Label htmlFor="brand-upfront">
													<fbt desc="Upfront cost label">Upfront Cost</fbt>
												</Label>
												<Input
													id="brand-upfront"
													onChange={(e) =>
														setNewBrand({
															...newBrand,
															upfrontCost:
																Number.parseFloat(e.target.value) || 0,
														})
													}
													step="1.00"
													type="number"
													value={newBrand.upfrontCost || 0}
												/>
											</div>
											<div className="space-y-1">
												<Label htmlFor="brand-per-use">
													<fbt desc="Usage cost label (e.g. washing)">
														Usage Cost (per use)
													</fbt>
												</Label>
												<Input
													id="brand-per-use"
													onChange={(e) =>
														setNewBrand({
															...newBrand,
															perUseCost:
																Number.parseFloat(e.target.value) || 0,
														})
													}
													step="0.01"
													type="number"
													value={newBrand.perUseCost || 0}
												/>
											</div>
										</>
									)}
									<div className="flex gap-2 pt-2">
										<Button
											className="flex-1"
											disabled={!newBrand.name}
											onClick={() => {
												if (editingBrandId) {
													updateBrand({
														...(newBrand as DiaperBrand),
														id: editingBrandId,
													});
												} else {
													addBrand({
														...(newBrand as DiaperBrand),
														id: Date.now().toString(),
													});
												}
												setEditingBrandId(null);
												setNewBrand({
													costPerDiaper: 0,
													isReusable: false,
													name: '',
													perUseCost: 0,
													upfrontCost: 0,
												});
											}}
										>
											{editingBrandId ? (
												<fbt desc="Save changes button">Save Changes</fbt>
											) : (
												<fbt desc="Add brand button">Add Brand</fbt>
											)}
										</Button>
										{editingBrandId && (
											<Button
												onClick={() => {
													setEditingBrandId(null);
													setNewBrand({
														costPerDiaper: 0,
														isReusable: false,
														name: '',
														perUseCost: 0,
														upfrontCost: 0,
													});
												}}
												variant="outline"
											>
												<fbt common>Cancel</fbt>
											</Button>
										)}
									</div>
								</div>
							</div>
						</div>
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
				return fbt('Diaper Costs', 'Title for diaper settings section');
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
