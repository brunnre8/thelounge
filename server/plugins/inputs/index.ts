import Client from "../../client.js";
import log from "../../log.js";
import Chan, {type Channel} from "../../models/chan.js";
import Network, {type NetworkWithIrcFramework} from "../../models/network.js";
import {type PackageInfo} from "../packages/index.js";
import PublicClient from "../packages/publicClient.js";

import action from "./action.js";
import away from "./away.js";
import ban from "./ban.js";
import connect from "./connect.js";
import ctcp from "./ctcp.js";
import disconnect from "./disconnect.js";
import ignore from "./ignore.js";
import ignorelist from "./ignorelist.js";
import invite from "./invite.js";
import kick from "./kick.js";
import kill from "./kill.js";
import list from "./list.js";
import mode from "./mode.js";
import msg from "./msg.js";
import mute from "./mute.js";
import nick from "./nick.js";
import notice from "./notice.js";
import part from "./part.js";
import quit from "./quit.js";
import raw from "./raw.js";
import rejoin from "./rejoin.js";
import topic from "./topic.js";
import whois from "./whois.js";

export type PluginInputHandler = (
	this: Client,
	network: NetworkWithIrcFramework,
	chan: Channel,
	cmd: string,
	args: string[]
) => void;

// TODO: types are broken, NetworkWithIrcFramework is a mistake
type BuiltinInput = {
	commands: string[];
	input: (network: NetworkWithIrcFramework, chan: Channel, cmd: string, args: string[]) => void;
	allowDisconnected?: boolean;
};

type Plugin = {
	commands: string[];
	input: (network: Network, chan: Chan, cmd: string, args: string[]) => void;
	allowDisconnected?: boolean;
};

type ExternalPluginCommand = {
	packageInfo: PackageInfo;
	input: (
		pub: PublicClient,
		netChan: {network: Network; chan: Chan},
		cmd: string,
		args: string[]
	) => void;
	allowDisconnected?: boolean;
};

const clientSideCommands = ["/collapse", "/expand", "/search"];

const passThroughCommands = [
	"/as",
	"/bs",
	"/cs",
	"/ho",
	"/hs",
	"/join",
	"/ms",
	"/ns",
	"/os",
	"/rs",
];

const userInputs = new Map<string, Plugin>();

const builtInInputs: BuiltinInput[] = [
	action,
	away,
	ban,
	connect,
	ctcp,
	disconnect,
	ignore,
	ignorelist,
	invite,
	kick,
	kill,
	list,
	mode,
	msg,
	nick,
	notice,
	part,
	quit,
	raw,
	rejoin,
	topic,
	whois,
	mute,
];

for (const input of builtInInputs) {
	// TODO: horrifying type case, again due to breakage in NetworkWithIrcFramework
	input.commands.forEach((command: string) => userInputs.set(command, input as Plugin));
}

const pluginCommands = new Map<string, ExternalPluginCommand>();

const getCommands = () =>
	Array.from(userInputs.keys())
		.concat(Array.from(pluginCommands.keys()))
		.map((command) => `/${command}`)
		.concat(clientSideCommands)
		.concat(passThroughCommands)
		.sort();

const addPluginCommand = (packageInfo: PackageInfo, command: any, obj: any) => {
	if (typeof command !== "string") {
		log.error(`plugin {packageInfo.packageName} tried to register a bad command`);
		return;
	} else if (!obj || typeof obj.input !== "function") {
		log.error(
			`plugin ${packageInfo.packageName} tried to register command "${command} without a callback"`
		);
		return;
	}

	pluginCommands.set(command, {
		packageInfo: packageInfo,
		input: obj.input,
		allowDisconnected: obj.allowDisconnected,
	});
};

export default {
	addPluginCommand,
	getCommands,
	pluginCommands,
	userInputs,
};
