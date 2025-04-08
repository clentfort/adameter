'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { FeedingSession } from '@/types/feeding';
import { format } from 'date-fns';
import { useTranslate } from '@/utils/translate';

interface EditSessionDialogProps {
	session: FeedingSession;
	onUpdate: (session: FeedingSession) => void;
	onClose: () => void;
}

export default function EditSessionDialog({
	session,
	onUpdate,
	onClose,
}: EditSessionDialogProps) {
	const [breast, setBreast] = useState<'left' | 'right'>(session.breast);
	const [date, setDate] = useState('');
	const [time, setTime] = useState('');
	const [duration, setDuration] = useState('');

	const t = useTranslate();

	useEffect(() => {
		const startDate = new Date(session.startTime);
		const endDate = new Date(session.endTime);

		setDate(format(startDate, 'yyyy-MM-dd'));
		setTime(format(startDate, 'HH:mm'));

		const durationInMinutes = Math.round(session.durationInSeconds / 60);
		setDuration(durationInMinutes.toString());
	}, [session]);

	const handleSubmit = () => {
		if (!date || !time || !duration || isNaN(Number(duration))) {
			return;
		}

		const durationInMinutes = Number(duration);
		const [year, month, day] = date.split('-').map(Number);
		const [hours, minutes] = time.split(':').map(Number);

		const startTime = new Date(year, month - 1, day, hours, minutes);
		const endTime = new Date(
			startTime.getTime() + durationInMinutes * 60 * 1000,
		);

		const updatedSession: FeedingSession = {
			...session,
			breast,
			startTime: startTime.toISOString(),
			endTime: endTime.toISOString(),
			durationInSeconds: durationInMinutes * 60,
		};

		onUpdate(updatedSession);
		onClose();
	};

	return (
		<Dialog open={true} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{t('editFeedingTime')}</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="space-y-2">
						<Label>{t('breast')}</Label>
						<RadioGroup
							value={breast}
							onValueChange={(value) => setBreast(value as 'left' | 'right')}
							className="flex gap-4"
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem
									value="left"
									id="edit-left"
									className="text-left-breast border-left-breast"
								/>
								<Label htmlFor="edit-left" className="text-left-breast-dark">
									{t('leftBreast')}
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem
									value="right"
									id="edit-right"
									className="text-right-breast border-right-breast"
								/>
								<Label htmlFor="edit-right" className="text-right-breast-dark">
									{t('rightBreast')}
								</Label>
							</div>
						</RadioGroup>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="edit-date">{t('date')}</Label>
							<Input
								id="edit-date"
								type="date"
								value={date}
								onChange={(e) => setDate(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-time">{t('startTime')}</Label>
							<Input
								id="edit-time"
								type="time"
								value={time}
								onChange={(e) => setTime(e.target.value)}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="edit-duration">{t('minutes')}</Label>
						<Input
							id="edit-duration"
							type="number"
							value={duration}
							onChange={(e) => setDuration(e.target.value)}
							min="1"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						type="submit"
						onClick={handleSubmit}
						className={
							breast === 'left'
								? 'bg-left-breast hover:bg-left-breast-dark'
								: 'bg-right-breast hover:bg-right-breast-dark'
						}
					>
						{t('save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
