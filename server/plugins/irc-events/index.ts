import away from "./away.js";
import cap from "./cap.js";
import connection from "./connection.js";
import unhandled from "./unhandled.js";
import ctcp from "./ctcp.js";
import chghost from "./chghost.js";
import error from "./error.js";
import help from "./help.js";
import info from "./info.js";
import invite from "./invite.js";
import join from "./join.js";
import kick from "./kick.js";
import list from "./list.js";
import mode from "./mode.js";
import modelist from "./modelist.js";
import motd from "./motd.js";
import message from "./message.js";
import names from "./names.js";
import nick from "./nick.js";
import part from "./part.js";
import quit from "./quit.js";
import sasl from "./sasl.js";
import topic from "./topic.js";
import welcome from "./welcome.js";
import whois from "./whois.js";
import type {Client, IrcEventHandler} from "../../client.js";
import type {NetworkWithIrcFramework} from "../../models/network.js";

const events: IrcEventHandler[] = [
	away,
	cap,
	connection,
	unhandled,
	ctcp,
	chghost,
	error,
	help,
	info,
	invite,
	join,
	kick,
	list,
	mode,
	modelist,
	motd,
	message,
	names,
	nick,
	part,
	quit,
	sasl,
	topic,
	welcome,
	whois,
];

export function register(
	client: Client,
	irc: NetworkWithIrcFramework["irc"],
	network: NetworkWithIrcFramework
) {
	for (const event of events) {
		event.apply(client, [irc, network]);
	}
}
