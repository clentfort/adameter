'use client';

import { fbt } from 'fbtee';
import { useEffect, useState } from 'react';
import { useProfile } from '@/hooks/use-profile';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import ProfileForm from './profile-form';

export default function ProfilePrompt() {
	const [profile, setProfile] = useProfile();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	if (
		profile?.dob ||
		profile?.optedOut ||
		window.localStorage.getItem('adameter-skip-profile') === 'true'
	) {
		return null;
	}

	return (
		<Dialog open={true}>
			<DialogContent className="sm:max-w-[425px]" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>
						<fbt desc="Title for the profile setup dialog">Welcome to AdaMeter!</fbt>
					</DialogTitle>
					<DialogDescription>
						<fbt desc="Description for the profile setup dialog">
							To show growth percentiles on your charts, we need to know your
							child&apos;s date of birth and biological sex.
						</fbt>
					</DialogDescription>
				</DialogHeader>
				<ProfileForm
					onOptOut={() => setProfile({ optedOut: true })}
					onSave={(data) => setProfile({ ...data, optedOut: false })}
				/>
			</DialogContent>
		</Dialog>
	);
}
