import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { DateTimeInputs } from './date-time-inputs';

function TestForm({ timeField }: { timeField?: 'time' }) {
	const { register } = useForm({
		defaultValues: {
			date: '2023-01-01',
			time: '12:00',
		},
	});
	return (
		<DateTimeInputs
			dateField="date"
			register={register}
			timeField={timeField}
		/>
	);
}

describe('DateTimeInputs', () => {
	it('renders date input when timeField is not provided', () => {
		render(<TestForm />);
		expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
		expect(screen.queryByLabelText(/time/i)).not.toBeInTheDocument();
	});

	it('renders both date and time inputs when timeField is provided', () => {
		render(<TestForm timeField="time" />);
		expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
	});
});
