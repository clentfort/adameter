import type { Meta, StoryObj } from '@storybook/react';
import { SplashScreen } from './splash-screen';

const meta: Meta<typeof SplashScreen> = {
	component: SplashScreen,
	parameters: {
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
