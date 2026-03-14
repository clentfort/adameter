/**
 * Lightweight migration manifest for startup fast-path checks.
 *
 * Keep this list in execution order (must match the `migrations` array in
 * index.ts). A rename/transform migration that touches a field must appear
 * **before** any schema-normalising migration that would strip unknown fields.
 */
export const MIGRATION_IDS = [
	'2026-03-01-rename-diaper-abnormalities-to-notes',
	'2026-03-24-rename-event-description-to-notes',
	'2026-03-07-remove-legacy-json-cells',
	'2026-03-07-normalize-diaper-store-rows',
	'2026-03-07-normalize-entity-store-rows',
	'2026-03-15-cleanup-junk-data',
] as const;
