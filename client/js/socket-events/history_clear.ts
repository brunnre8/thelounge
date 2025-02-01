import socket from "../socket.js";
import {store} from "../store.js";

socket.on("history:clear", function (data) {
	const netChan = store.getters.findChannel(data.target);

	if (netChan?.channel) {
		netChan.channel.messages = [];
		netChan.channel.unread = 0;
		netChan.channel.highlight = 0;
		netChan.channel.firstUnread = 0;
		netChan.channel.moreHistoryAvailable = false;
	}
});
