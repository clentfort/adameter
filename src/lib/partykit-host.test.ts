import { describe, expect, it } from 'vitest';
import {
	getPartykitHostFromEnv,
	LEGACY_PREVIEW_PARTYKIT_HOST,
	LEGACY_PRODUCTION_PARTYKIT_HOST,
	PREVIEW_PARTYKIT_HOST,
	PRODUCTION_PARTYKIT_HOST,
	resolveLegacyPartykitHost,
	resolvePartykitHost,
} from './partykit-host';

describe('resolvePartykitHost', () => {
	it('returns the Cloudflare production host by default', () => {
		expect(resolvePartykitHost()).toBe('adameter-party.adameter.workers.dev');
	});

	it('returns the shared Cloudflare preview host on Vercel previews', () => {
		expect(resolvePartykitHost({ vercelEnv: 'preview' })).toBe(
			'adameter-party-preview.adameter.workers.dev',
		);
	});

	it('normalizes explicit host values', () => {
		expect(
			resolvePartykitHost({
				explicitHost: 'https://custom.adameter.example/',
			}),
		).toBe('custom.adameter.example');
	});

	it('reads the host from the environment', () => {
		expect(
			getPartykitHostFromEnv({
				NEXT_PUBLIC_PARTYKIT_HOST: 'env.example.com',
			} as unknown as NodeJS.ProcessEnv),
		).toBe('env.example.com');
		expect(
			getPartykitHostFromEnv({
				VERCEL_ENV: 'preview',
			} as unknown as NodeJS.ProcessEnv),
		).toBe(PREVIEW_PARTYKIT_HOST);
	});
});

describe('resolveLegacyPartykitHost', () => {
	it('maps Cloudflare hosts to their managed PartyKit predecessors', () => {
		expect(resolveLegacyPartykitHost(PRODUCTION_PARTYKIT_HOST)).toBe(
			LEGACY_PRODUCTION_PARTYKIT_HOST,
		);
		expect(resolveLegacyPartykitHost(PREVIEW_PARTYKIT_HOST)).toBe(
			LEGACY_PREVIEW_PARTYKIT_HOST,
		);
	});

	it('has no legacy host for local or custom hosts', () => {
		expect(resolveLegacyPartykitHost('localhost:1999')).toBeUndefined();
	});

	it('prefers an explicit legacy host', () => {
		expect(
			resolveLegacyPartykitHost('localhost:1999', 'https://legacy.example/'),
		).toBe('legacy.example');
	});
});
