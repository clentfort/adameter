import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Repository } from './repository';

interface TestItem {
	id: string;
	value: string;
}

describe('Repository', () => {
	const localStorageKey = 'repositoryData';
	const repository = new Repository<TestItem>(localStorageKey);

	beforeEach(() => {
		localStorage.clear(); // Clear localStorage before each test
	});

	describe('getAll', () => {
		it('gets all items from local storage', () => {
			const items = [
				{ id: '1', value: 'Item 1' },
				{ id: '2', value: 'Item 2' },
			];
			localStorage.setItem(localStorageKey, JSON.stringify(items));

			const result = repository.getAll();
			expect(result).toEqual(items);
		});

		it('returns an empty array if local storage is empty', () => {
			const result = repository.getAll();
			expect(result).toEqual([]);
		});

		it('logs an error if local storage is corrupted', () => {
			localStorage.setItem(localStorageKey, '[{ corrupted: true]');
			const consoleErrorSpy = vi
				.spyOn(console, 'error')
				.mockImplementation(() => {});
			repository.getAll();
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				expect.stringContaining('Failed to parse items from localStorage'),
				expect.any(Error),
			);
			consoleErrorSpy.mockRestore();
		});
	});

	describe('getById', () => {
		it('gets an item by ID from local storage', () => {
			const items = [
				{ id: '1', value: 'Item 1' },
				{ id: '2', value: 'Item 2' },
			];
			localStorage.setItem(localStorageKey, JSON.stringify(items));

			const result = repository.getById('1');
			expect(result).toEqual(items[0]);
		});
	});

	describe('insertAtFront', () => {
		it('inserts an item at the front of the list', () => {
			const items = [
				{ id: '1', value: 'Item 1' },
				{ id: '2', value: 'Item 2' },
			];
			localStorage.setItem(localStorageKey, JSON.stringify(items));

			const newItem = { id: '3', value: 'Item 3' };
			repository.insertAtFront(newItem);

			const result = repository.getAll();
			expect(result).toEqual([newItem, ...items]);
		});
	});

	describe('updateById', () => {
		it('updates an item by ID', () => {
			const items = [
				{ id: '1', value: 'Item 1' },
				{ id: '2', value: 'Item 2' },
			];
			localStorage.setItem(localStorageKey, JSON.stringify(items));

			const updatedItem = { id: '1', value: 'Updated Item 1' };
			repository.updateById('1', updatedItem);

			const result = repository.getAll();
			expect(result).toEqual([updatedItem, items[1]]);
		});

		it('logs an error if the item to update is not found', () => {
			const items = [
				{ id: '1', value: 'Item 1' },
				{ id: '2', value: 'Item 2' },
			];
			localStorage.setItem(localStorageKey, JSON.stringify(items));
			const consoleErrorSpy = vi
				.spyOn(console, 'error')
				.mockImplementation(() => {});
			const updatedItem = { id: '3', value: 'Updated Item 3' };
			repository.updateById('3', updatedItem);
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Failed to update item: 3 not found',
			);
			consoleErrorSpy.mockRestore();
		});
	});

	describe('removeById', () => {
		it('removes an item by ID', () => {
			const items = [
				{ id: '1', value: 'Item 1' },
				{ id: '2', value: 'Item 2' },
			];
			localStorage.setItem(localStorageKey, JSON.stringify(items));

			repository.removeById('1');

			const result = repository.getAll();
			expect(result).toEqual([items[1]]);
		});
	});
});
