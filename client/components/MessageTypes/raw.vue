<template>
	<span class="content">{{ message.text }}</span>
</template>

<script lang="ts">
import {defineComponent, type PropType} from "vue";
import type {ClientNetwork, ClientMessage} from "../../js/types";

export default defineComponent({
	name: "MessageTypeRaw",
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
