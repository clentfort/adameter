
import JSZip from 'jszip';

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
