import { describe, it, expect, beforeEach } from 'vitest';
import { Doc } from 'yjs';
import { hasData } from './yjs-utils';

describe('yjs-utils', () => {
	let doc: Doc;

	beforeEach(() => {
		doc = new Doc();
	});

	it('should return false for hasData when doc is empty', () => {
		expect(hasData(doc)).toBe(false);
	});

	it('should return true for hasData when an array is not empty', () => {
		doc.getArray('diaper-changes-dec').push(['data']);
		expect(hasData(doc)).toBe(true);
	});

	it('should return true for hasData when a map is not empty', () => {
		doc.getMap('feeding-in-progress-dec').set('current', { type: 'left' });
		expect(hasData(doc)).toBe(true);
	});

});
