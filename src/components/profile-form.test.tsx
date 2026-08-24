import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ProfileForm from './profile-form';

describe('ProfileForm', () => {
	it('renders default values and allows submitting valid profile data', async () => {
		const user = userEvent.setup();
		const handleSave = vi.fn();
		const handleOptOut = vi.fn();

		render(<ProfileForm onOptOut={handleOptOut} onSave={handleSave} />);

		const nameInput = screen.getByLabelText('Name');
		const dobInput = screen.getByLabelText('Date of Birth');
		const saveButton = screen.getByRole('button', { name: 'Save Profile' });

		expect(saveButton).toBeDisabled();

		await user.type(nameInput, 'Baby Ada');
		await user.type(dobInput, '2024-01-01');

		// Select sex
		const sexSelect = screen.getByRole('combobox', { name: 'Sex' });
		await user.click(sexSelect);
		const girlOption = screen.getByRole('option', { name: 'Girl' });
		await user.click(girlOption);

		// Select color
		const colorButton = screen.getByTestId('profile-color-red-500');
		await user.click(colorButton);

		expect(saveButton).toBeEnabled();
		await user.click(saveButton);

		expect(handleSave).toHaveBeenCalledWith({
			color: 'bg-red-500',
			dob: '2024-01-01',
			name: 'Baby Ada',
			sex: 'girl',
		});
	});

	it('renders with initialData and triggers onOptOut when opt out button is clicked', async () => {
		const user = userEvent.setup();
		const handleSave = vi.fn();
		const handleOptOut = vi.fn();

		const initialData = {
			color: 'bg-blue-500',
			dob: '2023-05-15',
			id: 'p1',
			name: 'John',
			sex: 'boy' as const,
		};

		render(
			<ProfileForm
				initialData={initialData}
				onOptOut={handleOptOut}
				onSave={handleSave}
			/>,
		);

		const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
		expect(nameInput.value).toBe('John');

		const optOutButton = screen.getByTestId('profile-opt-out-button');
		await user.click(optOutButton);

		expect(handleOptOut).toHaveBeenCalledTimes(1);
	});
});
