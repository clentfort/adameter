import { describe, it, expect, beforeEach } from 'vitest';
import { Doc } from 'yjs';
import { clearDoc, hasData, SHARED_TYPES } from './yjs-utils';

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
		doc.getMap('feeding-in-progress-dec').set('key', 'value');
		expect(hasData(doc)).toBe(true);
	});

	it('should clear all shared types with clearDoc', () => {
		doc.getArray('diaper-changes-dec').push(['data']);
		doc.getMap('feeding-in-progress-dec').set('key', 'value');
		expect(hasData(doc)).toBe(true);

		clearDoc(doc);

		expect(hasData(doc)).toBe(false);
		expect(doc.getArray('diaper-changes-dec').length).toBe(0);
		expect(doc.getMap('feeding-in-progress-dec').size).toBe(0);
	});
});
