import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TinyBaseTestWrapper } from '@/test-utils/tinybase-test-wrapper';
import DiaperStats from './diaper-stats';

// Mock the hook to provide predictable values
vi.mock('@/hooks/use-today-diaper-stats', () => ({
	useTodayDiaperStats: () => ({ stoolCount: 2, urineCount: 5 }),
}));

describe('DiaperStats', () => {
	it('should render today counts', () => {
		render(<DiaperStats />, { wrapper: TinyBaseTestWrapper });

		expect(screen.getByText('5')).toBeDefined();
		expect(screen.getByText('2')).toBeDefined();
		expect(screen.getByText('Diapers Today')).toBeDefined();
	});
});
