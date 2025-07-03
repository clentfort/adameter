import type { Meta, StoryObj } from '@storybook/react';
import HistoryList, { ItemWithId } from './history-list';

interface MockEventItem extends ItemWithId {
  timestamp: string;
  data: string;
}

const mockEvents: MockEventItem[] = [
  { id: '1', timestamp: '2024-07-01T10:00:00Z', data: 'Event A on July 1st' },
  { id: '2', timestamp: '2024-07-01T12:30:00Z', data: 'Event B on July 1st' },
  { id: '3', timestamp: '2024-06-30T15:00:00Z', data: 'Event C on June 30th' },
  { id: '4', timestamp: '2024-07-01T09:00:00Z', data: 'Event D on July 1st (earlier)' },
  { id: '5', timestamp: '2024-06-29T10:00:00Z', data: 'Event E on June 29th' },
];

const meta = {
  title: 'Components/HistoryList',
  component: HistoryList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof HistoryList<MockEventItem>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entries: mockEvents,
    dateAccessor: (entry) => (entry as MockEventItem).timestamp,
    children: (entry) => (
      <div style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
        <div>ID: {entry.id}</div>
        <div>Data: {(entry as MockEventItem).data}</div>
        <div>Time: {new Date((entry as MockEventItem).timestamp).toLocaleTimeString()}</div>
      </div>
    ),
  },
};

export const Empty: Story = {
  args: {
    entries: [],
    dateAccessor: (entry) => (entry as MockEventItem).timestamp,
    children: (entry) => (
      <div>{(entry as MockEventItem).data}</div>
    ),
  },
};
