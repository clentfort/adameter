'use client';

import { fbt } from 'fbtee';
import { Database, Globe, Package, Share2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import { useProfile } from '@/hooks/use-profile';
import { SettingsHeader } from './components/settings-header';
import { SettingsNavItem } from './components/settings-nav-item';

export default function SettingsPage() {
	const [profile] = useProfile();
	const { room } = useContext(DataSynchronizationContext);
	const router = useRouter();

	return (
		<>
			<SettingsHeader
				onBack={() => router.push('/')}
				title={fbt('Settings', 'Title for settings page')}
			/>

			<div className="space-y-4 w-full pb-8">
				<SettingsNavItem
					href="/settings/children"
					icon={
						<div
							className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${profile?.color || 'bg-primary'}`}
						>
							{profile?.name ? (
								profile.name[0].toUpperCase()
							) : (
								<User className="h-5 w-5" />
							)}
						</div>
					}
					subtitle={fbt(
						'Manage child profiles',
						'Subtext for children settings',
					)}
					testId="settings-profile"
					title={
						profile?.name || fbt('Children', 'Label for children settings')
					}
				/>

				<SettingsNavItem
					href="/settings/appearance"
					icon={<Globe className="h-5 w-5" />}
					iconClassName="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
					subtitle={fbt(
						'Language and Theme',
						'Subtext for appearance settings',
					)}
					testId="settings-appearance"
					title={<fbt desc="Label for appearance settings">Appearance</fbt>}
				/>

				<SettingsNavItem
					href="/settings/sharing"
					icon={<Share2 className="h-5 w-5" />}
					iconClassName="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300"
					subtitle={
						room ? (
							<fbt desc="Summary of the sharing settings">
								Connected to <fbt:param name="roomName">{room}</fbt:param>
							</fbt>
						) : (
							<fbt desc="Text showing no room is connected">Not syncing</fbt>
						)
					}
					testId="settings-sharing"
					title={<fbt desc="Label for sharing settings">Sharing</fbt>}
				/>

				<SettingsNavItem
					href="/settings/diapers"
					icon={<Package className="h-5 w-5" />}
					iconClassName="bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300"
					subtitle={
						<fbt desc="Subtext for diaper products settings">
							Manage brands, sizes and costs
						</fbt>
					}
					testId="settings-diapers"
					title={
						<fbt desc="Label for diaper products settings">Diaper Products</fbt>
					}
				/>

				<SettingsNavItem
					href="/settings/data"
					icon={<Database className="h-5 w-5" />}
					iconClassName="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300"
					subtitle={fbt(
						'Import and export your data',
						'Subtext for data settings',
					)}
					testId="settings-data"
					title={<fbt desc="Label for data settings">Data Management</fbt>}
				/>
			</div>
		</>
	);
}
