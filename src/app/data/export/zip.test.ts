
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createZip, downloadZip } from './zip';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

vi.mock('file-saver', () => ({
	saveAs: vi.fn(),
}));

const mockZip = {
	file: vi.fn(),
	generateAsync: vi.fn().mockResolvedValue('zip-blob'),
};

vi.mock('jszip', () => {
	return {
		default: vi.fn().mockImplementation(() => mockZip),
	};
});

describe('Export Zip', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('createZip', () => {
		it('should create a zip file', async () => {
			const files = [
				{ name: 'test1.csv', content: 'csv-string-1' },
				{ name: 'test2.csv', content: 'csv-string-2' },
			];

			const zipBlob = await createZip(files);

			expect(mockZip.file).toHaveBeenCalledTimes(2);
			expect(mockZip.file).toHaveBeenCalledWith('test1.csv', 'csv-string-1');
			expect(mockZip.file).toHaveBeenCalledWith('test2.csv', 'csv-string-2');
			expect(mockZip.generateAsync).toHaveBeenCalledWith({ type: 'blob' });
			expect(zipBlob).toBe('zip-blob');
		});
	});

	describe('downloadZip', () => {
		it('should download a zip file', () => {
			const blob = new Blob();
			downloadZip(blob);
			expect(saveAs).toHaveBeenCalledWith(blob, 'adameter-export.zip');
		});
	});
});
