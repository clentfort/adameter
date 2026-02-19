/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';

/**
 * This script generates or downloads the WHO growth standard JSON files.
 *
 * Official WHO Toolkit pages (Excel format):
 * - Weight-for-age: https://www.who.int/toolkits/child-growth-standards/standards/weight-for-age
 * - Length/height-for-age: https://www.who.int/toolkits/child-growth-standards/standards/length-height-for-age
 * - Head circumference-for-age: https://www.who.int/toolkits/child-growth-standards/standards/head-circumference-for-age
 *
 * Usage:
 * 1. To download data from a mirror (easiest):
 *    npx tsx scripts/generate-growth-standards.ts --download
 *
 * 2. To process local TXT files:
 *    npx tsx scripts/generate-growth-standards.ts /path/to/txt/files
 */

const outputDir = path.join(process.cwd(), 'src/data/growth-standards');

const MIRROR_BASE_URL =
	'https://raw.githubusercontent.com/clentfort/pediatric-growth/main/data/who';

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
				.map((row) => {
					const r = row as string[];
					return {
						age: Number.parseFloat(r[ageIdx]),
						L: Number.parseFloat(r[lIdx]),
						M: Number.parseFloat(r[mIdx]),
						S: Number.parseFloat(r[sIdx]),
					};
				})
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

async function downloadAndProcess() {
	console.log('Downloading growth standards from mirror...');
	for (const { output } of filesToProcess) {
		const url = `${MIRROR_BASE_URL}/${output}`;
		const outputPath = path.join(outputDir, output);

		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const data = await response.json();
			fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
			console.log(`Downloaded and saved ${output}`);
		} catch (error_) {
			console.error(`Failed to download ${output}:`, error_);
		}
	}
}

const arg = process.argv[2];

if (arg === '--download') {
	await downloadAndProcess();
} else if (arg) {
	for (const { input, output } of filesToProcess) {
		const inputPath = path.join(arg, input);
		const outputPath = path.join(outputDir, output);

		if (fs.existsSync(inputPath)) {
			processFile(inputPath, outputPath);
		} else {
			console.warn(`Skipping ${input}: File not found in ${arg}`);
		}
	}
} else {
	console.error(
		'Please provide an input directory containing the TXT files or use --download flag.',
	);
	process.exit(1);
}
