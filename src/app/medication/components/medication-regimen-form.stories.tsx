import type { Meta, StoryObj } from '@storybook/react';
import {
	MedicationRegimen,
	MedicationSchedule,
} from '@/types/medication-regimen';
import { MedicationRegimenForm } from './medication-regimen-form';

// Minimal type for story demonstration
type PartialMedicationRegimenForStory = {
	schedule: Pick<MedicationSchedule, 'type'>;
};

const meta = {
	args: {
		isOpen: true,
		// onClose and onSubmit will be automatically handled by Storybook's actions addon
		// based on the argTypes definition below.
	},
	argTypes: {
		isOpen: { control: 'boolean' },
		onClose: { action: 'closed' },
		onSubmit: { action: 'submitted' },
	},
	component: MedicationRegimenForm,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'App/Medication/MedicationRegimenForm',
} satisfies Meta<typeof MedicationRegimenForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		initialData: undefined,
		onClose: () => {},
		onSubmit: () => {},
	},
};

export const WithInitialDataDaily: Story = {
	args: {
		initialData: {
			dosageAmount: 1,
			dosageUnit: 'drop',
			id: 'regimen-vitamin-d',
			name: 'Vitamin D Drops',
			notes: 'Give with first feed of the day.',
			prescriber: 'Doctor',
			prescriberName: 'Dr. Sunshine',
			schedule: {
				times: ['08:00', '14:00'],
				type: 'daily',
			},
			startDate: '2024-01-15T00:00:00.000Z',
		} as MedicationRegimen,
		onClose: () => {},
		onSubmit: () => {},
	},
};

export const WithInitialDataInterval: Story = {
	args: {
		initialData: {
			dosageAmount: 5,
			dosageUnit: 'ml',
			endDate: '2024-03-08T00:00:00.000Z',
			id: 'regimen-antibiotic-a',
			name: 'Antibiotic A',
			prescriber: 'Doctor',
			prescriberName: 'Dr. Cure',
			schedule: {
				firstDoseTime: '09:00',
				intervalUnit: 'hours',
				intervalValue: 8,
				type: 'interval',
			},
			startDate: '2024-03-01T00:00:00.000Z',
		} as MedicationRegimen,
		onClose: () => {},
		onSubmit: () => {},
	},
};

export const WithInitialDataWeekly: Story = {
	args: {
		initialData: {
			dosageAmount: 400,
			dosageUnit: 'mcg',
			id: 'regimen-folic-acid',
			name: 'Folic Acid Supplement',
			prescriber: 'Midwife',
			prescriberName: 'Anna B.',
			schedule: {
				daysOfWeek: ['Monday', 'Wednesday', 'Friday'],
				times: ['10:00'],
				type: 'weekly',
			},
			startDate: '2023-11-01T00:00:00.000Z',
		} as MedicationRegimen,
		onClose: () => {},
		onSubmit: () => {},
	},
};

export const WithInitialDataAsNeeded: Story = {
	args: {
		initialData: {
			dosageAmount: 2.5,
			dosageUnit: 'ml',
			id: 'regimen-paracetamol',
			name: 'Paracetamol 125mg',
			prescriber: 'Self',
			schedule: {
				details:
					'When fever is above 38.5°C, or child is in clear discomfort from pain. Max 4 times a day.',
				type: 'asNeeded',
			},
			startDate: '2024-02-01T00:00:00.000Z',
		} as MedicationRegimen,
		onClose: () => {},
		onSubmit: () => {},
	},
};

export const NewRegimenDailySelected: Story = {
	args: {
		initialData: undefined, // No initial data implies a new form
		onClose: () => {},
		onSubmit: () => {},
		// To see the form with 'daily' selected by default through story controls,
		// we would typically modify the component's defaultValues or pass a modified initialData.
		// For now, the component defaults to 'daily' if no initialData.schedule.type is provided.
	},
};

export const NewRegimenIntervalSelected: Story = {
	args: {
		onClose: () => {},
		onSubmit: () => {},
		// To demonstrate this, we'd pass a minimal initialData forcing the type
		// This is a bit of a workaround for Storybook control if not directly exposing scheduleType prop.
		initialData: {
			// Minimal data to trigger schedule type in defaultValues
			schedule: { type: 'interval' },
		} as PartialMedicationRegimenForStory,
	},
};

export const NewRegimenWeeklySelected: Story = {
	args: {
		initialData: {
			schedule: { type: 'weekly' },
		} as PartialMedicationRegimenForStory,
		onClose: () => {},
		onSubmit: () => {},
	},
};
export const NewRegimenAsNeededSelected: Story = {
	args: {
		initialData: {
			schedule: { type: 'asNeeded' },
		} as PartialMedicationRegimenForStory,
		onClose: () => {},
		onSubmit: () => {},
	},
};
// Add similar stories for NewRegimenWeeklySelected and NewRegimenAsNeededSelected if needed
// by providing minimal initialData to set the scheduleType in the form's defaultValues.
// For example:
// export const NewRegimenWeeklySelected: Story = {
//   args: {
//     initialData: { schedule: { type: 'weekly' } } as any,
//   },
// };
// export const NewRegimenAsNeededSelected: Story = {
//   args: {
//     initialData: { schedule: { type: 'asNeeded' } } as any,
//   },
// };
