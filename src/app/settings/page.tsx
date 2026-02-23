'use client';

import { fbt } from 'fbtee';
import {
	ArrowLeft,
	ChevronRight,
	Globe,
	Moon,
	Share2,
	User,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useContext, useState } from 'react';
import ProfileForm from '@/components/profile-form';
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
import { useLanguage } from '@/contexts/i18n-context';
import { useProfile } from '@/hooks/use-profile';
import { Locale } from '@/i18n';
import { DataSharingContent } from '@/components/root-layout/data-sharing-switcher';

export default function SettingsPage() {
	const [profile, setProfile] = useProfile();
	const { setTheme, theme } = useTheme();
	const { locale, setLocale } = useLanguage();
	const { room } = useContext(DataSynchronizationContext);

	const [activeSection, setActiveSection] = useState<'main' | 'profile' | 'sharing' | 'appearance'>('main');

	const updateLocale = async (code: Locale) => {
		await setLocale(code);
		window.location.reload();
	};

	const renderMain = () => (
		<div className="space-y-4 w-full">
			<button
				className="w-full flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm hover:bg-accent transition-colors"
				onClick={() => setActiveSection('profile')}
			>
				<div className="flex items-center gap-3">
					<div className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${profile?.color || 'bg-primary'}`}>
						{profile?.name ? profile.name[0].toUpperCase() : <User className="h-5 w-5" />}
					</div>
					<div className="text-left">
						<p className="font-medium">{profile?.name || fbt('Child Profile', 'Label for child profile settings')}</p>
						<p className="text-sm text-muted-foreground">{fbt('Edit name, birthday, and more', 'Subtext for profile settings')}</p>
					</div>
				</div>
				<ChevronRight className="h-5 w-5 text-muted-foreground" />
			</button>

			<button
				className="w-full flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm hover:bg-accent transition-colors"
				onClick={() => setActiveSection('appearance')}
			>
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
						<Globe className="h-5 w-5" />
					</div>
					<div className="text-left">
						<p className="font-medium"><fbt desc="Label for appearance settings">Appearance</fbt></p>
						<p className="text-sm text-muted-foreground">{fbt('Language and Theme', 'Subtext for appearance settings')}</p>
					</div>
				</div>
				<ChevronRight className="h-5 w-5 text-muted-foreground" />
			</button>

			<button
				className="w-full flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm hover:bg-accent transition-colors"
				onClick={() => setActiveSection('sharing')}
			>
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-300">
						<Share2 className="h-5 w-5" />
					</div>
					<div className="text-left">
						<p className="font-medium"><fbt desc="Label for sharing settings">Sharing</fbt></p>
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
							<p className="text-sm font-medium"><fbt desc="Label for language setting">Language</fbt></p>
						</div>
						<Select onValueChange={(v) => updateLocale(v as Locale)} value={locale}>
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
							<p className="text-sm font-medium"><fbt desc="Label for theme setting">Theme</fbt></p>
						</div>
						<Select onValueChange={(v) => setTheme(v)} value={theme}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="light"><fbt desc="Light theme option">Light</fbt></SelectItem>
								<SelectItem value="dark"><fbt desc="Dark theme option">Dark</fbt></SelectItem>
								<SelectItem value="system"><fbt desc="System theme option">System</fbt></SelectItem>
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
								Synchronize your data across multiple devices by joining a shared
								room.
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
			default:
				return fbt('Settings', 'Title for settings page');
		}
	};

	const handleBack = () => {
		if (activeSection === 'main') {
			window.location.href = '/';
		} else {
			setActiveSection('main');
		}
	};

	return (
		<div className="flex flex-col items-center w-full max-w-md mx-auto">
			<div className="w-full flex justify-between items-center mb-6">
				<Button onClick={handleBack} size="icon" variant="outline">
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
		</div>
	);
}
