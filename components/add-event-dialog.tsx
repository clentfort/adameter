'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { PlusCircle } from 'lucide-react';
import type { Event } from '@/types/event';
import { useTranslate } from '@/utils/translate';

interface AddEventDialogProps {
	event?: Event; // Optional for editing existing event
	onSave: (event: Event) => void;
	onClose?: () => void;
}

export default function AddEventDialog({
	event,
	onSave,
	onClose,
}: AddEventDialogProps) {
	const [open, setOpen] = useState(!!event);
	const [title, setTitle] = useState(event?.title || '');
	const [description, setDescription] = useState(event?.description || '');
	const [startDate, setStartDate] = useState(
		event?.startDate
			? new Date(event.startDate).toISOString().split('T')[0]
			: new Date().toISOString().split('T')[0],
	);
	const [startTime, setStartTime] = useState(
		event?.startDate
			? new Date(event.startDate).toTimeString().slice(0, 5)
			: new Date().toTimeString().slice(0, 5),
	);
	const [eventType, setEventType] = useState<'point' | 'period'>(
		event?.type || 'point',
	);
	const [hasEndDate, setHasEndDate] = useState(!!event?.endDate);
	const [endDate, setEndDate] = useState(
		event?.endDate
			? new Date(event.endDate).toISOString().split('T')[0]
			: new Date().toISOString().split('T')[0],
	);
	const [endTime, setEndTime] = useState(
		event?.endDate
			? new Date(event.endDate).toTimeString().slice(0, 5)
			: new Date().toTimeString().slice(0, 5),
	);
	const [color, setColor] = useState(event?.color || '#6366f1'); // Default to indigo

	const t = useTranslate();

	const handleSave = () => {
		if (!title || !startDate) return;

		const startDateTime = new Date(`${startDate}T${startTime}`);
		let endDateTime = hasEndDate
			? new Date(`${endDate}T${endTime}`)
			: undefined;

		// Ensure end date is after start date
		if (endDateTime && endDateTime <= startDateTime) {
			endDateTime = new Date(startDateTime.getTime() + 3600000); // Add 1 hour
		}

		const newEvent: Event = {
			id: event?.id || Date.now().toString(),
			title,
			description: description || undefined,
			startDate: startDateTime.toISOString(),
			endDate: endDateTime?.toISOString(),
			type: eventType,
			color,
		};

		onSave(newEvent);
		setOpen(false);
		if (onClose) onClose();
	};

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen && onClose) onClose();
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			{!event && (
				<DialogTrigger asChild>
					<Button variant="outline" size="sm" onClick={() => setOpen(true)}>
						<PlusCircle className="h-4 w-4 mr-1" />
						{t('addEvent')}
					</Button>
				</DialogTrigger>
			)}
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>{event ? t('editEvent') : t('newEvent')}</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="title">{t('title')}</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={t('titleExample')}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">{t('description')}</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder={t('descriptionPlaceholder')}
							rows={3}
						/>
					</div>

					<div className="space-y-2">
						<Label>{t('eventType')}</Label>
						<RadioGroup
							value={eventType}
							onValueChange={(value) =>
								setEventType(value as 'point' | 'period')
							}
							className="flex gap-4"
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="point" id="point" />
								<Label htmlFor="point">{t('pointEvent')}</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="period" id="period" />
								<Label htmlFor="period">{t('periodEvent')}</Label>
							</div>
						</RadioGroup>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="start-date">{t('date')}</Label>
							<Input
								id="start-date"
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="start-time">{t('time')}</Label>
							<Input
								id="start-time"
								type="time"
								value={startTime}
								onChange={(e) => setStartTime(e.target.value)}
							/>
						</div>
					</div>

					{eventType === 'period' && (
						<>
							<div className="flex items-center space-x-2">
								<Switch
									id="has-end-date"
									checked={hasEndDate}
									onCheckedChange={setHasEndDate}
								/>
								<Label htmlFor="has-end-date">{t('setEndDate')}</Label>
							</div>

							{hasEndDate && (
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="end-date">{t('endDate')}</Label>
										<Input
											id="end-date"
											type="date"
											value={endDate}
											onChange={(e) => setEndDate(e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="end-time">{t('endTime')}</Label>
										<Input
											id="end-time"
											type="time"
											value={endTime}
											onChange={(e) => setEndTime(e.target.value)}
										/>
									</div>
								</div>
							)}
						</>
					)}

					<div className="space-y-2">
						<Label htmlFor="color">{t('color')}</Label>
						<div className="flex gap-2">
							{[
								'#6366f1',
								'#ec4899',
								'#10b981',
								'#f59e0b',
								'#ef4444',
								'#8b5cf6',
							].map((colorOption) => (
								<button
									key={colorOption}
									type="button"
									className={`w-8 h-8 rounded-full ${color === colorOption ? 'ring-2 ring-offset-2 ring-black' : ''}`}
									style={{ backgroundColor: colorOption }}
									onClick={() => setColor(colorOption)}
									aria-label={`Farbe ${colorOption}`}
								/>
							))}
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button type="submit" onClick={handleSave}>
						{t('save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
