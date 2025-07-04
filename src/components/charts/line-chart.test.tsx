import { render, screen, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest';
import LineChart from './line-chart';

const { mockChart, mockDestroy } = vi.hoisted(() => {
  const mockDestroyFn = vi.fn();
  const mockChartInstance = {
    data: { datasets: [], labels: [] },
    destroy: mockDestroyFn,
    options: {},
    update: vi.fn(),
  };
  return { mockChart: vi.fn(() => mockChartInstance), mockDestroy: mockDestroyFn };
});

vi.mock('chart.js/auto', () => ({
  default: mockChart,
}));

vi.mock('chartjs-adapter-date-fns', () => ({}));

describe('LineChart', () => {
  let mockCanvasContext: CanvasRenderingContext2D;

  beforeEach(() => {
    mockCanvasContext = {} as unknown as CanvasRenderingContext2D;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext as any);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render and initialize chart with minimal props', () => {
    const mockData = [{ x: new Date(), y: 10 }];
    render(
      <LineChart
        data={mockData}
        datasetLabel="Test Dataset"
        emptyStateMessage="No data"
        title="Test Chart"
        xAxisLabel="Time"
        yAxisLabel="Value"
      />,
    );

    expect(screen.getByRole('graphics-document')).toBeInTheDocument();
    expect(mockChart).toHaveBeenCalledTimes(1);
    expect(mockChart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        data: expect.objectContaining({
          datasets: expect.arrayContaining([
            expect.objectContaining({
              data: mockData,
              label: 'Test Dataset',
            }),
          ]),
        }),
        options: expect.objectContaining({
          scales: expect.objectContaining({
            x: expect.objectContaining({
              title: expect.objectContaining({ text: 'Time' }),
            }),
            y: expect.objectContaining({
              title: expect.objectContaining({ text: 'Value' }),
            }),
          }),
        }),
        type: 'line',
      }),
    );
  });

  it('should destroy chart instance on unmount', () => {
    const mockData = [{ x: new Date(), y: 10 }];
    const { unmount } = render(
      <LineChart
        data={mockData}
        datasetLabel="Test Dataset"
        emptyStateMessage="No data"
        title="Test Chart"
        xAxisLabel="Time"
        yAxisLabel="Value"
      />,
    );

    expect(mockChart).toHaveBeenCalledTimes(1);
    unmount();
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it('should display empty state message when no data is provided', () => {
    render(
      <LineChart
        data={[]}
        datasetLabel="Test Dataset"
        emptyStateMessage="No data to display"
        title="Test Chart"
        xAxisLabel="Time"
        yAxisLabel="Value"
      />,
    );

    expect(screen.getByText('No data to display')).toBeInTheDocument();
    expect(mockChart).not.toHaveBeenCalled();
  });
});
