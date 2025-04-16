import { compareDesc } from 'date-fns';

interface Item {
	id: string;
}

export class Repository<T extends Item> {
	#storageKey: string;

	constructor(storageKey: string) {
		this.#storageKey = storageKey;
	}

	/**
	 * Inserts an item at the front of the list in localStorage.
	 */
	insertAtFront(item: T): void {
		const items = this.#getAllMutable();
		items.unshift(item);
		localStorage.setItem(this.#storageKey, JSON.stringify(items));
	}

	removeById(id: string): void {
		const items = this.getAll();
		const updatedItems = items.filter((i) => i.id !== id);
		localStorage.setItem(this.#storageKey, JSON.stringify(updatedItems));
	}

	/**
	 * Updates an item in localStorage by its ID. Logs an error if the item is
	 * not found.
	 */
	updateById(id: string, updatedItem: T): void {
		const items = this.#getAllMutable();
		const index = items.findIndex((item) => item.id === id);
		if (index === -1) {
			console.error(`Failed to update item: ${id} not found`);
			return;
		}

		items[index] = updatedItem;
		localStorage.setItem(this.#storageKey, JSON.stringify(items));
	}

	getById(id: string): Readonly<T> | undefined {
		const items = this.getAll();
		return items.find((item) => item.id === id);
	}

	getAll(): ReadonlyArray<T> {
		return this.#getAllMutable();
	}

	/**
	 * Returns all items in localStorage as a mutable array.
	 */
	#getAllMutable(): T[] {
		const items = localStorage.getItem(this.#storageKey);
		if (items) {
			try {
				return JSON.parse(items);
			} catch (error) {
				console.error('Failed to parse items from localStorage', error);
			}
		}
		return [];
	}

	restoreSortingOrder(): void {
		const items = this.#getAllMutable();
		items.sort((a, b) => {
			const aId = new Date(Number.parseInt(a.id));
			const bId = new Date(Number.parseInt(b.id));

			return compareDesc(aId, bId);
		});
		localStorage.setItem(this.#storageKey, JSON.stringify(items));
	}
}
