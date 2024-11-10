/* eslint-disable @typescript-eslint/restrict-template-expressions */
import colors from "chalk";
import semver from "semver";
import {Command} from "commander";
import packageJson, {type FullMetadata} from "package-json";
import fs from "fs";
import fspromises from "node:fs/promises";
import path from "path";
import log from "../log.js";
import Helper from "../helper.js";
import Config from "../config.js";
import Utils from "./utils.js";

type CustomMetadata = FullMetadata & {
	thelounge: {
		supports: string;
	};
};

const program = new Command("install");
program
	.argument(
		"<package>",
		"package to install. Use `file:$path_to_package_dir` to install a local package"
	)
	.description("Install a theme or a package")
	.on("--help", Utils.extraHelp)
	.action(async function (packageName: string) {
		try {
			await install(packageName);
		} catch (err) {
			log.error(`${err}`);
			process.exit(1);
		}
	});

async function install(packageName: string): Promise<void> {
	if (!fs.existsSync(Config.getConfigPath())) {
		throw new Error(`${Config.getConfigPath()} does not exist.`);
	}

	log.info("Retrieving information about the package...");
	let metaData: FullMetadata | CustomMetadata | null = null;
	let isLocalFile = false;

	if (packageName.startsWith("file:")) {
		isLocalFile = true;
		// our yarn invocation sets $HOME to the cachedir, so we must expand ~ now
		// else the path will be invalid when npm expands it.
		packageName = expandTildeInLocalPath(packageName);
		const pkgJson = await fspromises.readFile(
			path.join(packageName.substring("file:".length), "package.json"),
			"utf-8"
		);
		metaData = await JSON.parse(pkgJson);
	} else {
		// properly split scoped and non-scoped npm packages
		// into their name and version
		let packageVersion = "latest";
		const atIndex = packageName.indexOf("@", 1);

		if (atIndex !== -1) {
			packageVersion = packageName.slice(atIndex + 1);
			packageName = packageName.slice(0, atIndex);
		}

		metaData = await packageJson.default(packageName, {
			fullMetadata: true,
			version: packageVersion,
		});
	}

	if (!metaData) {
		// no-op, error should've been thrown before this point
		throw new Error("unexpected empty metaData, please report this as a bug.");
	}

	const humanVersion = isLocalFile ? packageName : `${metaData.name} v${metaData.version}`;

	try {
		validateMetaData(metaData);
	} catch (err) {
		`${colors.red(humanVersion)} ${err}`;
	}

	log.info(`Installing ${colors.green(humanVersion)}...`);
	const yarnVersion = isLocalFile ? packageName : `${metaData.name}@${metaData.version}`;
	await yarn("add", "--exact", yarnVersion);

	log.info(`${colors.green(humanVersion)} has been successfully installed.`);

	if (!isLocalFile) {
		return;
	}

	// yarn v1 is buggy if a local filepath is used and doesn't update
	// the lockfile properly. We need to run an install in that case
	// even though that's supposed to be done by the add subcommand
	await yarn("install");
}

function expandTildeInLocalPath(packageName: string): string {
	const filepath = packageName.substring("file:".length);
	return "file:" + Helper.expandHome(filepath);
}

function isCustomMetaData(meta: FullMetadata | CustomMetadata): meta is CustomMetadata {
	return "thelounge" in meta;
}

function validateMetaData(metaData: FullMetadata | CustomMetadata) {
	if (!isCustomMetaData(metaData)) {
		throw new Error(`does not have The Lounge metadata.`);
	}

	if (!metaData.thelounge.supports) {
		throw new Error("required field 'supports' missing in the thelounge meta data.");
	}

	if (
		!semver.satisfies(Helper.getVersionNumber(), metaData.thelounge.supports, {
			includePrerelease: true,
		})
	) {
		throw new Error(
			`does not support The Lounge v${Helper.getVersionNumber()}. Supported version(s): ${
				metaData.thelounge.supports
			}`
		);
	}
}

async function yarn(cmd: string, ...args: string[]): Promise<void> {
	try {
		await Utils.executeYarnCommand(cmd, ...args);
	} catch (returnCode) {
		throw new Error(`Failed to update lockfile after package install. Exitcode ${returnCode}`);
	}
}

export default program;
