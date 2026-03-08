import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HistoryEntryCard } from './history-entry-card';

describe('HistoryEntryCard', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders children and formatted time', () => {
		render(
			<HistoryEntryCard formattedTime="12:34">
				<p>Test content</p>
			</HistoryEntryCard>,
		);

		expect(screen.getByText('12:34')).toBeInTheDocument();
		expect(screen.getByText('Test content')).toBeInTheDocument();
	});

	it('renders title and formatted time as sub-heading', () => {
		render(
			<HistoryEntryCard formattedTime="12:34" title="Main Title">
				<p>Test content</p>
			</HistoryEntryCard>,
		);

		expect(screen.getByText('Main Title')).toBeInTheDocument();
		const timeElement = screen.getByText('12:34');
		expect(timeElement).toHaveClass('text-xs');
		expect(timeElement).toHaveClass('text-muted-foreground');
	});

	it('renders emoji when provided as string', () => {
		render(
			<HistoryEntryCard emoji="👶" formattedTime="12:34">
				<p>Test content</p>
			</HistoryEntryCard>,
		);

		expect(screen.getByText('👶')).toBeInTheDocument();
	});

	it('renders multiple emojis when provided as ReactNode', () => {
		render(
			<HistoryEntryCard
				emoji={
					<div>
						<span>👶</span>
						<span>🚽</span>
					</div>
				}
				formattedTime="12:34"
			>
				<p>Test content</p>
			</HistoryEntryCard>,
		);

		expect(screen.getByText('👶')).toBeInTheDocument();
		expect(screen.getByText('🚽')).toBeInTheDocument();
	});

	it('renders rightContent when provided', () => {
		render(
			<HistoryEntryCard formattedTime="12:34" rightContent={<b>15 Min</b>}>
				<p>Test content</p>
			</HistoryEntryCard>,
		);

		expect(screen.getByText('15 Min')).toBeInTheDocument();
		expect(screen.getByText('15 Min').tagName).toBe('B');
	});

	it('calls onEdit when edit button is clicked', () => {
		const onEdit = vi.fn();
		render(
			<HistoryEntryCard onEdit={onEdit}>
				<p>Test content</p>
			</HistoryEntryCard>,
		);

		const editButton = screen.getByRole('button', { name: /edit/i });
		fireEvent.click(editButton);

		expect(onEdit).toHaveBeenCalledTimes(1);
	});

	it('calls onDelete when delete button is clicked', () => {
		const onDelete = vi.fn();
		render(
			<HistoryEntryCard onDelete={onDelete}>
				<p>Test content</p>
			</HistoryEntryCard>,
		);

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		fireEvent.click(deleteButton);

		expect(onDelete).toHaveBeenCalledTimes(1);
	});

	it('applies variant styles correctly', () => {
		const { container } = render(
			<HistoryEntryCard variant="diaper">
				<p>Test content</p>
			</HistoryEntryCard>,
		);

		const card = container.firstChild as HTMLElement;
		expect(card).toHaveClass('border-amber-200');
		expect(card).toHaveClass('bg-amber-50/50');
	});

	it('applies border-border for event variant', () => {
		const { container } = render(
			<HistoryEntryCard variant="event">
				<p>Test content</p>
			</HistoryEntryCard>,
		);

		const card = container.firstChild as HTMLElement;
		expect(card).toHaveClass('border-border');
	});

	it('applies custom className and style', () => {
		const { container } = render(
			<HistoryEntryCard className="custom-class" style={{ opacity: 0.5 }}>
				<p>Test content</p>
			</HistoryEntryCard>,
		);

		const card = container.firstChild as HTMLElement;
		expect(card).toHaveClass('custom-class');
		expect(card.style.opacity).toBe('0.5');
	});

	it('sets data-testid when provided', () => {
		render(
			<HistoryEntryCard data-testid="test-card">
				<p>Test content</p>
			</HistoryEntryCard>,
		);

		expect(screen.getByTestId('test-card')).toBeInTheDocument();
	});
});
