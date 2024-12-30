import fs from "fs";
import net, {Socket} from "net";
import colors from "chalk";
import Helper from "./helper.js";
import Config from "./config.js";
import log from "./log.js";

type Connection = {
	socket: Socket;
	user: string;
};
class Identification {
	private connectionId: number;
	private connections: Map<number, Connection>;
	private oidentdFile?: string;

	constructor(startedCallback: (identHandler: Identification, err?: Error) => void) {
		this.connectionId = 0;
		this.connections = new Map();

		if (typeof Config.values.oidentd === "string") {
			this.oidentdFile = Helper.expandHome(Config.values.oidentd);
			log.info(`Oidentd file: ${colors.green(this.oidentdFile)}`);

			this.refresh();
		}

		if (Config.values.identd.enable) {
			if (this.oidentdFile) {
				log.warn(
					"Using both identd and oidentd at the same time, this is most likely not intended."
				);
			}

			const server = net.createServer(this.serverConnection.bind(this));

			server.on("error", (err) => {
				startedCallback(this, err);
			});

			server.listen(
				{
					port: Config.values.identd.port || 113,
					host: Config.values.bind,
				},
				() => {
					const address = server.address();

					if (typeof address === "string") {
						log.info(`Identd server available on ${colors.green(address)}`);
					} else if (address?.address) {
						log.info(
							`Identd server available on ${colors.green(
								address.address + ":" + address.port.toString()
							)}`
						);
					}

					startedCallback(this);
				}
			);
		} else {
			startedCallback(this);
		}
	}

	serverConnection(socket: Socket) {
		socket.on("error", (err: string) => log.error(`Identd socket error: ${err}`));
		socket.setTimeout(5000, () => {
			log.warn(
				`identd: no data received, closing connection to ${
					socket.remoteAddress || "undefined"
				}`
			);
			socket.destroy();
		});
		socket.once("data", (data) => {
			this.respondToIdent(socket, data);
			socket.end();
		});
	}

	respondToIdent(socket: Socket, buffer: Buffer) {
		if (!socket.remoteAddress) {
			log.warn("identd: no remote address");
			return;
		}

		const data = buffer.toString().split(",");

		const lport = parseInt(data[0], 10) || 0;
		const fport = parseInt(data[1], 10) || 0;

		if (lport < 1 || fport < 1 || lport > 65535 || fport > 65535) {
			log.warn(`identd: bogus request from ${socket.remoteAddress}`);
			return;
		}

		log.debug(`identd: remote ${socket.remoteAddress} query ${lport}, ${fport}`);

		for (const connection of this.connections.values()) {
			// we only want to respond if all the ip,port tuples match, to avoid user enumeration
			if (
				connection.socket.remotePort === fport &&
				connection.socket.localPort === lport &&
				socket.remoteAddress === connection.socket.remoteAddress &&
				socket.localAddress === connection.socket.localAddress
			) {
				const reply = `${lport}, ${fport} : USERID : TheLounge : ${connection.user}\r\n`;
				log.debug(`identd: reply is ${reply.trimEnd()}`);
				socket.write(reply);
				return;
			}
		}

		const reply = `${lport}, ${fport} : ERROR : NO-USER\r\n`;
		log.debug(`identd: reply is ${reply.trimEnd()}`);
		socket.write(reply);
	}

	addSocket(socket: Socket, user: string) {
		const id = ++this.connectionId;

		this.connections.set(id, {socket, user});

		if (this.oidentdFile) {
			this.refresh();
		}

		return id;
	}

	removeSocket(id: number) {
		this.connections.delete(id);

		if (this.oidentdFile) {
			this.refresh();
		}
	}

	refresh() {
		let file = "# Warning: file generated by The Lounge: changes will be overwritten!\n";

		this.connections.forEach((connection, id) => {
			if (!connection.socket.remotePort || !connection.socket.localPort) {
				// Race condition: this can happen when more than one socket gets disconnected at
				// once, since we `refresh()` for each one being added/removed. This results
				// in there possibly being one or more disconnected sockets remaining when we get here.
				log.warn(
					`oidentd: socket has no remote or local port (id=${id}). See https://github.com/thelounge/thelounge/pull/4695.`
				);
				return;
			}

			if (!connection.socket.remoteAddress) {
				log.warn(`oidentd: socket has no remote address, will not respond to queries`);
				return;
			}

			if (!connection.socket.localAddress) {
				log.warn(`oidentd: socket has no local address, will not respond to queries`);
				return;
			}

			// we only want to respond if all the ip,port tuples match, to avoid user enumeration
			file +=
				`to ${connection.socket.remoteAddress}` +
				` fport ${connection.socket.remotePort}` +
				` from ${connection.socket.localAddress}` +
				` lport ${connection.socket.localPort}` +
				` { reply "${connection.user}" }\n`;
		});

		if (this.oidentdFile) {
			fs.writeFile(this.oidentdFile, file, {flag: "w+"}, function (err) {
				if (err) {
					log.error("Failed to update oidentd file!", err.message);
				}
			});
		}
	}
}

export default Identification;
