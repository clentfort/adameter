'use client';

import { fbt } from 'fbtee';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ProfileForm from '@/components/profile-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { useProfilesSnapshot, useUpsertProfile, useRemoveProfile } from '@/hooks/use-profile';
import { useSelectedProfileId } from '@/hooks/use-selected-profile-id';
import { SettingsHeader } from '../components/settings-header';
import type { Profile } from '@/types/profile';

export default function ChildrenSettingsPage() {
	const profiles = useProfilesSnapshot();
	const upsertProfile = useUpsertProfile();
	const removeProfile = useRemoveProfile();
	const [selectedProfileId, setSelectedProfileId] = useSelectedProfileId();
	const [isAdding, setIsAdding] = useState(false);
	const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

	return (
		<>
			<SettingsHeader
				title={fbt('Children', 'Title for children settings section')}
			/>

			<div className="space-y-4 w-full">
				{profiles.map((profile) => (
					<Card
						className={`relative cursor-pointer transition-colors ${
							selectedProfileId === profile.id ? 'border-primary ring-1 ring-primary' : 'hover:bg-muted/50'
						}`}
						key={profile.id}
						onClick={() => setSelectedProfileId(profile.id)}
					>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<div className="flex items-center gap-3">
								<div className={`w-3 h-3 rounded-full ${profile.color || 'bg-slate-500'}`} />
								<CardTitle className="text-lg font-bold">{profile.name}</CardTitle>
							</div>
							<div className="flex gap-2">
								<Button
									onClick={(e) => {
										e.stopPropagation();
										setEditingProfile(profile);
									}}
									size="sm"
									variant="outline"
								>
									{fbt('Edit', 'Edit profile button')}
								</Button>
								{profiles.length > 1 && (
									<Button
										onClick={(e) => {
											e.stopPropagation();
											if (confirm(fbt('Are you sure you want to remove this child?', 'Confirm delete child').toString())) {
												removeProfile(profile.id);
												if (selectedProfileId === profile.id) {
													const other = profiles.find(p => p.id !== profile.id);
													if (other) setSelectedProfileId(other.id);
												}
											}
										}}
										size="icon"
										variant="ghost"
									>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								)}
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								{profile.dob}
							</p>
						</CardContent>
					</Card>
				))}

				<Button className="w-full" onClick={() => setIsAdding(true)} variant="outline">
					<Plus className="mr-2 h-4 w-4" />
					{fbt('Add Child', 'Add child button')}
				</Button>
			</div>

			<Dialog onOpenChange={(open) => !open && setIsAdding(false)} open={isAdding}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>{fbt('Add Child', 'Title for add child dialog')}</DialogTitle>
						<DialogDescription>
							{fbt('Enter details for the new child.', 'Description for add child dialog')}
						</DialogDescription>
					</DialogHeader>
					<ProfileForm
						onSave={(data) => {
							const id = crypto.randomUUID();
							upsertProfile({ ...data, id, optedOut: false });
							setSelectedProfileId(id);
							setIsAdding(false);
						}}
					/>
				</DialogContent>
			</Dialog>

			<Dialog onOpenChange={(open) => !open && setEditingProfile(null)} open={!!editingProfile}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>{fbt('Edit Child', 'Title for edit child dialog')}</DialogTitle>
					</DialogHeader>
					{editingProfile && (
						<ProfileForm
							initialData={editingProfile}
							onSave={(data) => {
								upsertProfile({ ...editingProfile, ...data, optedOut: false });
								setEditingProfile(null);
							}}
						/>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
