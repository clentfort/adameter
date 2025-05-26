import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HistoryList from './feeding-history-list';
import type { FeedingSession } from '@/types/feeding';

describe('FeedingHistoryList', () => {
  it('should render a feeding session shorter than one hour correctly', () => {
    const mockSession: FeedingSession = {
      id: 'test-session-1',
      startTime: '2023-01-01T10:00:00Z',
      endTime: '2023-01-01T10:25:00Z', // 25 minutes duration
      breast: 'left',
      notes: null,
    };

    render(
      <HistoryList
        sessions={[mockSession]}
        onSessionDelete={() => {}}
        onSessionUpdate={() => {}}
      />
    );

    // Assert duration is formatted correctly
    expect(screen.getByText('25:00')).toBeInTheDocument();

    // Assert breast side is displayed correctly
    expect(screen.getByText('Left Breast')).toBeInTheDocument();
  });

  it('should render a feeding session longer than one hour correctly', () => {
    const mockSessionLong: FeedingSession = {
      id: 'test-session-2',
      startTime: '2023-01-01T12:00:00Z',
      endTime: '2023-01-01T13:10:00Z', // 1 hour and 10 minutes duration
      breast: 'right',
      notes: 'A long session',
    };

    render(
      <HistoryList
        sessions={[mockSessionLong]}
        onSessionDelete={() => {}}
        onSessionUpdate={() => {}}
      />
    );

    // Assert duration is formatted correctly
    expect(screen.getByText('70:00')).toBeInTheDocument();

    // Assert breast side is displayed correctly
    expect(screen.getByText('Right Breast')).toBeInTheDocument();
  });
});
