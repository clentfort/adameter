import type { Meta, StoryObj } from '@storybook/react';
import { vi } from 'vitest';
import { useEvents } from '@/hooks/use-events';
import { Event } from '@/types/event';
import EventsList from './events-list';

vi.mock('@/hooks/use-events');

const now = new Date();
const anHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

const sampleEvents: Event[] = [
	{
		color: '#10b981', // Green
		description: 'Baby took first steps!',
		id: 'event-1',
		startDate: yesterday.toISOString(),
		title: 'First Steps',
		type: 'point',
	},
	{
		color: '#ef4444', // Red
		description: 'High temperature, monitored closely.',
		endDate: now.toISOString(),
		id: 'event-2',
		startDate: anHourAgo.toISOString(),
		title: 'Fever',
		type: 'period',
	},
	{
		color: '#6366f1', // Indigo
		id: 'event-3',
		startDate: tomorrow.toISOString(),
		title: 'Vaccination Appointment',
		type: 'point',
	},
	{
		color: '#f59e0b', // Amber
		id: 'event-4',
		startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Started 2 days ago
		title: 'Ongoing Teething',
		type: 'period', // Ongoing, no end date
	},
];

// Mock return value for useEvents hook
const mockUseEvents = (events: Event[]) => ({
	add: vi.fn((event: Event) => events.push(event)),
	remove: vi.fn((id: string) => {
		const index = events.findIndex((e) => e.id === id);
		if (index > -1) events.splice(index, 1);
	}),
	update: vi.fn((updatedEvent: Event) => {
		const index = events.findIndex((e) => e.id === updatedEvent.id);
		if (index > -1) events[index] = updatedEvent;
	}),
	value: events,
});

const meta: Meta<typeof EventsList> = {
	argTypes: {
		// @ts-ignore: For passing mocked events data through args
		mockedEvents: { control: 'object' },
	},
	component: EventsList,
	decorators: [
		(Story, context) => {
			(useEvents as import('vitest').Mock).mockReturnValue(
				mockUseEvents(context.args.mockedEvents || []),
			);
			return <Story />;
		},
	],
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
	title: 'App/Events/EventsList',
};

export default meta;
type Story = StoryObj<typeof EventsList & { mockedEvents?: Event[] }>;

export const Default: Story = {
	args: {
		mockedEvents: [...sampleEvents],
	},
};

export const Empty: Story = {
	args: {
		mockedEvents: [],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(/no events recorded yet./i),
		).toBeInTheDocument();
	},
};

export const SinglePointEvent: Story = {
	args: {
		mockedEvents: [sampleEvents[0]],
	},
};

export const SinglePeriodEvent: Story = {
	args: {
		mockedEvents: [sampleEvents[1]],
	},
};

export const SingleOngoingEvent: Story = {
	args: {
		mockedEvents: [sampleEvents[3]],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText(sampleEvents[3].title)).toBeInTheDocument();
		await expect(canvas.getByText(/ongoing/i)).toBeInTheDocument();
	},
};

export const WithManyEvents: Story = {
	args: {
		mockedEvents: [
			...sampleEvents,
			{
				color: '#ec4899',
				endDate: new Date(
					now.getTime() - 3 * 24 * 60 * 60 * 1000,
				).toISOString(),
				id: 'event-5',
				startDate: new Date(
					now.getTime() - 5 * 24 * 60 * 60 * 1000,
				).toISOString(),
				title: 'Grandma Visit',
				type: 'period',
			},
			{
				color: '#8b5cf6',
				id: 'event-6',
				startDate: new Date(
					now.getTime() - 10 * 24 * 60 * 60 * 1000,
				).toISOString(),
				title: 'Started Solids',
				type: 'point',
			},
		],
	},
};
