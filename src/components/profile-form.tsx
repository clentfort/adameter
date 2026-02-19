'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Sex } from '@/types/profile';

interface ProfileFormProps {
	onOptOut: () => void;
	onSave: (data: { dob: string; sex: Sex }) => void;
}

export default function ProfileForm({ onOptOut, onSave }: ProfileFormProps) {
	const [dob, setDob] = useState('');
	const [sex, setSex] = useState<Sex | ''>('');

	const handleSave = () => {
		if (dob && sex) {
			onSave({ dob, sex });
		}
	};

	return (
		<div className="space-y-6 py-4">
			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="dob">
						<fbt desc="Label for date of birth input">Date of Birth</fbt>
					</Label>
					<Input
						id="dob"
						onChange={(e) => setDob(e.target.value)}
						type="date"
						value={dob}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="sex">
						<fbt desc="Label for biological sex select">Sex</fbt>
					</Label>
					<Select onValueChange={(value) => setSex(value as Sex)} value={sex}>
						<SelectTrigger id="sex">
							<SelectValue
								className="capitalize"
								placeholder={
									<fbt desc="Placeholder for sex selection">Select sex</fbt>
								}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="boy">
								<fbt desc="Option for boy in sex selection">Boy</fbt>
							</SelectItem>
							<SelectItem value="girl">
								<fbt desc="Option for girl in sex selection">Girl</fbt>
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="flex flex-col gap-2 pt-4">
				<Button className="w-full" disabled={!dob || !sex} onClick={handleSave}>
					<fbt desc="Button to save profile information">Save Profile</fbt>
				</Button>
				<Button
					className="w-full text-muted-foreground text-xs"
					data-testid="profile-opt-out-button"
					onClick={onOptOut}
					variant="ghost"
				>
					<fbt desc="Button to opt out of providing profile information">
						I don&apos;t want to provide this information
					</fbt>
				</Button>
			</div>
		</div>
	);
}
