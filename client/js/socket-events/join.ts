import socket from "../socket.js";
import {store} from "../store.js";
import {switchToChannel} from "../router.js";
import type {ClientChan} from "../types.js";
import * as chanJs from "../chan.js";

socket.on("join", function (data) {
	const network = store.getters.findNetwork(data.network);

	if (!network) {
		return;
	}

	const clientChan: ClientChan = chanJs.toClientChan(data.chan);
	network.channels.splice(data.index || -1, 0, clientChan);

	// Queries do not automatically focus, unless the user did a whois
	if (data.chan.type === "query" && !data.shouldOpen) {
		return;
	}

	const chan = store.getters.findChannel(data.chan.id);

	if (chan) {
		switchToChannel(chan.channel);
	} else {
		// eslint-disable-next-line no-console
		console.error("Could not find channel", data.chan.id);
	}
});
