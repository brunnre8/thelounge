<template>
	<span class="content">
		<Username :user="message.from" />
		is now known as
		<Username :user="{nick: message.new_nick, mode: message.from.mode}" />
	</span>
</template>

<script lang="ts">
import {defineComponent, type PropType} from "vue";
import type {ClientNetwork, ClientMessage} from "../../js/types";
import Username from "../Username.vue";

export default defineComponent({
	name: "MessageTypeNick",
	components: {
		Username,
	},
	props: {
		network: {
			type: Object as PropType<ClientNetwork>,
			required: true,
		},
		message: {
			type: Object as PropType<ClientMessage>,
			required: true,
		},
	},
});
</script>
