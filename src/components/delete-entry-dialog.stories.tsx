import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { IntlVariations } from 'fbt'; // Assuming IntlVariations is available
import { FbtContext } from 'fbt-react'; // Assuming FbtContext is available for fbt
import DeleteEntryDialog from './delete-entry-dialog';

const meta: Meta<typeof DeleteEntryDialog> = {
	argTypes: {
		entry: { control: 'text' },
		onClose: { action: 'closed' },
		onDelete: { action: 'deleted' },
	},
	component: DeleteEntryDialog,
	decorators: [
		(Story) => (
			<FbtContext.Provider
				value={{ IntlVariations, locale: 'en_US', translation: {} }}
			>
				<Story />
			</FbtContext.Provider>
		),
	],
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

// To properly test the dialog interactions, you would typically use Storybook's `play` function
// and testing library utilities. However, since this component relies on `fbt` and AlertDialog's
// own open/close state management which can be tricky in isolation without the full app context
// or more complex mocking, we'll keep these stories focused on rendering with different props.

// Example of how one might test interaction if environment allows:
// import { userEvent, within } from '@storybook/testing-library';
// Default.play = async ({ canvasElement, args }) => {
//   const canvas = within(canvasElement);
//   // Storybook's test runner might not fully support AlertDialog's portal nature well
//   // Need to get the dialog content, which might be in a portal
//   const dialogContent = within(document.body).getByRole('alertdialog');
//
//   const cancelButton = within(dialogContent).getByRole('button', { name: /Cancel/i });
//   await userEvent.click(cancelButton);
//   // expect(args.onClose).toHaveBeenCalled();
//
//   // Re-open or re-render might be needed for subsequent interactions in a real test
//   const deleteButton = within(dialogContent).getByRole('button', { name: /Delete/i });
//   await userEvent.click(deleteButton);
//   // expect(args.onDelete).toHaveBeenCalledWith(args.entry);
// };
