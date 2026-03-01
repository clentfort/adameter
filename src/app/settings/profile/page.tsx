'use client';

import { useRouter } from 'next/navigation';
import ProfileForm from '@/components/profile-form';
import { Card, CardContent } from '@/components/ui/card';
import { useProfile } from '@/hooks/use-profile';

export default function ProfileSettingsPage() {
	const [profile, setProfile] = useProfile();
	const router = useRouter();

	return (
		<div className="space-y-4 w-full">
			<Card>
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
	);
}
