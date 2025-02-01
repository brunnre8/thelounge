import socket from "../socket.js";
import {store} from "../store.js";

socket.on("names", function (data) {
	const netChan = store.getters.findChannel(data.id);

	if (netChan) {
		netChan.channel.users = data.users;
	}
});
