import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { FbtContext, IntlVariations } from 'fbt'; // Corrected: FbtContext from 'fbt'
import DeleteIconButton from './delete'; // Assuming the component is exported as default from './delete'

const meta: Meta<typeof DeleteIconButton> = {
	argTypes: {
		onClick: { action: 'clicked' },
	},
	component: DeleteIconButton,
	decorators: [
		(Story) => (
			// Mock FbtContext if your component uses fbt for internationalization
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
	title: 'Components/IconButtons/DeleteIconButton',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		onClick: fn(),
	},
};

export const WithTooltipVisible: Story = {
	args: {
		onClick: fn(),
	},
	// This story is more of a conceptual reminder.
	// Actual tooltip visibility testing would require interaction tests (e.g., using `play` function)
	// and potentially specific Storybook addons or configurations if the tooltip is complex (e.g., portal-based).
	// For a simple sr-only span, it won't be visually different in Storybook's canvas by default.
	parameters: {
		docs: {
			description: {
				story:
					'This story highlights that the button includes screen-reader text. Visual testing of sr-only content may require browser developer tools or specific accessibility testing tools.',
			},
		},
	},
};
