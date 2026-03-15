'use client';

import { fbt } from 'fbtee';
import { useRouter } from 'next/navigation';
import ProfileForm from '@/components/profile-form';
import { Card, CardContent } from '@/components/ui/card';
import { useProfile } from '@/hooks/use-profile';
import { SettingsHeader } from '../components/settings-header';

export default function ProfileSettingsPage() {
	const [profile, setProfile] = useProfile();
	const router = useRouter();

	return (
		<>
			<SettingsHeader
				title={fbt('Child Profile', 'Title for profile settings section')}
			/>

			<div className="space-y-4 w-full">
				<Card className="bg-white dark:bg-card">
					<CardContent>
						<ProfileForm
							initialData={profile}
							onSave={(data) => {
								setProfile({ ...data, optedOut: false });
								router.push('/settings');
							}}
						/>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
