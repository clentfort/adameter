import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Event } from '@/types/event';
import { useSortedEvents } from './useSortedEvents';

const mockEvents: Event[] = [
  {
    id: '1',
    date: '2024-05-20T10:00:00Z',
    title: 'Event 1', // Optional but provided
    type: 'point', // Optional but provided
  },
  {
    id: '2',
    date: '2024-05-20T12:00:00Z',
    title: 'Event 2', // Optional but provided
    type: 'point', // Optional but provided
  },
  {
    id: '3',
    date: '2024-05-19T15:00:00Z',
    title: 'Event 3', // Optional but provided
    type: 'point', // Optional but provided
  },
  {
    id: '4',
    date: '2024-05-20T09:00:00Z', // Unsorted event
    title: 'Event 4', // Optional but provided
    type: 'point', // Optional but provided
  },
  {
    id: '5',
    date: '2024-05-18T18:00:00Z',
    title: 'Event 5', // Optional but provided
    type: 'point', // Optional but provided
  },
];

describe('useSortedEvents', () => {
  it('should return an empty object for an empty array of events', () => {
    const { result } = renderHook(() => useSortedEvents([]));
    expect(result.current).toEqual({});
  });

  it('should group events by date and sort them correctly', () => {
    const { result } = renderHook(() => useSortedEvents(mockEvents));
    const sorted = result.current;

    // Check date keys
    expect(Object.keys(sorted)).toEqual([
      '2024-05-20',
      '2024-05-19',
      '2024-05-18',
    ]);

    // Check sorting within '2024-05-20'
    expect(sorted['2024-05-20'].map((e) => e.id)).toEqual(['2', '1', '4']);

    // Check '2024-05-19'
    expect(sorted['2024-05-19'].map((e) => e.id)).toEqual(['3']);

    // Check '2024-05-18'
    expect(sorted['2024-05-18'].map((e) => e.id)).toEqual(['5']);
  });

  it('should handle events already sorted', () => {
    const alreadySortedEvents: Event[] = [
      {
        id: '2',
        date: '2024-05-20T12:00:00Z',
        title: 'Event 2', // Optional but provided
        type: 'point', // Optional but provided
      },
      {
        id: '1',
        date: '2024-05-20T10:00:00Z',
        title: 'Event 1', // Optional but provided
        type: 'point', // Optional but provided
      },
      {
        id: '3',
        date: '2024-05-19T15:00:00Z',
        title: 'Event 3', // Optional but provided
        type: 'point', // Optional but provided
      },
    ];
    const { result } = renderHook(() => useSortedEvents(alreadySortedEvents));
    const sorted = result.current;

    expect(Object.keys(sorted)).toEqual(['2024-05-20', '2024-05-19']);
    expect(sorted['2024-05-20'].map((e) => e.id)).toEqual(['2', '1']);
    expect(sorted['2024-05-19'].map((e) => e.id)).toEqual(['3']);
  });

  it('should correctly format date keys', () => {
    const singleEvent: Event[] = [
      {
        id: '1',
        date: '2024-01-05T10:00:00Z',
        title: 'Event 1', // Optional but provided
        type: 'point', // Optional but provided
      },
    ];
    const { result } = renderHook(() => useSortedEvents(singleEvent));
    expect(Object.keys(result.current)).toEqual(['2024-01-05']);
  });
});
