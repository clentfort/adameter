import { proxy, subscribe } from 'valtio';

if (localStorage.getItem('passphrase') == null) {
	localStorage.setItem('passphrase', self.crypto.randomUUID());
}

export const passphrase = proxy({
	current: localStorage.getItem('passphrase') ?? self.crypto.randomUUID(),
});

subscribe(passphrase, () => {
	localStorage.setItem('passphrase', passphrase.current);
});
