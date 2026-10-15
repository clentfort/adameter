'use client';

import { format } from 'date-fns';
import {
	Cloud,
	Flower2,
	Moon,
	Rocket,
	Star,
	Sun,
	TreeDeciduous,
} from 'lucide-react';
import React from 'react';
import { Profile } from '@/types/profile';

export type TimelineEvent = {
	date: Date;
	id: string;
	photo?: string;
	title: string;
	type: 'milestone' | 'month' | 'manual';
	visible: boolean;
};

interface TimelineRendererProps {
	events: TimelineEvent[];
	profile: Profile | null;
	theme: 'tree' | 'rainbow' | 'space' | 'garden' | 'modern';
}

export default function TimelineRenderer({
	events,
	profile,
	theme,
}: TimelineRendererProps) {
	const visibleEvents = events.filter((e) => e.visible);

	return (
		<div
			className={`relative w-full h-full p-8 flex flex-col items-center overflow-y-auto ${getThemeBg(theme)}`}
		>
			{/* Theme-specific background decorations */}
			<ThemeDecorations theme={theme} />

			{/* Central Axis */}
			<div className={`absolute top-0 bottom-0 w-1.5 ${getThemeAxis(theme)}`} />

			{/* Events */}
			<div className="relative w-full flex flex-col gap-12 py-12">
				{visibleEvents.map((event, index) => (
					<TimelineItem
						event={event}
						index={index}
						key={event.id}
						theme={theme}
					/>
				))}
			</div>

			{/* Footer */}
			<div className="mt-auto pt-8 text-center z-10">
				<p className={`text-lg font-bold ${getThemeText(theme)}`}>
					{profile?.name}
				</p>
				<p className={`text-sm opacity-70 ${getThemeText(theme)}`}>
					{profile?.dob && format(new Date(profile.dob), 'MMMM d, yyyy')}
				</p>
			</div>
		</div>
	);
}

function TimelineItem({
	event,
	index,
	theme,
}: {
	event: TimelineEvent;
	index: number;
	theme: string;
}) {
	const isLeft = index % 2 === 0;

	return (
		<div
			className={`flex items-center w-full ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
		>
			{/* Content Side */}
			<div
				className={`w-1/2 flex flex-col ${isLeft ? 'items-end pr-8 text-right' : 'items-start pl-8 text-left'}`}
			>
				<div
					className={`p-4 rounded-2xl shadow-lg max-w-[90%] z-10 border-2 ${getEventBubble(theme, event.type)}`}
				>
					<p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">
						{format(event.date, 'MMM yyyy')}
					</p>
					<h3 className="font-bold text-sm leading-tight">{event.title}</h3>
					{event.photo && (
						<div className="mt-2 rounded-lg overflow-hidden border shadow-inner aspect-square w-full">
							<img
								alt={event.title}
								className="w-full h-full object-cover"
								src={event.photo}
							/>
						</div>
					)}
				</div>
			</div>

			{/* Connector Bubble */}
			<div
				className={`absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-4 z-20 ${getThemeConnector(theme)}`}
			/>

			{/* Empty Side */}
			<div className="w-1/2" />
		</div>
	);
}

function ThemeDecorations({ theme }: { theme: string }) {
	if (theme === 'space') {
		return (
			<div className="absolute inset-0 pointer-events-none">
				<Star className="absolute top-10 left-10 text-yellow-200/40 w-8 h-8" />
				<Moon className="absolute top-40 right-20 text-slate-200/40 w-12 h-12" />
				<Star className="absolute bottom-20 left-20 text-yellow-200/40 w-6 h-6" />
				<Rocket className="absolute bottom-10 right-10 text-red-400/40 w-16 h-16 -rotate-45" />
			</div>
		);
	}
	if (theme === 'rainbow') {
		return (
			<div className="absolute inset-0 pointer-events-none opacity-30">
				<Cloud className="absolute top-20 left-10 text-white w-16 h-16" />
				<Cloud className="absolute top-60 right-10 text-white w-20 h-20" />
				<Sun className="absolute top-5 right-5 text-yellow-400 w-12 h-12" />
				<Cloud className="absolute bottom-40 left-15 text-white w-12 h-12" />
			</div>
		);
	}
	if (theme === 'tree') {
		return (
			<div className="absolute inset-0 pointer-events-none overflow-hidden">
				<TreeDeciduous className="absolute -bottom-10 -left-10 text-green-800/10 w-64 h-64" />
				<TreeDeciduous className="absolute top-20 -right-20 text-green-800/10 w-48 h-48" />
			</div>
		);
	}
	if (theme === 'garden') {
		return (
			<div className="absolute inset-0 pointer-events-none overflow-hidden">
				<Flower2 className="absolute top-10 left-10 text-pink-400/20 w-12 h-12" />
				<Flower2 className="absolute top-1/2 right-5 text-purple-400/20 w-16 h-16" />
				<Flower2 className="absolute bottom-1/4 left-5 text-orange-400/20 w-10 h-10" />
			</div>
		);
	}
	return null;
}

function getThemeBg(theme: string) {
	switch (theme) {
		case 'tree':
			return 'bg-emerald-50';
		case 'rainbow':
			return 'bg-sky-50';
		case 'space':
			return 'bg-slate-900';
		case 'garden':
			return 'bg-lime-50';
		case 'modern':
			return 'bg-zinc-50';
		default:
			return 'bg-white';
	}
}

function getThemeAxis(theme: string) {
	switch (theme) {
		case 'tree':
			return 'bg-amber-900/40';
		case 'rainbow':
			return 'bg-gradient-to-b from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400';
		case 'space':
			return 'bg-slate-700/60 dashed border-l-2 border-dashed border-slate-500';
		case 'garden':
			return 'bg-green-600/30 rounded-full';
		case 'modern':
			return 'bg-indigo-500';
		default:
			return 'bg-slate-200';
	}
}

function getThemeConnector(theme: string) {
	switch (theme) {
		case 'tree':
			return 'bg-emerald-500 border-amber-900';
		case 'rainbow':
			return 'bg-white border-yellow-400';
		case 'space':
			return 'bg-yellow-400 border-slate-700';
		case 'garden':
			return 'bg-pink-400 border-green-600';
		case 'modern':
			return 'bg-indigo-500 border-white';
		default:
			return 'bg-primary border-white';
	}
}

function getEventBubble(theme: string, type: string) {
	const isMonth = type === 'month';
	switch (theme) {
		case 'tree':
			return `bg-white ${isMonth ? 'border-emerald-200' : 'border-emerald-500 text-emerald-900'}`;
		case 'rainbow':
			return `bg-white ${isMonth ? 'border-blue-100' : 'border-blue-400 text-blue-900'}`;
		case 'space':
			return `bg-slate-800 ${isMonth ? 'border-slate-600 text-slate-300' : 'border-yellow-400 text-yellow-500'}`;
		case 'garden':
			return `bg-white ${isMonth ? 'border-lime-200' : 'border-pink-500 text-pink-900'}`;
		case 'modern':
			return `bg-white ${isMonth ? 'border-zinc-200' : 'border-indigo-600 text-indigo-900'}`;
		default:
			return 'bg-white border-slate-200';
	}
}

function getThemeText(theme: string) {
	return theme === 'space' ? 'text-white' : 'text-slate-900';
}
