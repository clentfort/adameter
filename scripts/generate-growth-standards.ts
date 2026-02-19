/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import { readFile, utils } from 'xlsx';

/**
 * This script downloads the WHO growth standard XLSX files and converts them to JSON.
 *
 * It supports Weight-for-age, Length/height-for-age, and Head circumference-for-age (0-5 years).
 *
 * Usage:
 * npx tsx scripts/generate-growth-standards.ts --download
 */

const outputDir = path.join(process.cwd(), 'src/data/growth-standards');
const rawDir = path.join(outputDir, 'raw');

if (!fs.existsSync(rawDir)) {
	fs.mkdirSync(rawDir, { recursive: true });
}

const indicators = [
	{
		filename: 'wfa-boys-0-5.json',
		name: 'Weight-for-age (Boys)',
		raw: 'wfa-boys-0-5.xlsx',
		url: 'https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-age/expanded-tables/wfa-boys-zscore-expanded-tables.xlsx?sfvrsn=65cce121_10',
	},
	{
		filename: 'wfa-girls-0-5.json',
		name: 'Weight-for-age (Girls)',
		raw: 'wfa-girls-0-5.xlsx',
		url: 'https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-age/expanded-tables/wfa-girls-zscore-expanded-tables.xlsx?sfvrsn=f01bc813_10',
	},
	{
		filename: 'lhfa-boys-0-5.json',
		name: 'Length/height-for-age (Boys)',
		raw: 'lhfa-boys-0-5.xlsx',
		url: 'https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/length-height-for-age/expandable-tables/lhfa-boys-zscore-expanded-tables.xlsx?sfvrsn=7b4a3428_12',
	},
	{
		filename: 'lhfa-girls-0-5.json',
		name: 'Length/height-for-age (Girls)',
		raw: 'lhfa-girls-0-5.xlsx',
		url: 'https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/length-height-for-age/expandable-tables/lhfa-girls-zscore-expanded-tables.xlsx?sfvrsn=27f1e2cb_10',
	},
	{
		filename: 'hcfa-boys-0-5.json',
		name: 'Head circumference-for-age (Boys)',
		raw: 'hcfa-boys-0-5.xlsx',
		url: 'https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/head-circumference-for-age/expanded-tables/hcfa-boys-zscore-expanded-tables.xlsx?sfvrsn=2ab1bec8_8',
	},
	{
		filename: 'hcfa-girls-0-5.json',
		name: 'Head circumference-for-age (Girls)',
		raw: 'hcfa-girls-0-5.xlsx',
		url: 'https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/head-circumference-for-age/expanded-tables/hcfa-girls-zscore-expanded-tables.xlsx?sfvrsn=3a34b8b0_8',
	},
];

async function downloadFile(url: string, outputPath: string) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download ${url}: ${response.statusText}`);
	}
	const buffer = await response.arrayBuffer();
	fs.writeFileSync(outputPath, Buffer.from(buffer));
}

function processXlsx(inputPath: string, outputPath: string) {
	const workbook = readFile(inputPath);
	const sheetName = workbook.SheetNames[0];
	const sheet = workbook.Sheets[sheetName];
	const data = utils.sheet_to_json(sheet) as Record<
		string,
		string | number | undefined
	>[];

	const result = data
		.map((row) => {
			const age = row.Day ?? row.Age ?? row.Days;
			if (age === undefined) return null;

			return {
				age: Number.parseFloat(String(age)),
				L: Number.parseFloat(String(row.L)),
				M: Number.parseFloat(String(row.M)),
				S: Number.parseFloat(String(row.S)),
			};
		})
		.filter((row) => row !== null && !Number.isNaN(row.age));

	fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
}

async function main() {
	const arg = process.argv[2];

	if (arg === '--download') {
		console.log('Starting download and conversion of WHO growth standards...');
		for (const indicator of indicators) {
			const rawPath = path.join(rawDir, indicator.raw);
			const jsonPath = path.join(outputDir, indicator.filename);

			try {
				console.log(`Downloading ${indicator.name}...`);
				await downloadFile(indicator.url, rawPath);
				console.log(`Converting ${indicator.raw} to JSON...`);
				processXlsx(rawPath, jsonPath);
				console.log(`Successfully processed ${indicator.name}`);
			} catch (error_) {
				console.error(`Error processing ${indicator.name}:`, error_);
			}
		}
	} else if (arg === '--convert-local') {
		console.log('Converting local XLSX files to JSON...');
		for (const indicator of indicators) {
			const rawPath = path.join(rawDir, indicator.raw);
			const jsonPath = path.join(outputDir, indicator.filename);

			if (fs.existsSync(rawPath)) {
				try {
					processXlsx(rawPath, jsonPath);
					console.log(`Successfully processed ${indicator.name}`);
				} catch (error_) {
					console.error(`Error processing ${indicator.name}:`, error_);
				}
			} else {
				console.warn(
					`Skipping ${indicator.name}: Raw file not found at ${rawPath}`,
				);
			}
		}
	} else {
		console.log('Usage:');
		console.log(
			'  pnpm exec tsx scripts/generate-growth-standards.ts --download      Download from WHO and convert',
		);
		console.log(
			'  pnpm exec tsx scripts/generate-growth-standards.ts --convert-local  Convert existing XLSX in raw/ directory',
		);
	}
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((error_) => {
	console.error('Unhandled error:', error_);
	process.exit(1);
});
