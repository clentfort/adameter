import type { Meta, StoryObj } from '@storybook/react';
import { Event } from '@/types/event';
import EventsList from './events-list';

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

// Mock return value for useEvents hook - This structure is no longer needed as we're not mocking the hook itself for Storybook.
// const mockUseEvents = (events: Event[]) => ({
// 	add: action('addEvent'),
// 	remove: action('removeEvent'),
// 	update: action('updateEvent'),
// 	value: events,
// });

const meta: Meta<typeof EventsList> = {
	argTypes: {
		// No longer using mockedEvents for direct data injection via args
	},
	component: EventsList,
	decorators: [
		(Story, context) => {
			// The component will use its actual useEvents hook.
			// Storybook will need to be able to support the hook's underlying storage (e.g., IndexedDB via y-indexeddb).
			// If stories need specific event states, this would require either:
			// 1. Programmatically manipulating the Yjs document/IndexedDB before the story renders (complex for stories).
			// 2. Modifying useEvents or EventsList to accept initial/mock data for Storybook purposes.
			// For now, stories will reflect the actual state of useEvents.
			return <Story />;
		},
	],
	parameters: {
		docs: {
			story: {
				height: '100vh',
				inline: false, // Explicitly set for clarity
			},
		},
		layout: 'padded',
	},
	tags: ['autodocs'],
	title: 'App/Events/EventsList',
};

export default meta;
type Story = StoryObj<typeof EventsList>; // Removed mockedEvents from type

export const Default: Story = {
	args: {
		// mockedEvents: [...sampleEvents], // Removed
	},
};

export const Empty: Story = {
	args: {
		// mockedEvents: [], // Removed
	},
};

export const SinglePointEvent: Story = {
	args: {
		// mockedEvents: [sampleEvents[0]], // Removed
	},
};

export const SinglePeriodEvent: Story = {
	args: {
		// mockedEvents: [sampleEvents[1]], // Removed
	},
};

export const SingleOngoingEvent: Story = {
	args: {
		// mockedEvents: [sampleEvents[3]], // Removed
	},
};

export const WithManyEvents: Story = {
	args: {
		// mockedEvents: [ // Removed
		// 	...sampleEvents,
		// 	{
		// 		color: '#ec4899',
		// 		endDate: new Date(
		// 			now.getTime() - 3 * 24 * 60 * 60 * 1000,
		// 		).toISOString(),
		// 		id: 'event-5',
		// 		startDate: new Date(
		// 			now.getTime() - 5 * 24 * 60 * 60 * 1000,
		// 		).toISOString(),
		// 		title: 'Grandma Visit',
		// 		type: 'period',
		// 	},
		// 	{
		// 		color: '#8b5cf6',
		// 		id: 'event-6',
		// 		startDate: new Date(
		// 			now.getTime() - 10 * 24 * 60 * 60 * 1000,
		// 		).toISOString(),
		// 		title: 'Started Solids',
		// 		type: 'point',
		// 	},
		// ],
	},
};
