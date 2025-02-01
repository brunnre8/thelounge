<template>
	<span class="content">
		<Username :user="message.from" />
		{{ `&#32;` }}<span class="ctcp-message"><ParsedMessage :text="message.ctcpMessage" /></span>
	</span>
</template>

<script lang="ts">
import {defineComponent, type PropType} from "vue";
import type {ClientNetwork, ClientMessage} from "../../js/types";
import ParsedMessage from "../ParsedMessage.vue";
import Username from "../Username.vue";

export default defineComponent({
	name: "MessageTypeCTCP",
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
