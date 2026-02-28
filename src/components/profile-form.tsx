'use client';

import { profileSchema, type ProfileFormValues } from '@/types/profile';
import { zodResolver } from '@hookform/resolvers/zod';
import { fbt } from 'fbtee';
import { Check } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
	const {
		formState: { isValid },
		handleSubmit,
		register,
		reset,
		setValue,
		watch,
	} = useForm<ProfileFormValues>({
		defaultValues: {
			color:
				initialData?.color || COLORS[Math.floor(Math.random() * COLORS.length)],
			dob: initialData?.dob || '',
			name: initialData?.name || '',
			sex: (initialData?.sex as Sex) || undefined,
		},
		mode: 'onChange',
		resolver: zodResolver(profileSchema),
	});

	const color = watch('color');
	const sex = watch('sex');

	useEffect(() => {
		if (initialData) {
			reset({
				color:
					initialData.color ||
					COLORS[Math.floor(Math.random() * COLORS.length)],
				dob: initialData.dob || '',
				name: initialData.name || '',
				sex: initialData.sex as Sex,
			});
		}
	}, [initialData, reset]);

	const onSubmit = (values: ProfileFormValues) => {
		onSave({
			color: values.color,
			dob: values.dob,
			name: values.name,
			sex: values.sex,
		});
	};

	return (
		<form className="space-y-6 py-4" onSubmit={handleSubmit(onSubmit)}>
			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="name">
						<fbt desc="Label for child name input">Name</fbt>
					</Label>
					<Input
						id="name"
						placeholder={fbt('Name', 'Placeholder for child name input')}
						type="text"
						{...register('name')}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="dob">
						<fbt desc="Label for date of birth input">Date of Birth</fbt>
					</Label>
					<Input id="dob" type="date" {...register('dob')} />
				</div>
				<div className="space-y-2">
					<Label htmlFor="sex">
						<fbt desc="Label for biological sex select">Sex</fbt>
					</Label>
					<Select
						onValueChange={(value: string) =>
							setValue('sex', value as Sex, { shouldValidate: true })
						}
						value={sex}
					>
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
								onClick={() => setValue('color', c, { shouldValidate: true })}
								type="button"
							>
								{color === c && <Check className="h-4 w-4 text-white" />}
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-2 pt-4">
				<Button className="w-full" disabled={!isValid} type="submit">
					<fbt desc="Button to save profile information">Save Profile</fbt>
				</Button>
				<Button
					className="w-full text-muted-foreground text-xs"
					data-testid="profile-opt-out-button"
					onClick={onOptOut}
					type="button"
					variant="ghost"
				>
					<fbt desc="Button to opt out of providing profile information">
						I don&apos;t want to provide this information
					</fbt>
				</Button>
			</div>
		</form>
	);
}
