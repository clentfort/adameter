import { saveAs } from 'file-saver';
import JSZip from 'jszip';

export const createZip = (files: { content: string; name: string }[]) => {
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
				content: await file.async('string'),
				name: name.replace('.csv', ''),
			});
		}
	}
	return files;
};
