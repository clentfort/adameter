"use client";

import * as React from "react";
import { Check } from "lucide-react"; // Import Check icon

import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  // CommandInput, // Not using the inner CommandInput as per requirements
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface AutocompleteProps<T extends { id: string; label: string }>
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "onSelect" // Omit conflicting HTMLInputAttributes
  > {
  options: T[];
  onValueChange: (value: string) => void;
  onOptionSelect?: (option: T) => void;
  value: string;
  placeholder?: string;
  renderOption?: (option: T) => React.ReactNode;
  inputClassName?: string;
}

function Autocomplete<T extends { id: string; label: string }>(
  {
    options,
    onValueChange,
    onOptionSelect,
    value,
    placeholder,
    renderOption,
    className, // This className is for the PopoverTrigger container
    inputClassName,
    disabled,
    ...restInputProps // Capture other standard input props
  }: AutocompleteProps<T>,
  ref: React.ForwardedRef<HTMLInputElement>
) {
  const [isOpen, setIsOpen] = React.useState(false);
  const internalInputRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => internalInputRef.current!);

  const [filteredOptions, setFilteredOptions] = React.useState<T[]>(options);

  // Effect to update filteredOptions when `options` or `value` props change.
  React.useEffect(() => {
    if (!value) {
      // If input is empty, show all options or keep it empty based on desired UX.
      // For now, showing all options. Could also be `setFilteredOptions([])`
      // if we only want to show options after typing.
      // Based on typical autocomplete behavior, showing all when empty (if dropdown is open) is fine,
      // or showing none if dropdown only opens on typing.
      // Since our dropdown can open on focus even with empty input, showing all is reasonable.
      setFilteredOptions(options);
    } else {
      const lowercasedValue = value.toLowerCase();
      setFilteredOptions(
        options.filter(option =>
          option.label.toLowerCase().includes(lowercasedValue)
        )
      );
    }
  }, [value, options]);


  // Input change handler
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
    } else if (
      !isOpen &&
      (event.key === "ArrowDown" || event.key === "ArrowUp") &&
      options.length > 0
    ) {
      setIsOpen(true); // Open dropdown on arrow keys if closed and options exist
    }
    // Let CMDK handle Enter, ArrowUp, ArrowDown when popover is open
  };

  // No longer using this static placeholder, `filteredOptions` is now state.
  // const filteredOptions = options;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild className={cn("w-full", className)}>
        {/* The div wrapper for PopoverTrigger helps manage width and relative positioning if needed */}
        <div className="w-full">
          <Input
            ref={internalInputRef}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls="autocomplete-list" // ID for CommandList
            aria-autocomplete="list"
            placeholder={placeholder}
            value={value} // Controlled by the `value` prop
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            disabled={disabled}
            className={cn("w-full", inputClassName)}
            {...restInputProps} // Spread remaining input props
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        side="bottom"
        align="start"
        // Prevent focus from being stolen from the input when the popover opens.
        onOpenAutoFocus={(e) => e.preventDefault()}
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
              style={{ maxHeight: "300px" }}
              type="auto" // Show scrollbar only when needed
            >
              <CommandGroup>
                                {filteredOptions.map((option) => (
                                  <CommandItem
                                    key={option.id}
                                    value={option.label} // For CMDK's internal logic + accessibility
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
                                  >
                                    {renderOption ? renderOption(option) : option.label}
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        value === option.label ? "opacity-100" : "opacity-0"
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

const ForwardedAutocomplete = React.forwardRef(Autocomplete) as <
  T extends { id: string; label: string }
>(
  props: AutocompleteProps<T> & { ref?: React.ForwardedRef<HTMLInputElement> }
) => ReturnType<typeof Autocomplete>;

export { ForwardedAutocomplete as Autocomplete };
