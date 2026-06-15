import { describe, expect, it, vi } from 'vitest';
import { saveAs } from 'file-saver';
import { createZip, downloadZip, extractFiles } from './zip';

vi.mock('file-saver', () => ({
	saveAs: vi.fn(),
}));

describe('zip utilities', () => {
	it('round-trips files through createZip and extractFiles', async () => {
		const mockFiles = [
			{ content: 'id,name\n1,Ada', name: 'profiles.csv' },
			{ content: 'id,date\n1,2026-01-01', name: 'feeding.csv' },
		];

		const blob = await createZip(mockFiles);
		expect(blob).toBeInstanceOf(Blob);

		// Convert Blob to File for extractFiles
		const file = new File([blob], 'test.zip', { type: 'application/zip' });
		const extracted = await extractFiles(file);

		// extractFiles removes .csv suffix from names
		expect(extracted).toEqual([
			{ content: 'id,name\n1,Ada', name: 'profiles' },
			{ content: 'id,date\n1,2026-01-01', name: 'feeding' },
		]);
	});

	it('skips directories in extractFiles', async () => {
		const mockFiles = [
			{ content: 'id,name\n1,Ada', name: 'profiles.csv' },
		];

		const blob = await createZip(mockFiles);
		const zip = await import('jszip').then((m) => new m.default());
		await zip.loadAsync(blob);
		zip.folder('test-dir');
		const blobWithDir = await zip.generateAsync({ type: 'blob' });

		const file = new File([blobWithDir], 'test.zip', { type: 'application/zip' });
		const extracted = await extractFiles(file);

		expect(extracted).toEqual([
			{ content: 'id,name\n1,Ada', name: 'profiles' },
		]);
	});

	it('calls saveAs in downloadZip', () => {
		const blob = new Blob(['test'], { type: 'text/plain' });
		downloadZip(blob);
		expect(saveAs).toHaveBeenCalledWith(blob, 'adameter-export.zip');
	});
});
