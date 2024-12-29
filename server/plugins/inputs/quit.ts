import {without} from "lodash-es";
import {type PluginInputHandler} from "./index.js";
import ClientCertificate from "../clientCertificate.js";

const commands = ["quit"];
const allowDisconnected = true;

const input: PluginInputHandler = function (network, chan, cmd, args) {
	const client = this;

	client.networks = without(client.networks, network);
	network.destroy();
	client.save();
	client.emit("quit", {
		network: network.uuid,
	});

	const quitMessage = args[0] ? args.join(" ") : undefined;
	network.quit(quitMessage);

	ClientCertificate.remove(network.uuid);

	return true;
};

export default {
	commands,
	input,
	allowDisconnected,
};
