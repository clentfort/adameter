import type { Meta, StoryObj } from '@storybook/react';
import { SplashScreen } from './splash-screen';

const meta: Meta<typeof SplashScreen> = {
	component: SplashScreen,
	parameters: {
		// Using 'fullscreen' layout because the splash screen is designed to take up the whole viewport.
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
	title: 'Components/SplashScreen',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	parameters: {
		docs: {
			description: {
				story:
					'The SplashScreen component is designed to cover the entire viewport, typically used during initial application load.',
			},
		},
	},
	render: () => <SplashScreen />,
};

// Since the component is quite simple and doesn't take props,
// there aren't many variations to showcase beyond its default appearance.
// If it had props for different logos, background colors, etc., those would be additional stories.
