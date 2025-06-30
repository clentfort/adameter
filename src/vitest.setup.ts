import '@testing-library/jest-dom/vitest';
import { IntlVariations, setupFbtee } from 'fbtee';

const viewerContext = {
	GENDER: IntlVariations.GENDER_UNKNOWN,
	locale: 'en_US',
};
setupFbtee({
	hooks: { getViewerContext: () => viewerContext },
	translations: {},
});

import { vi } from 'vitest';

// Mock HTMLCanvasElement.prototype.getContext for Chart.js tests in JSDOM
if (typeof HTMLCanvasElement !== 'undefined') {
	HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
		fillRect: vi.fn(),
		clearRect: vi.fn(),
		getImageData: vi.fn((x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) })),
		putImageData: vi.fn(),
		createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(0) })),
		setTransform: vi.fn(),
		drawImage: vi.fn(),
		save: vi.fn(),
		fillText: vi.fn(),
		restore: vi.fn(),
		beginPath: vi.fn(),
		moveTo: vi.fn(),
		lineTo: vi.fn(),
		closePath: vi.fn(),
		stroke: vi.fn(),
		translate: vi.fn(),
		scale: vi.fn(),
		rotate: vi.fn(),
		arc: vi.fn(),
		fill: vi.fn(),
		measureText: vi.fn(() => ({ width: 0 })),
		transform: vi.fn(),
		rect: vi.fn(),
		clip: vi.fn(),
		setLineDash: vi.fn(),
		// Add any other 2D context methods your tests might indirectly trigger
	})) as unknown as () => CanvasRenderingContext2D | null;
}
