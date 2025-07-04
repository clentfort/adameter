import type { Meta, StoryObj } from '@storybook/react';
import { DIAPER_BRANDS } from '../utils/diaper-brands';
import DiaperTracker from './diaper-tracker';

const meta: Meta<typeof DiaperTracker> = {
	argTypes: {
		// @ts-ignore : Storybook specific arg for controlling the mock
		mockedLastBrand: {
			control: 'select',
			options: DIAPER_BRANDS.map((b) => b.value),
		},
	},
	component: DiaperTracker,
	parameters: {
		docs: {
			story: {
				height: '100vh',
				inline: false, // Explicitly set for clarity, though default for docs
			},
		},
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'App/Diaper/DiaperTracker',
};

export default meta;
type Story = StoryObj<typeof DiaperTracker & { mockedLastBrand?: string }>;

export const Default: Story = {};

export const ClickUrineOpensDialog: Story = {
	args: {
		// @ts-ignore : Storybook specific arg for controlling the mock
		mockedLastBrand: DIAPER_BRANDS[1].value,
	},
};

export const ClickStoolOpensDialog: Story = {
	args: {
		// @ts-ignore : Storybook specific arg for controlling the mock
		mockedLastBrand: DIAPER_BRANDS[2].value,
	},
};

export const DialogSaveAction: Story = {};
