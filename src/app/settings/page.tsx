'use client';

import { fbt } from 'fbtee';
import {
	ChevronRight,
	Database,
	Globe,
	Package,
	Share2,
	User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import { useProfile } from '@/hooks/use-profile';
import { SettingsHeader } from './components/settings-header';

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
				<Link
					className="w-full flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm hover:bg-accent transition-colors"
					data-testid="settings-profile"
					href="/settings/children"
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
									fbt('Children', 'Label for children settings')}
							</p>
							<p className="text-sm text-muted-foreground">
								{fbt(
									'Manage child profiles',
									'Subtext for children settings',
								)}
							</p>
						</div>
					</div>
					<ChevronRight className="h-5 w-5 text-muted-foreground" />
				</Link>

				<Link
					className="w-full flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm hover:bg-accent transition-colors"
					data-testid="settings-appearance"
					href="/settings/appearance"
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
				</Link>

				<Link
					className="w-full flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm hover:bg-accent transition-colors"
					data-testid="settings-sharing"
					href="/settings/sharing"
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
									<fbt desc="Summary of the sharing settings">
										Connected to <fbt:param name="roomName">{room}</fbt:param>
									</fbt>
								) : (
									<fbt desc="Text showing no room is connected">
										Not syncing
									</fbt>
								)}
							</p>
						</div>
					</div>
					<ChevronRight className="h-5 w-5 text-muted-foreground" />
				</Link>

				<Link
					className="w-full flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm hover:bg-accent transition-colors"
					data-testid="settings-diapers"
					href="/settings/diapers"
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
				</Link>

				<Link
					className="w-full flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm hover:bg-accent transition-colors"
					data-testid="settings-data"
					href="/settings/data"
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
								{fbt(
									'Import and export your data',
									'Subtext for data settings',
								)}
							</p>
						</div>
					</div>
					<ChevronRight className="h-5 w-5 text-muted-foreground" />
				</Link>
			</div>
		</>
	);
}
