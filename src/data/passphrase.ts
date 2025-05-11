import { proxy, subscribe } from 'valtio';

if (
	typeof window !== 'undefined' &&
	localStorage.getItem('passphrase') == null
) {
	localStorage.setItem('passphrase', self.crypto.randomUUID());
}

export const passphrase = proxy({
	current:
		typeof window !== 'undefined'
			? (localStorage.getItem('passphrase') ?? self.crypto.randomUUID())
			: undefined,
});

subscribe(passphrase, () => {
	if (passphrase.current) {
		localStorage.setItem('passphrase', passphrase.current);
	} else {
		localStorage.removeItem('passphrase');
	}
});
