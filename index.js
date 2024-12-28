#!/usr/bin/env node

"use strict";

process.chdir(__dirname);

import fs from "fs";
import {readFile} from "node:fs/promises";
import semver from "semver";
// Perform node version check before loading any other files or modules
// Doing this check as soon as possible allows us to
// avoid ES6 parser errors or other issues
const pkg = JSON.parse(await readFile("./package.json", "utf8"));

if (!semver.satisfies(process.version, pkg.engines.node)) {
	/* eslint-disable no-console */
	console.error(
		"The Lounge requires Node.js " +
			pkg.engines.node +
			" (current version: " +
			process.version +
			")"
	);
	console.error("Please upgrade Node.js in order to use The Lounge");
	console.error("See https://thelounge.chat/docs/install-and-upgrade");
	console.error();

	process.exit(1);
}

if (!fs.existsSync("./dist/server/index.js")) {
	console.error(
		"Files in ./dist/server/ not found. Please run `yarn build` before trying to run `node index.js`."
	);
	process.exit(1);
}

import "./dist/server/index.js";
