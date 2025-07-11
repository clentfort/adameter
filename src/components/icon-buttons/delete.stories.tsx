import type { Meta, StoryObj } from '@storybook/react';
import DeleteIconButton from './delete';

const meta: Meta<typeof DeleteIconButton> = {
	argTypes: {
		onClick: { action: 'clicked' },
	},
	component: DeleteIconButton,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'Components/IconButtons/DeleteIconButton',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		onClick: () => {},
	},
};

export const WithTooltipVisible: Story = {
	args: {
		onClick: () => {},
	},
	parameters: {
		docs: {
			description: {
				story:
					'This story highlights that the button includes screen-reader text. Visual testing of sr-only content may require browser developer tools or specific accessibility testing tools.',
			},
		},
	},
};
