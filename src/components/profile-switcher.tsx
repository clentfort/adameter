'use client';

import { fbt } from 'fbtee';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProfilesSnapshot } from '@/hooks/use-profile';
import { useSelectedProfileId } from '@/hooks/use-selected-profile-id';

export function ProfileSwitcher() {
	const profiles = useProfilesSnapshot();
	const [selectedProfileId, setSelectedProfileId] = useSelectedProfileId();

	const currentProfile = profiles.find((p) => p.id === selectedProfileId);

	if (profiles.length <= 1) {
		return null;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					aria-label={fbt('Switch Child', 'Label for child switcher button')}
					className="relative h-10 w-10 rounded-full"
					size="icon"
					variant="outline"
				>
					{currentProfile?.name ? (
						<div
							className={`flex h-full w-full items-center justify-center rounded-full text-white ${currentProfile.color || 'bg-primary'}`}
						>
							{currentProfile.name[0].toUpperCase()}
						</div>
					) : (
						<User className="h-5 w-5" />
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{profiles.map((profile) => (
					<DropdownMenuItem
						className="flex items-center gap-2"
						key={profile.id}
						onClick={() => setSelectedProfileId(profile.id)}
					>
						<div
							className={`h-2 w-2 rounded-full ${profile.color || 'bg-slate-500'}`}
						/>
						<span>{profile.name}</span>
						{selectedProfileId === profile.id && (
							<span className="ml-auto text-xs text-muted-foreground">
								✓
							</span>
						)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
