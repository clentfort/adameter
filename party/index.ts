import type { Connection, Room, Server, Worker } from 'partykit/server';
import { onConnect } from 'y-partykit';

export default class ServerImpl implements Server {
	constructor(readonly room: Room) {}

	onConnect(conn: Connection) {
		return onConnect(conn, this.room, { persist: { mode: 'snapshot' } });
	}
}

ServerImpl satisfies Worker;
