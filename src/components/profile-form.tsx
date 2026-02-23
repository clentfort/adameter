'use client';

import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { Profile, Sex } from '@/types/profile';

interface ProfileFormProps {
	initialData?: Profile | null;
	onOptOut?: () => void;
	onSave: (data: {
		color: string;
		dob: string;
		name: string;
		sex: Sex;
	}) => void;
}

const COLORS = [
	'bg-slate-500',
	'bg-red-500',
	'bg-orange-500',
	'bg-amber-500',
	'bg-yellow-500',
	'bg-lime-500',
	'bg-green-500',
	'bg-emerald-500',
	'bg-teal-500',
	'bg-cyan-500',
	'bg-sky-500',
	'bg-blue-500',
	'bg-indigo-500',
	'bg-violet-500',
	'bg-purple-500',
	'bg-fuchsia-500',
	'bg-pink-500',
	'bg-rose-500',
];

export default function ProfileForm({
	initialData,
	onOptOut,
	onSave,
}: ProfileFormProps) {
	const [dob, setDob] = useState(initialData?.dob || '');
	const [sex, setSex] = useState<Sex | ''>(initialData?.sex || '');
	const [name, setName] = useState(initialData?.name || '');
	const [color, setColor] = useState(
		initialData?.color || COLORS[Math.floor(Math.random() * COLORS.length)],
	);

	useEffect(() => {
		if (initialData) {
			setDob(initialData.dob || '');
			setSex(initialData.sex || '');
			setName(initialData.name || '');
			if (initialData.color) {
				setColor(initialData.color);
			}
		}
	}, [initialData]);

	const handleSave = () => {
		if (dob && sex && name) {
			onSave({ color, dob, name, sex });
		}
	};

	return (
		<div className="space-y-6 py-4">
			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="name">
						<fbt desc="Label for child name input">Name</fbt>
					</Label>
					<Input
						id="name"
						onChange={(e) => setName(e.target.value)}
						placeholder={fbt('Name', 'Placeholder for child name input')}
						type="text"
						value={name}
					/>
				</div>
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
				<div className="space-y-2">
					<Label>
						<fbt desc="Label for color selection">Color</fbt>
					</Label>
					<div className="flex flex-wrap gap-2">
						{COLORS.map((c) => (
							<button
								className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${c} ${
									color === c
										? 'border-slate-900 scale-110'
										: 'border-transparent hover:scale-105'
								}`}
								key={c}
								onClick={() => setColor(c)}
								type="button"
							>
								{color === c && <Check className="h-4 w-4 text-white" />}
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-2 pt-4">
				<Button
					className="w-full"
					disabled={!dob || !sex || !name}
					onClick={handleSave}
				>
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
