/**
 * Lightweight migration manifest for startup fast-path checks.
 *
 * Keep this list in chronological order and append-only.
 */
export const MIGRATION_IDS = [
	'2026-03-01-rename-diaper-abnormalities-to-notes',
	'2026-03-07-remove-legacy-json-cells',
	'2026-03-07-normalize-diaper-store-rows',
	'2026-03-07-normalize-entity-store-rows',
	'2026-03-15-cleanup-junk-data',
] as const;

export const LATEST_MIGRATION_ID =
	MIGRATION_IDS.length > 0 ? MIGRATION_IDS.at(-1) : undefined;
