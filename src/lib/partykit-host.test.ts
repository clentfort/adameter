import { describe, expect, it } from 'vitest';
import { resolvePartykitHost } from './partykit-host';

describe('resolvePartykitHost', () => {
	it('returns production host by default', () => {
		expect(resolvePartykitHost()).toBe(
			'tristanmeter-party.clentfort.partykit.dev',
		);
	});

	it('returns per-PR preview host when vercelPrId is provided', () => {
		expect(
			resolvePartykitHost({
				vercelEnv: 'preview',
				vercelPrId: '123',
			}),
		).toBe('pr-123.tristanmeter-party.clentfort.partykit.dev');
	});

	it('returns per-branch preview host on vercel branch previews without PR ID', () => {
		expect(
			resolvePartykitHost({
				vercelEnv: 'preview',
				vercelGitCommitRef: 'feat/partykit-preview',
			}),
		).toBe(
			'branch-feat-partykit-preview.tristanmeter-party.clentfort.partykit.dev',
		);
	});

	it('sanitizes long branch names for preview hosts', () => {
		const host = resolvePartykitHost({
			vercelEnv: 'preview',
			vercelGitCommitRef:
				'feature/This Is a Very Very Long Branch Name __ With Symbols!!! and More',
		});

		expect(host).toMatch(
			/^branch-[\da-z-]+\.tristanmeter-party\.clentfort\.partykit\.dev$/,
		);
		expect(host.length).toBeLessThanOrEqual(110);
	});

	it('normalizes explicit host values', () => {
		expect(
			resolvePartykitHost({
				explicitHost: 'https://custom.tristanmeter.example/',
			}),
		).toBe('custom.tristanmeter.example');
	});
});
