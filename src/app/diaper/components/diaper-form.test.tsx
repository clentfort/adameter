import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DiaperForm from './diaper-form';

import { DiaperChange } from '@/types/diaper';

// Mock the useDiaperChanges hook
vi.mock('@/hooks/use-diaper-changes', () => ({
  useDiaperChanges: () => ({
    add: vi.fn(),
    update: vi.fn(),
    value: [], // Provide a default empty array for the hook's value
  }),
}));

// Mock the useLastUsedDiaperBrand hook
vi.mock('@/hooks/use-last-used-diaper-brand', () => ({
  useLastUsedDiaperBrand: () => ({
    getLastUsedDiaperBrand: vi.fn().mockReturnValue(''),
    setLastUsedDiaperBrand: vi.fn(),
  }),
}));

// Mock fbtee for <fbt> calls
vi.mock('fbtee/react', async (importOriginal) => {
  const mod = await importOriginal<typeof import('fbtee/react')>();
  return {
    ...mod,
    fbt: ({ children }: { children: React.ReactNode }) => children,
  };
});


// Helper function to provide default props for AddDiaperProps
const defaultAddProps = {
  onClose: vi.fn(),
  onSave: vi.fn(),
  title: 'Add Diaper Change',
  reducedOptions: false,
};

describe('DiaperForm', () => {
  it('should render correctly for a new entry (not reduced)', () => {
    render(<DiaperForm {...defaultAddProps} />);

    // Check for common fields
    expect(screen.getByLabelText('Diaper Brand')).toBeInTheDocument();
    expect(screen.getByLabelText('Temperature (°C)')).toBeInTheDocument();
    expect(screen.getByLabelText('Diaper leaked')).toBeInTheDocument();
    expect(screen.getByLabelText('Abnormalities')).toBeInTheDocument();

    // Fields present when not reduced
    expect(screen.getByLabelText('Diaper Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Time')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('should render correctly for a new entry (reduced options)', () => {
    render(<DiaperForm {...defaultAddProps} reducedOptions={true} />);

    // Check for common fields
    expect(screen.getByLabelText('Diaper Brand')).toBeInTheDocument();
    expect(screen.getByLabelText('Temperature (°C)')).toBeInTheDocument();
    expect(screen.getByLabelText('Diaper leaked')).toBeInTheDocument();
    expect(screen.getByLabelText('Abnormalities')).toBeInTheDocument();

    // Fields that should NOT be present when reduced
    expect(screen.queryByLabelText('Diaper Type')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Date')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Time')).not.toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('should call onSave with the correct data when submitting a new entry', () => {
    const mockOnSave = vi.fn();
    const mockOnClose = vi.fn();
    render(
      <DiaperForm
        {...defaultAddProps}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />,
    );

    // Interact with the form
    // Diaper Type (default is urine)
    fireEvent.click(screen.getByLabelText('Stool')); // Change to stool

    // Date and Time (rely on default values for simplicity in this test, or set them)
    // For now, let's assume default date/time is acceptable for submission logic
    // const dateInput = screen.getByLabelText('Date') as HTMLInputElement;
    // fireEvent.change(dateInput, { target: { value: '2023-10-27' } });
    // const timeInput = screen.getByLabelText('Time') as HTMLInputElement;
    // fireEvent.change(timeInput, { target: { value: '14:30' } });

    // Diaper Brand
    // Radix Select is tricky to test with fireEvent directly for value changes.
    // We'll assume the default 'andere' or test by selecting if stable.
    // For now, we'll rely on the default value.

    // Temperature
    fireEvent.change(screen.getByLabelText('Temperature (°C)'), {
      target: { value: '37.1' },
    });

    // Leakage
    fireEvent.click(screen.getByLabelText('Diaper leaked')); // Toggle to true

    // Abnormalities
    fireEvent.change(screen.getByLabelText('Abnormalities'), {
      target: { value: 'Slightly green' },
    });

    // Submit the form
    fireEvent.click(screen.getByText('Save'));

    // Assertions
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    const savedData = mockOnSave.calls[0][0];

    expect(savedData.containsStool).toBe(true);
    expect(savedData.containsUrine).toBe(true); // Always true as per component logic
    expect(savedData.temperature).toBe(37.1);
    expect(savedData.leakage).toBe(true);
    expect(savedData.abnormalities).toBe('Slightly green');
    // diaperBrand will be the default or what was set, e.g., 'andere'
    expect(savedData.diaperBrand).toBeDefined();
    expect(savedData.timestamp).toBeDefined(); // Check that a timestamp string is there
    expect(typeof savedData.timestamp).toBe('string');

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Cancel button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<DiaperForm {...defaultAddProps} onClose={mockOnClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  describe('Editing an existing entry', () => {
    const existingChange: DiaperChange = {
      id: '123',
      timestamp: new Date(2023, 9, 26, 10, 0, 0).toISOString(), // Oct 26, 2023, 10:00:00 AM
      containsUrine: true,
      containsStool: false,
      diaperBrand: 'pampers', // This is a DIAPER_BRANDS value
      temperature: 36.8,
      leakage: false,
      abnormalities: 'None',
    };

    const defaultEditProps = {
      onClose: vi.fn(),
      onSave: vi.fn(),
      title: 'Edit Diaper Change',
      change: existingChange,
    };

    beforeEach(() => {
      // Reset mocks before each test
      vi.clearAllMocks();
      defaultEditProps.onClose.mockClear();
      defaultEditProps.onSave.mockClear();
    });

    it('should render correctly and populate form fields with existing data', () => {
      render(<DiaperForm {...defaultEditProps} />);

      // Check if form fields are populated correctly
      expect(screen.getByLabelText<HTMLInputElement>('Date').value).toBe(
        '2023-10-26',
      );
      expect(screen.getByLabelText<HTMLInputElement>('Time').value).toBe('10:00');
      expect(screen.getByLabelText<HTMLInputElement>('Urine Only')).toBeChecked();

      // Diaper Brand (Select) - Check the trigger's displayed value if possible,
      // or ensure the value is passed to the Select component.
      // For Radix, the actual <select> is not there, value is managed internally.
      // We can check if the 'pampers' option is selected by checking the `value` prop of the Select.
      // This is an approximation as direct value check on Radix Select is complex in testing.
      // The component's internal state `diaperBrand` should be 'pampers'.

      expect(
        screen.getByLabelText<HTMLInputElement>('Temperature (°C)').value,
      ).toBe('36.8');
      expect(screen.getByLabelText<HTMLInputElement>('Diaper leaked')).not.toBeChecked();
      expect(
        screen.getByLabelText<HTMLInputElement>('Abnormalities').value,
      ).toBe('None');
      expect(screen.getByText('Pampers')).toBeInTheDocument(); // Check if the label for pampers is rendered
    });

    it('should call onSave with the updated data when editing an entry', () => {
      const mockOnSave = vi.fn();
      const mockOnClose = vi.fn();
      render(
        <DiaperForm
          {...defaultEditProps}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />,
      );

      // Simulate changing some values
      // Change to Stool
      fireEvent.click(screen.getByLabelText('Stool'));

      // Change Temperature
      fireEvent.change(screen.getByLabelText('Temperature (°C)'), {
        target: { value: '37.5' },
      });

      // Toggle Leakage to true
      fireEvent.click(screen.getByLabelText('Diaper leaked'));

      // Change Abnormalities
      fireEvent.change(screen.getByLabelText('Abnormalities'), {
        target: { value: 'Slightly foamy' },
      });

      // Change Date (e.g. to next day)
      fireEvent.change(screen.getByLabelText('Date'), {
        target: { value: '2023-10-27' },
      });


      // Submit the form
      fireEvent.click(screen.getByText('Save'));

      // Assertions
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      const savedData = mockOnSave.calls[0][0];

      expect(savedData.id).toBe(existingChange.id); // ID should remain the same
      expect(savedData.containsStool).toBe(true);
      expect(savedData.temperature).toBe(37.5);
      expect(savedData.leakage).toBe(true);
      expect(savedData.abnormalities).toBe('Slightly foamy');
      expect(savedData.diaperBrand).toBe('pampers'); // Brand wasn't changed in this test
      
      const expectedTimestamp = new Date(2023, 9, 27, 10, 0, 0).toISOString(); // Oct 27, 2023, 10:00 AM
      expect(savedData.timestamp).toBe(expectedTimestamp);


      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should handle diaper brand not in predefined list by setting to "andere"', () => {
      const changeWithUnknownBrand: DiaperChange = {
        ...existingChange,
        diaperBrand: 'unknown-brand-xyz',
      };
      render(
        <DiaperForm
          {...defaultEditProps}
          change={changeWithUnknownBrand}
        />,
      );
      // The Select component should show 'Andere' (or its translated value)
      // This relies on the internal logic correctly setting the state to 'andere'
      // which then would be the value for the Select.
      // We expect 'Andere' to be visible as the selected value's display name.
      expect(screen.getByText('Andere')).toBeInTheDocument();
    });
  });
});
