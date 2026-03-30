'use client';

import { fbt } from 'fbtee';
import { Camera, Download, Layout, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfile } from '@/hooks/use-profile';
import { useEventsSnapshot } from '@/hooks/use-events';
import { useTeethSnapshot } from '@/hooks/use-teething';
import { getToothName } from '@/app/growth/utils/teething';
import { format, differenceInMonths, addMonths, startOfMonth } from 'date-fns';
import { toPng } from 'html-to-image';
import TimelineRenderer, { type TimelineEvent } from './components/timeline-renderer';

type LocalTimelineEvent = {
	id: string;
	date: Date;
	title: string;
	type: 'milestone' | 'month' | 'manual';
	photo?: string;
	visible: boolean;
};

const THEMES = ['tree', 'rainbow', 'space', 'garden', 'modern'] as const;
type Theme = (typeof THEMES)[number];

export default function TimelinePage() {
	const router = useRouter();
	const [profile] = useProfile();
	const events = useEventsSnapshot();
	const teeth = useTeethSnapshot();
	const [activeTheme, setActiveTheme] = useState<Theme>('tree');
	const [manualEvents, setManualEvents] = useState<LocalTimelineEvent[]>([]);
	const [hiddenEventIds, setHiddenEventIds] = useState<Set<string>>(new Set());
	const [editingEvent, setEditingEvent] = useState<LocalTimelineEvent | null>(null);
	const timelineRef = useRef<HTMLDivElement>(null);

	const birthDate = useMemo(() => profile?.dob ? new Date(profile.dob) : new Date(), [profile]);

	const allEvents = useMemo(() => {
		const result: TimelineEvent[] = [];

		// Monthly bubbles
		const monthsSinceBirth = differenceInMonths(new Date(), birthDate);
		for (let i = 0; i <= monthsSinceBirth; i++) {
			const date = addMonths(startOfMonth(birthDate), i);
			result.push({
				id: `month-${i}`,
				date,
				title: i === 0 ? fbt('Birth', 'Label for birth milestone').toString() : fbt(`${fbt.param('monthCount', i)} Months`, 'Label for monthly milestone').toString(),
				type: 'month',
				visible: !hiddenEventIds.has(`month-${i}`),
			});
		}

		// Events from store
		events.forEach(e => {
			result.push({
				id: e.id,
				date: new Date(e.startDate),
				title: e.title,
				type: 'milestone',
				visible: !hiddenEventIds.has(e.id),
			});
		});

		// Teething from store
		teeth.forEach(t => {
			if (!t.date) return;
			result.push({
				id: t.id,
				date: new Date(t.date),
				title: fbt(`${fbt.param('toothName', getToothName(t.toothId))} Erupted`, 'Label for teething milestone'),
				type: 'milestone',
				visible: !hiddenEventIds.has(t.id),
			});
		});

		// Manual events and overrides
		manualEvents.forEach(me => {
			const existingIndex = result.findIndex(r => r.id === me.id);
			if (existingIndex > -1) {
				result[existingIndex] = { ...result[existingIndex], ...me };
			} else {
				result.push(me);
			}
		});

		return result.sort((a, b) => a.date.getTime() - b.date.getTime());
	}, [birthDate, events, teeth, manualEvents, hiddenEventIds]);

	const handleExport = async () => {
		if (timelineRef.current) {
			const dataUrl = await toPng(timelineRef.current, { quality: 0.95 });
			const link = document.createElement('a');
			link.download = `timeline-${format(new Date(), 'yyyy-MM-dd')}.png`;
			link.href = dataUrl;
			link.click();
		}
	};

	return (
		<div className="flex flex-col gap-6 w-full pb-20">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold italic">
					<fbt desc="Title for the timeline export page">Timeline Creator</fbt>
				</h1>
				<div className="flex gap-2">
					<Button variant="outline" size="icon" onClick={() => router.back()}>
						<X className="h-4 w-4" />
					</Button>
					<Button onClick={handleExport}>
						<Download className="mr-2 h-4 w-4" />
						<fbt desc="Download button text">Export</fbt>
					</Button>
				</div>
			</div>

			<Card>
				<CardContent className="p-4 flex flex-col gap-4">
					<div className="flex items-center gap-2">
						<Layout className="h-4 w-4 text-muted-foreground" />
						<span className="text-sm font-medium">Theme</span>
					</div>
					<Tabs value={activeTheme} onValueChange={(v) => setActiveTheme(v as Theme)}>
						<TabsList className="grid grid-cols-5 w-full">
							{THEMES.map(t => (
								<TabsTrigger key={t} value={t} className="capitalize">
									{t}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>
				</CardContent>
			</Card>

			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Events</h2>
					<Button size="sm" onClick={() => setEditingEvent({
						id: crypto.randomUUID(),
						date: new Date(),
						title: '',
						type: 'manual',
						visible: true
					})}>
						<Plus className="h-4 w-4 mr-1" />
						Add
					</Button>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
					{allEvents.map(event => (
						<div key={event.id} className={`flex items-center justify-between p-3 rounded-lg border bg-card ${!event.visible ? 'opacity-50' : ''}`}>
							<div className="flex flex-col">
								<span className="font-medium">{event.title}</span>
								<span className="text-xs text-muted-foreground">{format(event.date, 'MMM d, yyyy')}</span>
							</div>
							<div className="flex gap-1">
								<Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
									const newHidden = new Set(hiddenEventIds);
									if (newHidden.has(event.id)) newHidden.delete(event.id);
									else newHidden.add(event.id);
									setHiddenEventIds(newHidden);
								}}>
									{event.visible ? <Trash2 className="h-4 w-4 text-destructive" /> : <Plus className="h-4 w-4 text-primary" />}
								</Button>
								<Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingEvent(event)}>
									<Pencil className="h-4 w-4" />
								</Button>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="relative w-full aspect-[9/16] bg-slate-100 rounded-2xl overflow-hidden shadow-xl border-8 border-white" ref={timelineRef}>
				<TimelineRenderer
					events={allEvents}
					theme={activeTheme}
					profile={profile}
				/>
			</div>

			{editingEvent && (
				<Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Edit Event</DialogTitle>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label>Title</Label>
								<Input
									value={editingEvent.title}
									onChange={e => setEditingEvent({...editingEvent, title: e.target.value})}
								/>
							</div>
							<div className="space-y-2">
								<Label>Date</Label>
								<Input
									type="date"
									value={format(editingEvent.date, 'yyyy-MM-dd')}
									onChange={e => setEditingEvent({...editingEvent, date: new Date(e.target.value)})}
								/>
							</div>
							<div className="space-y-2">
								<Label>Photo</Label>
								<div className="flex items-center gap-4">
									{editingEvent.photo ? (
										<div className="relative h-20 w-20 rounded-lg overflow-hidden border">
											<img src={editingEvent.photo} alt="Event" className="h-full w-full object-cover" />
											<Button
												size="icon"
												variant="destructive"
												className="absolute top-0 right-0 h-6 w-6 rounded-none"
												onClick={() => setEditingEvent({...editingEvent, photo: undefined})}
											>
												<X className="h-3 w-3" />
											</Button>
										</div>
									) : (
										<Button variant="outline" className="h-20 w-20 border-dashed" onClick={() => {
											const input = document.createElement('input');
											input.type = 'file';
											input.accept = 'image/*';
											input.onchange = (e) => {
												const file = (e.target as HTMLInputElement).files?.[0];
												if (file) {
													setEditingEvent({...editingEvent, photo: URL.createObjectURL(file)});
												}
											};
											input.click();
										}}>
											<Camera className="h-6 w-6 text-muted-foreground" />
										</Button>
									)}
								</div>
							</div>
							<Button className="w-full" onClick={() => {
								if (editingEvent.type === 'manual') {
									setManualEvents(prev => {
										const existing = prev.find(p => p.id === editingEvent.id);
										if (existing) return prev.map(p => p.id === editingEvent.id ? editingEvent : p);
										return [...prev, editingEvent];
									});
								} else {
									// Update monthly or milestone event override
									setManualEvents(prev => {
										const existing = prev.find(p => p.id === editingEvent.id);
										if (existing) return prev.map(p => p.id === editingEvent.id ? editingEvent : p);
										return [...prev, editingEvent];
									});
								}
								setEditingEvent(null);
							}}>Save</Button>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
