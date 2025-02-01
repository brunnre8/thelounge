<template>
	<span class="content">
		Your user mode is <b>{{ message.raw_modes }}</b>
	</span>
</template>

<script lang="ts">
import {defineComponent, type PropType} from "vue";
import type {ClientNetwork, ClientMessage} from "../../js/types";

export default defineComponent({
	name: "MessageChannelMode",
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
