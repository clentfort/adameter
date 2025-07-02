'use client';

import type {
	ChangeEvent,
	ForwardedRef,
	InputHTMLAttributes, // For React.InputHTMLAttributes
	KeyboardEvent,
	ReactNode,
} from 'react';
import { Check } from 'lucide-react'; // Import Check icon
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from 'react';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	// CommandInput, // Not using the inner CommandInput as per requirements
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface AutocompleteProps<T extends { id: string; label: string }>
	extends Omit<
		InputHTMLAttributes<HTMLInputElement>, // Use imported type
		'value' | 'onChange' | 'onSelect' // Omit conflicting HTMLInputAttributes
	> {
	inputClassName?: string;
	onOptionSelect?: (option: T) => void;
	onValueChange: (value: string) => void;
	options: T[];
	placeholder?: string;
	renderOption?: (option: T) => ReactNode; // Use imported type
	value: string;
}

function Autocomplete<T extends { id: string; label: string }>(
	{
		className, // This className is for the PopoverTrigger container
		disabled,
		inputClassName,
		onOptionSelect,
		onValueChange,
		options,
		placeholder,
		renderOption,
		value,
		...restInputProps // Capture other standard input props
	}: AutocompleteProps<T>,
	ref: ForwardedRef<HTMLInputElement>, // Use imported type
) {
	const [isOpen, setIsOpen] = useState(false); // Use imported function
	const internalInputRef = useRef<HTMLInputElement>(null); // Use imported function
	useImperativeHandle(ref, () => internalInputRef.current!); // Use imported function

	const [filteredOptions, setFilteredOptions] = useState<T[]>(options); // Use imported function

	// Effect to update filteredOptions when `options` or `value` props change.
	useEffect(() => {
		let newFilteredOptions: T[];
		if (!value) {
			// If input is empty, show all options.
			newFilteredOptions = options;
			setFilteredOptions(newFilteredOptions);
			// Keep popover open if it was already open and there are options,
			// or if the input is focused and there are options (handled by onFocus).
			// Don't automatically open here if input is simply cleared.
		} else {
			const lowercasedValue = value.toLowerCase();
			newFilteredOptions = options.filter((option) =>
				option.label.toLowerCase().includes(lowercasedValue),
			);
			setFilteredOptions(newFilteredOptions);

			// If there's a value and no options match, close the popover.
			if (newFilteredOptions.length === 0) {
				setIsOpen(false);
			} else {
				// If there are results, ensure the popover is open,
				// but only if it's not already in the process of closing.
				// This handles the case where a user types and results appear.
				if (!isOpen && internalInputRef.current === document.activeElement) {
					setIsOpen(true);
				}
			}
		}
	}, [value, options, isOpen]); // Added isOpen to dependencies to avoid stale closures if we modify it more complexly

	// Input change handler
	const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		// Use imported type
		const newValue = event.target.value;
		onValueChange(newValue); // Propagate change upwards
		if (!isOpen && newValue.length > 0 && options.length > 0) {
			setIsOpen(true);
		} else if (isOpen && newValue.length === 0 && options.length === 0) {
			// If input is empty AND no options (e.g. initial state before options are loaded)
			// we might want to close, or let CommandEmpty handle it.
			// For now, let CommandEmpty handle it.
		}
	};

	// Input focus handler
	const handleInputFocus = () => {
		// Open if there's text or if there are options to show.
		// This allows opening the dropdown even if the input is empty but options exist.
		if (value.length > 0 || options.length > 0) {
			setIsOpen(true);
		}
	};

	// Input keydown handler
	const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		// Use imported type
		if (event.key === 'Escape') {
			setIsOpen(false);
		} else if (
			!isOpen &&
			(event.key === 'ArrowDown' || event.key === 'ArrowUp') &&
			options.length > 0
		) {
			setIsOpen(true); // Open dropdown on arrow keys if closed and options exist
		}
		// Let CMDK handle Enter, ArrowUp, ArrowDown when popover is open
	};

	// No longer using this static placeholder, `filteredOptions` is now state.
	// const filteredOptions = options;

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger asChild className={cn('w-full', className)}>
				{/* The div wrapper for PopoverTrigger helps manage width and relative positioning if needed */}
				<div className="w-full">
					<Input
						aria-autocomplete="list"
						aria-controls="autocomplete-list" // ID for CommandList
						aria-expanded={isOpen}
						className={cn('w-full', inputClassName)}
						disabled={disabled}
						onChange={handleInputChange}
						onFocus={handleInputFocus}
						onKeyDown={handleInputKeyDown}
						placeholder={placeholder}
						ref={internalInputRef}
						role="combobox"
						type="text"
						value={value} // Controlled by the `value` prop
						{...restInputProps} // Spread remaining input props
					/>
				</div>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="w-[--radix-popover-trigger-width] p-0"
				// Prevent focus from being stolen from the input when the popover opens.
				onOpenAutoFocus={(e) => e.preventDefault()}
				side="bottom"
				// Optional: handle Escape key at PopoverContent level if needed, though Input handler might be enough
				// onEscapeKeyDown={() => setIsOpen(false)}
			>
				<Command
					// We will implement our own filtering based on the `value` prop.
					// `cmdk`'s internal filtering is not used here.
					shouldFilter={false}
				>
					<CommandList id="autocomplete-list">
						<CommandEmpty>No results found.</CommandEmpty>
						<ScrollArea
							// Set a sensible default max height for the scrollable area.
							// This could be made a prop if more flexibility is needed.
							style={{ maxHeight: '300px' }}
							type="auto" // Show scrollbar only when needed
						>
							<CommandGroup>
								{filteredOptions.map((option) => (
									<CommandItem
										key={option.id}
										onSelect={() => {
											onValueChange(option.label);
											onOptionSelect?.(option);
											setIsOpen(false);
											// Ensure the input is focused after selection for a smoother experience
											// Using a timeout to ensure focus happens after popover closes and re-renders.
											setTimeout(() => {
												internalInputRef.current?.focus();
											}, 0);
										}}
										value={option.label} // For CMDK's internal logic + accessibility
									>
										{renderOption ? renderOption(option) : option.label}
										<Check
											className={cn(
												'ml-auto h-4 w-4',
												value === option.label ? 'opacity-100' : 'opacity-0',
											)}
										/>
									</CommandItem>
								))}
							</CommandGroup>
						</ScrollArea>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

const ForwardedAutocomplete = forwardRef(Autocomplete) as <
	// Use imported function
	T extends { id: string; label: string },
>(
	props: AutocompleteProps<T> & { ref?: ForwardedRef<HTMLInputElement> }, // Use imported type
) => ReturnType<typeof Autocomplete>;

export { ForwardedAutocomplete as Autocomplete };
