import socket from "../socket.js";
import {store} from "../store.js";
import {switchToChannel} from "../router.js";

socket.on("msg:special", function (data) {
	const netChan = store.getters.findChannel(data.chan);

	if (!netChan) {
		return;
	}

	netChan.channel.data = data.data;
	switchToChannel(netChan.channel);
});
