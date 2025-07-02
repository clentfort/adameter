import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { FbtContext, IntlVariations } from 'fbt'; // Assuming these are the correct imports for Fbt
import { DIAPER_BRANDS } from '../utils/diaper-brands'; // Required for default props
import DiaperForm from './diaper-form';

// Mock FbtContext for Storybook
const fbtContextValue = {
	IntlVariations,
	locale: 'en_US',
	translation: {},
};

const now = new Date();
const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);

const meta: Meta<typeof DiaperForm> = {
	argTypes: {
		onClose: { action: 'closed' },
		onSave: { action: 'saved' },
		title: { control: 'text' },
		// For AddDiaperProps
		presetDiaperBrand: {
			control: 'select',
			options: [...DIAPER_BRANDS.map((b) => b.value), undefined],
		},
		presetType: { control: 'radio', options: ['urine', 'stool', undefined] },
		reducedOptions: { control: 'boolean' },
		// For EditDiaperProps
		// 'change' prop is complex and better handled by distinct stories for Add vs Edit modes
	},
	component: DiaperForm,
	decorators: [
		(Story) => (
			<FbtContext.Provider value={fbtContextValue}>
				<Story />
			</FbtContext.Provider>
		),
	],
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'App/Diaper/DiaperForm',
};

export default meta;
type Story = StoryObj<typeof DiaperForm>;

export const AddMode: Story = {
	args: {
		onClose: fn(),
		onSave: fn(),
		presetDiaperBrand: DIAPER_BRANDS[0].value, // Default to first brand
		presetType: 'urine',
		reducedOptions: false,
		title: 'Add New Diaper Change',
	},
};

export const AddModeReducedOptions: Story = {
	args: {
		...AddMode.args,
		reducedOptions: true,
		title: 'Quick Add Diaper',
	},
};

export const AddModeWithPresetStool: Story = {
	args: {
		...AddMode.args,
		presetType: 'stool',
		title: 'Add Stool Diaper Change',
	},
};

export const EditMode: Story = {
	args: {
		change: {
			abnormalities: 'Slight rash noted.',
			containsStool: true,
			containsUrine: true,
			diaperBrand: DIAPER_BRANDS[1].value,
			id: 'diaper-123',
			leakage: true,
			temperature: 37.0,
			timestamp: yesterday.toISOString(),
		},
		onClose: fn(),
		onSave: fn(),
		title: 'Edit Diaper Change',
		// reducedOptions, presetDiaperBrand, presetType are not used in EditMode
	},
};

export const EditModeUrineOnly: Story = {
	args: {
		...EditMode.args,
		change: {
			abnormalities: '',
			containsStool: false,
			containsUrine: true,
			diaperBrand: 'andere', // Test with a non-predefined brand
			id: 'diaper-124',
			leakage: false,
			temperature: 36.5,
			timestamp: now.toISOString(),
		},
		title: 'Edit Urine-Only Diaper Change',
	},
};

export const WithAbnormalTemperature: Story = {
	args: {
		...EditMode.args,
		change: {
			...EditMode.args.change!,
			id: 'diaper-125',
			temperature: 38.5, // Abnormal high
		},
		title: 'Edit Diaper - Abnormal Temp',
	},
};

export const WithLowTemperature: Story = {
	args: {
		...EditMode.args,
		change: {
			...EditMode.args.change!,
			id: 'diaper-126',
			temperature: 35.0, // Abnormal low
		},
		title: 'Edit Diaper - Low Temp',
	},
};

// Note: Interactive states like opening the select for diaper brands,
// or the behavior of the Dialog itself (e.g., closing on overlay click)
// are typically better tested with integration/e2e tests or Storybook's play functions
// if the Dialog component supports it well in the test environment.
// These stories primarily focus on the form's rendering with different props.
