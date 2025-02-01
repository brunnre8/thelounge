import socket from "../socket.js";
import {store} from "../store.js";

socket.on("nick", function (data) {
	const network = store.getters.findNetwork(data.network);

	if (network) {
		network.nick = data.nick;
	}
});
