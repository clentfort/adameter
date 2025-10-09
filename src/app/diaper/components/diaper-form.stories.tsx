import type { Meta, StoryObj } from '@storybook/react';
// import { action } from '@storybook/addon-actions'; // Removed
import { DIAPER_BRANDS } from '../utils/diaper-brands'; // Required for default props
import DiaperForm, { AddDiaperProps, EditDiaperProps } from './diaper-form';

const now = new Date();
const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);

const meta: Meta<typeof DiaperForm> = {
	argTypes: {
		onClose: { action: 'closed' },
		onSave: { action: 'saved' },
		title: { control: 'text' },
	},
	component: DiaperForm,
	parameters: {
		docs: {
			story: {
				height: '100vh',
				inline: false,
			},
		},
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'App/Diaper/DiaperForm',
};

export default meta;
type AddStory = StoryObj<AddDiaperProps>;
type EditStory = StoryObj<EditDiaperProps>;

export const AddMode: AddStory = {
	args: {
		onClose: () => {},
		onSave: () => {},
		presetDiaperBrand: DIAPER_BRANDS[0].value, // Default to first brand
		presetType: 'urine',
		title: 'Add New Diaper Change',
	},
};

export const AddModeWithPresetStool: AddStory = {
	args: {
		...AddMode.args,
		presetType: 'stool',
		title: 'Add Stool Diaper Change',
	},
};

export const EditMode: EditStory = {
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
		onClose: () => {},
		onSave: () => {},
		title: 'Edit Diaper Change',
		// reducedOptions, presetDiaperBrand, presetType are not used in EditMode
	},
};

export const EditModeUrineOnly: EditStory = {
	args: {
		...EditMode.args!,
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

export const WithAbnormalTemperature: EditStory = {
	args: {
		...EditMode.args!,
		change: {
			...EditMode.args!.change!,
			id: 'diaper-125',
			temperature: 38.5, // Abnormal high
		},
		title: 'Edit Diaper - Abnormal Temp',
	},
};

export const WithLowTemperature: EditStory = {
	args: {
		...EditMode.args!,
		change: {
			...EditMode.args!.change!,
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
