import {createApp} from "vue";

import constants from "./constants.js";
import "../css/style.css";
import {store, type CallableGetters, key} from "./store.js";
import App from "../components/App.vue";
import storage from "./localStorage.js";
import {router} from "./router.js";
import socket from "./socket.js";
import "./socket-events.js"; // this sets up all socket event listeners, do not remove
import eventbus from "./eventbus.js";
import "./webpush.js";
import "./keybinds.js";
import type {LoungeWindow} from "./types.js";

const favicon = document.getElementById("favicon");
const faviconNormal = favicon?.getAttribute("href") || "";
const faviconAlerted = favicon?.dataset.other || "";

export const VueApp = createApp(App);

VueApp.use(router);
// @ts-ignore
VueApp.use(store, key); // TODO: Fix missing install in type

VueApp.mount("#app");
socket.open();

store.watch(
	(state) => state.sidebarOpen,
	(sidebarOpen) => {
		if (window.innerWidth > constants.mobileViewportPixels) {
			storage.set("thelounge.state.sidebar", sidebarOpen.toString());
			eventbus.emit("resize");
		}
	}
);

store.watch(
	(state) => state.userlistOpen,
	(userlistOpen) => {
		storage.set("thelounge.state.userlist", userlistOpen.toString());
		eventbus.emit("resize");
	}
);

store.watch(
	(_, getters: CallableGetters) => getters.title,
	(title) => {
		document.title = title;
	}
);

// Toggles the favicon to red when there are unread notifications
store.watch(
	(_, getters: CallableGetters) => getters.highlightCount,
	(highlightCount) => {
		favicon?.setAttribute("href", highlightCount > 0 ? faviconAlerted : faviconNormal);

		const nav: LoungeWindow["navigator"] = window.navigator;

		if (nav.setAppBadge) {
			if (highlightCount > 0) {
				nav.setAppBadge(highlightCount).catch(() => {});
			} else {
				if (nav.clearAppBadge) {
					nav.clearAppBadge().catch(() => {});
				}
			}
		}
	}
);

VueApp.config.errorHandler = function (e) {
	if (e instanceof Error) {
		store.commit("currentUserVisibleError", `Vue error: ${e.message}`);
	} else {
		store.commit("currentUserVisibleError", `Vue error: ${String(e)}`);
	}

	// eslint-disable-next-line no-console
	console.error(e);
};
