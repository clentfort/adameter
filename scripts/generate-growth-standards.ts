import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';

/**
 * This script generates the WHO growth standard JSON files from TXT files.
 * You can download the TXT files from the WHO website:
 * https://www.who.int/toolkits/child-growth-standards/standards
 *
 * Usage:
 * 1. Download the TXT files (e.g. wfa-boys-0-5-zscores.txt)
 * 2. Place them in a temporary directory.
 * 3. Run: npx tsx scripts/generate-growth-standards.ts /path/to/txt/files
 */

const outputDir = path.join(process.cwd(), 'src/data/growth-standards');

const filesToProcess = [
	// Weight for age
	{ input: 'lhfa-boys-0-5.txt', output: 'lhfa-boys-0-5.json' },
	{ input: 'lhfa-girls-0-5.txt', output: 'lhfa-girls-0-5.json' },
	{ input: 'wfa-boys-0-5.txt', output: 'wfa-boys-0-5.json' },
	{ input: 'wfa-girls-0-5.txt', output: 'wfa-girls-0-5.json' },
	{ input: 'hcfa-boys-0-5.txt', output: 'hcfa-boys-0-5.json' },
	{ input: 'hcfa-girls-0-5.txt', output: 'hcfa-girls-0-5.json' },
	// 5-19 years
	{ input: 'hfa-boys-5-19.txt', output: 'hfa-boys-5-19.json' },
	{ input: 'hfa-girls-5-19.txt', output: 'hfa-girls-5-19.json' },
	{ input: 'wfa-boys-5-10.txt', output: 'wfa-boys-5-10.json' },
	{ input: 'wfa-girls-5-10.txt', output: 'wfa-girls-5-10.json' },
];

function processFile(inputPath: string, outputPath: string) {
	const content = fs.readFileSync(inputPath, 'utf8');

	Papa.parse(content, {
		complete: (results) => {
			const headers = results.data[0] as string[];
			const ageIdx = headers.indexOf('Age');
			const lIdx = headers.indexOf('L');
			const mIdx = headers.indexOf('M');
			const sIdx = headers.indexOf('S');

			if (ageIdx === -1 || lIdx === -1 || mIdx === -1 || sIdx === -1) {
				console.error(`Invalid headers in ${inputPath}`);
				return;
			}

			const data = results.data
				.slice(1)
				.map((row: any) => ({
					age: Number.parseFloat(row[ageIdx]),
					L: Number.parseFloat(row[lIdx]),
					M: Number.parseFloat(row[mIdx]),
					S: Number.parseFloat(row[sIdx]),
				}))
				.filter((row) => !Number.isNaN(row.age));

			fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
			console.log(`Generated ${outputPath}`);
		},
		delimiter: '\t',
		header: false,
	});
}

const inputDir = process.argv[2];
if (!inputDir) {
	console.error('Please provide an input directory containing the TXT files.');
	process.exit(1);
}

for (const { input, output } of filesToProcess) {
	const inputPath = path.join(inputDir, input);
	const outputPath = path.join(outputDir, output);

	if (fs.existsSync(inputPath)) {
		processFile(inputPath, outputPath);
	} else {
		console.warn(`Skipping ${input}: File not found`);
	}
}
