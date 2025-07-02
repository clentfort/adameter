import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import DeleteEntryDialog from './delete-entry-dialog';

const meta: Meta<typeof DeleteEntryDialog> = {
	argTypes: {
		entry: { control: 'text' },
		onClose: { action: 'closed' },
		onDelete: { action: 'deleted' },
	},
	component: DeleteEntryDialog,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'Components/DeleteEntryDialog',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		entry: 'sample-entry-id-123',
		onClose: fn(),
		onDelete: fn(),
	},
};

export const WithLongEntryId: Story = {
	args: {
		entry:
			'a-very-long-and-detailed-entry-identifier-that-might-overflow-or-wrap',
		onClose: fn(),
		onDelete: fn(),
	},
};
