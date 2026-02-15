import type { Meta, StoryObj } from '@storybook/react';
import HistoryList, { ItemWithId } from './history-list';

interface MockEventItem extends ItemWithId {
	data: string;
	timestamp: string; // ISO string for date
}

const mockEvents: MockEventItem[] = [
	{ data: 'Event A on July 1st', id: '1', timestamp: '2024-07-01T10:00:00Z' },
	{ data: 'Event B on July 1st', id: '2', timestamp: '2024-07-01T12:30:00Z' },
	{ data: 'Event C on June 30th', id: '3', timestamp: '2024-06-30T15:00:00Z' },
	{
		data: 'Event D on July 1st (earlier)',
		id: '4',
		timestamp: '2024-07-01T09:00:00Z',
	},
	{ data: 'Event E on June 29th', id: '5', timestamp: '2024-06-29T10:00:00Z' },
];

const meta = {
	component: HistoryList,
	parameters: {
		layout: 'padded', // Use padded to give some space around the list
	},
	tags: ['autodocs'],
	title: 'Components/HistoryList',
} satisfies Meta<typeof HistoryList<MockEventItem>>; // Specify the generic type

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: (entry) => (
			<div style={{ borderBottom: '1px solid #eee', padding: '10px' }}>
				<div>ID: {entry.id}</div>
				<div>Data: {(entry as MockEventItem).data}</div>
				<div>
					Time:{' '}
					{new Date((entry as MockEventItem).timestamp).toLocaleTimeString()}
				</div>
			</div>
		),
		dateAccessor: (entry) => (entry as MockEventItem).timestamp,
		entries: mockEvents,
	},
};

export const Empty: Story = {
	args: {
		children: (entry) => <div>{(entry as MockEventItem).data}</div>,
		dateAccessor: (entry) => (entry as MockEventItem).timestamp,
		entries: [],
	},
};
