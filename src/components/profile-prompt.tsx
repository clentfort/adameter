'use client';

import { useEffect, useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	useProfile,
	useProfileIds,
	useUpsertProfile,
} from '@/hooks/use-profile';
import { useSelectedProfileId } from '@/hooks/use-selected-profile-id';
import ProfileForm from './profile-form';

export default function ProfilePrompt() {
	const [profile] = useProfile();
	const profileIds = useProfileIds();
	const upsertProfile = useUpsertProfile();
	const [, setSelectedProfileId] = useSelectedProfileId();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	if (profileIds.length > 0 || profile?.optedOut) {
		return null;
	}

	return (
		<Dialog open={true}>
			<DialogContent className="sm:max-w-[425px]" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>
						<fbt desc="Title for the profile setup dialog">
							Welcome to AdaMeter!
						</fbt>
					</DialogTitle>
					<DialogDescription>
						<fbt desc="Description for the profile setup dialog">
							To show growth percentiles on your charts, we need to know your
							child&apos;s date of birth and biological sex.
						</fbt>
					</DialogDescription>
				</DialogHeader>
				<ProfileForm
					onOptOut={() => {
						const id = crypto.randomUUID();
						upsertProfile({ id, optedOut: true });
						setSelectedProfileId(id);
					}}
					onSave={(data) => {
						const id = crypto.randomUUID();
						upsertProfile({ ...data, id, optedOut: false });
						setSelectedProfileId(id);
					}}
				/>
			</DialogContent>
		</Dialog>
	);
}
