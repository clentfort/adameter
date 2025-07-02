import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { IntlVariations } from 'fbt'; // Assuming IntlVariations is available
import { FbtContext } from 'fbt-react'; // Assuming FbtContext is available
import EditIconButton from './edit'; // Assuming the component is exported as default from './edit'

const meta: Meta<typeof EditIconButton> = {
	argTypes: {
		onClick: { action: 'clicked' },
	},
	component: EditIconButton,
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
	title: 'Components/IconButtons/EditIconButton',
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
