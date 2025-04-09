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
	event?: Event; 
	onClose?: () => void;
	// Optional for editing existing event
	onSave: (event: Event) => void;
}

export default function AddEventDialog({
	event,
	onClose,
	onSave,
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
			endDateTime = new Date(startDateTime.getTime() + 3_600_000); // Add 1 hour
		}

		const newEvent: Event = {
			color,
			description: description || undefined,
			endDate: endDateTime?.toISOString(),
			id: event?.id || Date.now().toString(),
			startDate: startDateTime.toISOString(),
			title,
			type: eventType,
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
		<Dialog onOpenChange={handleOpenChange} open={open}>
			{!event && (
				<DialogTrigger asChild>
					<Button onClick={() => setOpen(true)} size="sm" variant="outline">
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
							onChange={(e) => setTitle(e.target.value)}
							placeholder={t('titleExample')}
							value={title}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">{t('description')}</Label>
						<Textarea
							id="description"
							onChange={(e) => setDescription(e.target.value)}
							placeholder={t('descriptionPlaceholder')}
							rows={3}
							value={description}
						/>
					</div>

					<div className="space-y-2">
						<Label>{t('eventType')}</Label>
						<RadioGroup
							className="flex gap-4"
							onValueChange={(value) =>
								setEventType(value as 'point' | 'period')
							}
							value={eventType}
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem id="point" value="point" />
								<Label htmlFor="point">{t('pointEvent')}</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem id="period" value="period" />
								<Label htmlFor="period">{t('periodEvent')}</Label>
							</div>
						</RadioGroup>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="start-date">{t('date')}</Label>
							<Input
								id="start-date"
								onChange={(e) => setStartDate(e.target.value)}
								type="date"
								value={startDate}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="start-time">{t('time')}</Label>
							<Input
								id="start-time"
								onChange={(e) => setStartTime(e.target.value)}
								type="time"
								value={startTime}
							/>
						</div>
					</div>

					{eventType === 'period' && (
						<>
							<div className="flex items-center space-x-2">
								<Switch
									checked={hasEndDate}
									id="has-end-date"
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
											onChange={(e) => setEndDate(e.target.value)}
											type="date"
											value={endDate}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="end-time">{t('endTime')}</Label>
										<Input
											id="end-time"
											onChange={(e) => setEndTime(e.target.value)}
											type="time"
											value={endTime}
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
									aria-label={`Farbe ${colorOption}`}
									className={`w-8 h-8 rounded-full ${color === colorOption ? 'ring-2 ring-offset-2 ring-black' : ''}`}
									key={colorOption}
									onClick={() => setColor(colorOption)}
									style={{ backgroundColor: colorOption }}
									type="button"
								/>
							))}
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={handleSave} type="submit">
						{t('save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
