import {store} from "../store.js";

export default (network, channel) => {
	if (!network.isCollapsed || channel.highlight || channel.type === "lobby") {
		return false;
	}

	if (store.state.activeChannel && channel === store.state.activeChannel.channel) {
		return false;
	}

	return true;
};
