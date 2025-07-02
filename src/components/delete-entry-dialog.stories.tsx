import type { Meta, StoryObj } from '@storybook/react';
// import { action } from '@storybook/addon-actions'; // Removed
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
		docs: {
			story: {
				inline: false,
			},
		},
	},
	tags: ['autodocs'],
	title: 'Components/DeleteEntryDialog',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		entry: 'sample-entry-id-123',
		onClose: () => {},
		onDelete: () => {},
	},
};

export const WithLongEntryId: Story = {
	args: {
		entry:
			'a-very-long-and-detailed-entry-identifier-that-might-overflow-or-wrap',
		onClose: () => {},
		onDelete: () => {},
	},
};
