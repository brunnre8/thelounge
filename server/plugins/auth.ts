import colors from "chalk";
import Client from "../client.js";
import ClientManager from "../clientManager.js";
import log from "../log.js";
import authLdap from "./auth/ldap.js";
import authLocal from "./auth/local.js";

export type AuthHandler = (
	manager: ClientManager,
	client: Client,
	user: string,
	password: string,
	callback: (success: boolean) => void
) => void;

// The order defines priority: the first available plugin is used.
// Always keep 'local' auth plugin at the end of the list; it should always be enabled.
const plugins = [authLdap, authLocal];

const toExport = {
	moduleName: "<module with no name>",

	// Must override: implements authentication mechanism
	auth: () => unimplemented("auth"),

	// Optional to override: implements filter for loading users at start up
	// This allows an auth plugin to check if a user is still acceptable, if the plugin
	// can do so without access to the user's unhashed password.
	// Returning 'false' triggers fallback to default behaviour of loading all users
	loadUsers: () => false,
	// local auth should always be enabled, but check here to verify
	initialized: false,
	// TODO: fix typing
	async initialize() {
		if (toExport.initialized) {
			return;
		}

		for (const plugin of plugins) {
			if (plugin.isEnabled()) {
				toExport.initialized = true;

				for (const name in plugin) {
					toExport[name] = plugin[name];
				}

				break;
			}
		}

		if (!toExport.initialized) {
			log.error("None of the auth plugins is enabled");
		}
	},
} as any;

function unimplemented(funcName: string) {
	log.debug(
		`Auth module ${colors.bold(toExport.moduleName)} doesn't implement function ${colors.bold(
			funcName
		)}`
	);
}

// Default API implementations
export default toExport;
