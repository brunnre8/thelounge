<template>
	<span class="content">
		<Username :user="message.from" />
		sets mode
		<ParsedMessage :message="message" />
	</span>
</template>

<script lang="ts">
import {defineComponent, type PropType} from "vue";
import type {ClientNetwork, ClientMessage} from "../../js/types";
import ParsedMessage from "../ParsedMessage.vue";
import Username from "../Username.vue";

export default defineComponent({
	name: "MessageTypeMode",
	components: {
		ParsedMessage,
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
