import {type PluginInputHandler} from "./index.js";
import Msg from "../../models/msg.js";
import {ChanType, SpecialChanType} from "../../../shared/types/chan.js";
import {MessageType} from "../../../shared/types/msg.js";

const commands = ["ignorelist"];

const input: PluginInputHandler = function (network, chan, _cmd, _args) {
	const client = this;

	if (network.ignoreList.length === 0) {
		chan.pushMessage(
			client,
			new Msg({
				type: MessageType.ERROR,
				text: "Ignorelist is empty",
			})
		);
		return;
	}

	const chanName = "Ignored users";
	const ignored = network.ignoreList.map((data) => ({
		hostmask: `${data.nick}!${data.ident}@${data.hostname}`,
		when: data.when,
	}));
	let newChan = network.getChannel(chanName);

	if (typeof newChan === "undefined") {
		newChan = client.createChannel({
			type: ChanType.SPECIAL,
			special: SpecialChanType.IGNORELIST,
			name: chanName,
			data: ignored,
		});
		client.emit("join", {
			network: network.uuid,
			chan: newChan.getFilteredClone(true),
			shouldOpen: false,
			index: network.addChannel(newChan),
		});
		return;
	}

	// TODO: add type for this chan/event
	newChan.data = ignored;

	client.emit("msg:special", {
		chan: newChan.id,
		data: ignored,
	});
};

export default {
	commands,
	input,
};
