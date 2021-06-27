<template>
	<div ref="chat" class="chat" tabindex="-1">
		<div v-show="channel.moreHistoryAvailable" class="show-more">
			<button
				ref="loadMoreButton"
				:disabled="channel.historyLoading || !$store.state.isConnected"
				class="btn"
				@click="onShowMoreClick"
			>
				<span v-if="channel.historyLoading">Loading…</span>
				<span v-else>Show older messages</span>
			</button>
		</div>
		<div
			class="messages"
			role="log"
			aria-live="polite"
			aria-relevant="additions"
			@copy="onCopy"
		>
			<template v-for="(message, id) in condensedMessages">
				<DateMarker
					v-if="shouldDisplayDateMarker(message, id)"
					:key="message.id + '-date'"
					:message="message"
					:focused="message.id == focused"
				/>
				<div
					v-if="shouldDisplayUnreadMarker(message.id)"
					:key="message.id + '-unread'"
					class="unread-marker"
				>
					<span class="unread-marker-text" />
				</div>

				<MessageCondensed
					v-if="message.type === 'condensed'"
					:key="message.messages[0].id"
					:network="network"
					:keep-scroll-position="keepScrollPosition"
					:messages="message.messages"
					:focused="message.id == focused"
				/>
				<Message
					v-else
					:key="message.id"
					:channel="channel"
					:network="network"
					:message="message"
					:keep-scroll-position="keepScrollPosition"
					:is-previous-source="isPreviousSource(message, id)"
					:focused="message.id == focused"
					@toggle-link-preview="onLinkPreviewToggle"
				/>
			</template>
		</div>
	</div>
</template>

<script>
const constants = require("../js/constants");
import eventbus from "../js/eventbus";
import clipboard from "../js/clipboard";
import socket from "../js/socket";
import Message from "./Message.vue";
import MessageCondensed from "./MessageCondensed.vue";
import DateMarker from "./DateMarker.vue";

let unreadMarkerShown = false;

export default {
	name: "MessageList",
	components: {
		Message,
		MessageCondensed,
		DateMarker,
	},
	props: {
		network: Object,
		channel: Object,
		focused: String,
	},
	data: function () {
		return {
			smartFilterIdx: 0,
			// TODO fix this
			smartFilterTimeDeltaMin: 15,
			smartFilterStateMsgsToShow: new Map(), // messages idx to bool
			nicksLastSpeakTime: new Map(), // nick to time
			nicksLastStatusMsg: new Map(), // nick to messages idx
		};
	},
	computed: {
		condensedMessages() {
			if (this.channel.type !== "channel") {
				return this.channel.messages;
			}

			// If actions are hidden, just return a message list with them excluded
			if (this.$store.state.settings.statusMessages === "hidden") {
				return this.channel.messages.filter(
					(message) => !constants.condensedTypes.has(message.type)
				);
			}

			// smart filter
			if (true) {
				return this.channel.messages.filter((message, idx) => {
					if (!constants.condensedTypes.has(message.type)) {
						return true;
					}

					return this.smartFilterStateMsgsToShow.has(idx);
				});
			}

			// If actions are not condensed, just return raw message list
			if (this.$store.state.settings.statusMessages !== "condensed") {
				return this.channel.messages;
			}

			const condensed = [];
			let lastCondensedContainer = null;

			for (const message of this.channel.messages) {
				// If this message is not condensable, or its an action affecting our user,
				// then just append the message to container and be done with it
				if (
					message.self ||
					message.highlight ||
					!constants.condensedTypes.has(message.type)
				) {
					lastCondensedContainer = null;

					condensed.push(message);

					continue;
				}

				if (lastCondensedContainer === null) {
					lastCondensedContainer = {
						time: message.time,
						type: "condensed",
						messages: [],
					};

					condensed.push(lastCondensedContainer);
				}

				lastCondensedContainer.messages.push(message);

				// Set id of the condensed container to last message id,
				// which is required for the unread marker to work correctly
				lastCondensedContainer.id = message.id;

				// If this message is the unread boundary, create a split condensed container
				if (message.id === this.channel.firstUnread) {
					lastCondensedContainer = null;
				}
			}

			return condensed;
		},
	},
	watch: {
		"channel.id"() {
			this.channel.scrolledToBottom = true;

			// Re-add the intersection observer to trigger the check again on channel switch
			// Otherwise if last channel had the button visible, switching to a new channel won't trigger the history
			if (this.historyObserver) {
				this.historyObserver.unobserve(this.$refs.loadMoreButton);
				this.historyObserver.observe(this.$refs.loadMoreButton);
			}
		},
		"channel.messages"() {
			this.keepScrollPosition();
			this.updateSmartFilter();
		},
		"channel.pendingMessage"() {
			this.$nextTick(() => {
				// Keep the scroll stuck when input gets resized while typing
				this.keepScrollPosition();
			});
		},
	},
	created() {
		this.$nextTick(() => {
			if (!this.$refs.chat) {
				return;
			}

			if (window.IntersectionObserver) {
				this.historyObserver = new window.IntersectionObserver(this.onLoadButtonObserved, {
					root: this.$refs.chat,
				});
			}

			this.jumpToBottom();
		});
	},
	mounted() {
		this.$refs.chat.addEventListener("scroll", this.handleScroll, {passive: true});

		eventbus.on("resize", this.handleResize);

		this.$nextTick(() => {
			if (this.historyObserver) {
				this.historyObserver.observe(this.$refs.loadMoreButton);
			}
		});
	},
	beforeUpdate() {
		unreadMarkerShown = false;
	},
	beforeDestroy() {
		eventbus.off("resize", this.handleResize);
		this.$refs.chat.removeEventListener("scroll", this.handleScroll);
	},
	destroyed() {
		if (this.historyObserver) {
			this.historyObserver.disconnect();
		}
	},
	methods: {
		shouldDisplayDateMarker(message, id) {
			const previousMessage = this.condensedMessages[id - 1];

			if (!previousMessage) {
				return true;
			}

			const oldDate = new Date(previousMessage.time);
			const newDate = new Date(message.time);

			return (
				oldDate.getDate() !== newDate.getDate() ||
				oldDate.getMonth() !== newDate.getMonth() ||
				oldDate.getFullYear() !== newDate.getFullYear()
			);
		},
		shouldDisplayUnreadMarker(id) {
			if (!unreadMarkerShown && id > this.channel.firstUnread) {
				unreadMarkerShown = true;
				return true;
			}

			return false;
		},
		isPreviousSource(currentMessage, id) {
			const previousMessage = this.condensedMessages[id - 1];
			return (
				previousMessage &&
				currentMessage.type === "message" &&
				previousMessage.type === "message" &&
				previousMessage.from &&
				currentMessage.from.nick === previousMessage.from.nick
			);
		},
		onCopy() {
			clipboard(this.$el);
		},
		onLinkPreviewToggle(preview, message) {
			this.keepScrollPosition();

			// Tell the server we're toggling so it remembers at page reload
			socket.emit("msg:preview:toggle", {
				target: this.channel.id,
				msgId: message.id,
				link: preview.link,
				shown: preview.shown,
			});
		},
		onShowMoreClick() {
			if (!this.$store.state.isConnected) {
				return;
			}

			let lastMessage = -1;

			// Find the id of first message that isn't showInActive
			// If showInActive is set, this message is actually in another channel
			for (const message of this.channel.messages) {
				if (!message.showInActive) {
					lastMessage = message.id;
					break;
				}
			}

			this.channel.historyLoading = true;

			socket.emit("more", {
				target: this.channel.id,
				lastId: lastMessage,
				condensed: this.$store.state.settings.statusMessages !== "shown",
			});
		},
		onLoadButtonObserved(entries) {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) {
					return;
				}

				this.onShowMoreClick();
			});
		},
		keepScrollPosition() {
			// If we are already waiting for the next tick to force scroll position,
			// we have no reason to perform more checks and set it again in the next tick
			if (this.isWaitingForNextTick) {
				return;
			}

			const el = this.$refs.chat;

			if (!el) {
				return;
			}

			if (!this.channel.scrolledToBottom) {
				if (this.channel.historyLoading) {
					const heightOld = el.scrollHeight - el.scrollTop;

					this.isWaitingForNextTick = true;
					this.$nextTick(() => {
						this.isWaitingForNextTick = false;
						this.skipNextScrollEvent = true;
						el.scrollTop = el.scrollHeight - heightOld;
					});
				}

				return;
			}

			this.isWaitingForNextTick = true;
			this.$nextTick(() => {
				this.isWaitingForNextTick = false;
				this.jumpToBottom();
			});
		},
		handleScroll() {
			// Setting scrollTop also triggers scroll event
			// We don't want to perform calculations for that
			if (this.skipNextScrollEvent) {
				this.skipNextScrollEvent = false;
				return;
			}

			const el = this.$refs.chat;

			if (!el) {
				return;
			}

			this.channel.scrolledToBottom = el.scrollHeight - el.scrollTop - el.offsetHeight <= 30;
		},
		handleResize() {
			// Keep message list scrolled to bottom on resize
			if (this.channel.scrolledToBottom) {
				this.jumpToBottom();
			}
		},
		jumpToBottom() {
			this.skipNextScrollEvent = true;
			this.channel.scrolledToBottom = true;

			const el = this.$refs.chat;
			el.scrollTop = el.scrollHeight;
		},
		updateSmartFilter() {
			if (this.channel.type !== "channel") {
				return; // we don't care about special buffers
			}

			if (!this.channel.messages) {
				return;
			}

			const now = Date.now(); // single time point during function execution

			for (; this.smartFilterIdx < this.channel.messages.length; this.smartFilterIdx++) {
				const msg = this.channel.messages[this.smartFilterIdx];

				if (!this.timeInSmartFilterWindow(now, msg.time)) {
					continue;
				}

				if (msg.type === "message" || msg.type === "notice" || msg.type === "action") {
					// two concerns, either the nick just joined and we want to show
					// this, or the nick may leave soon and we need to keep track of
					// when they last spoke
					this.nicksLastSpeakTime.set(msg.from.nick, msg.time);
					const lastStatusIdx = this.nicksLastStatusMsg.get(msg.from.nick);

					if (lastStatusIdx === undefined) {
						continue;
					}

					if (
						this.timeInSmartFilterWindow(now, this.channel.messages[lastStatusIdx].time)
					) {
						this.smartFilterStateMsgsToShow.set(lastStatusIdx, true);
						continue;
					} else {
						// if the time window is larger than what we care about there's
						// no point in keeping track of it any longer
						this.nicksLastStatusMsg.delete(msg.from.nick);
						continue;
					}
				} else if (msg.type === "mode" || msg.type === "kick") {
					// this messages are considered important and always shown.
					// mode changes are usually an admin flexing and kicks should be
					// shown so that people know that ops did their job
					this.smartFilterStateMsgsToShow.set(this.smartFilterIdx, true);
					// we don't delete the state of the victim, should they rejoin
					// immediately this should be visible
					continue;
				} else if (msg.type === "join") {
					const lastStatusIdx = this.nicksLastStatusMsg.get(msg.from.nick);

					this.nicksLastStatusMsg.set(msg.from.nick, this.smartFilterIdx);

					if (lastStatusIdx === undefined) {
						continue;
					}

					if (
						this.timeInSmartFilterWindow(now, this.channel.messages[lastStatusIdx].time)
					) {
						this.smartFilterStateMsgsToShow.set(lastStatusIdx, true);
					}

					continue;
				} else if (msg.type === "nick") {
					// here we need to track information across nicks, as new incoming
					// events will have the new nick and old ones are already marked
					// there's no need to leave the old nick in place
					if (this.nicksLastSpeakTime.has(msg.from.nick)) {
						this.nicksLastSpeakTime.set(
							msg.new_nick,
							this.nicksLastSpeakTime.get(msg.from.nick)
						);
						this.nicksLastSpeakTime.delete(msg.from.nick);

						if (
							this.timeInSmartFilterWindow(
								now,
								this.nicksLastSpeakTime.get(msg.new_nick)
							)
						) {
							this.smartFilterStateMsgsToShow.set(this.smartFilterIdx, true);
						}
					}

					if (this.nicksLastStatusMsg.has(msg.from.nick)) {
						this.nicksLastStatusMsg.set(
							msg.new_nick,
							this.nicksLastStatusMsg.get(msg.from.nick)
						);
						this.nicksLastStatusMsg.delete(msg.from.nick);

						// TODO: we need to use a list so that we can track
						// 1) join as dummy
						// 2) dummy changes nick to blah
						// 3) blah talks
						// we really want to see 1 and 2 not just either one
					}

					continue;
				} else if (msg.type === "quit" || msg.type === "part") {
					const lastSpokeTime = this.nicksLastSpeakTime.get(msg.from.nick);

					if (lastSpokeTime && this.timeInSmartFilterWindow(now, lastSpokeTime)) {
						this.smartFilterStateMsgsToShow.set(this.smartFilterIdx, true);
						continue;
					} else {
						// if the time window is larger than what we care about there's
						// no point in keeping track of it any longer
						this.nicksLastSpeakTime.delete(msg.from.nick);
						continue;
					}
				} else {
					continue; // all other messages are ignored
				}
			}
		},
		timeInSmartFilterWindow(now, testdate) {
			if (typeof now === "string") {
				now = Date.parse(now);
			}

			if (typeof testdate === "string") {
				testdate = Date.parse(testdate);
			}

			if (testdate > now) {
				return false; // testdate is in the future, shouldn't happen
			}

			const diff = (now - testdate) / 1000 / 60;

			if (diff <= this.smartFilterTimeDeltaMin) {
				return true;
			}

			return false;
		},
	},
};
</script>
