
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const createZip = (files: { name: string; content: string }[]) => {
	const zip = new JSZip();
	for (const file of files) {
		zip.file(file.name, file.content);
	}
	return zip.generateAsync({ type: 'blob' });
};

export const downloadZip = (blob: Blob) => {
	saveAs(blob, 'adameter-export.zip');
};

export const extractFiles = async (file: File) => {
	const zip = await JSZip.loadAsync(file);
	const files = [];
	for (const [name, file] of Object.entries(zip.files)) {
		if (!file.dir) {
			files.push({
				name: name.replace('.csv', ''),
				content: await file.async('string'),
			});
		}
	}
	return files;
};
