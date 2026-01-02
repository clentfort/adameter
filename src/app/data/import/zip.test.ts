
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { extractFiles } from './zip';
import JSZip from 'jszip';

vi.mock('jszip', () => {
	return {
		default: {
			loadAsync: vi.fn(),
		},
	};
});

describe('Import Zip', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('extractFiles', () => {
		it('should extract files from a zip file', async () => {
			const mockZip = {
				files: {
					'test1.csv': {
						async: vi.fn().mockResolvedValue('csv-string-1'),
					},
					'test2.csv': {
						async: vi.fn().mockResolvedValue('csv-string-2'),
					},
				},
			};
			(JSZip.loadAsync as any).mockResolvedValue(mockZip);

			const file = new File([''], 'test.zip');
			const files = await extractFiles(file);

			expect(files).toHaveLength(2);
			expect(files[0].name).toBe('test1');
			expect(files[0].content).toBe('csv-string-1');
		});
	});
});
