<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<img v-if="faviconUrl" :class="$style.leftLogo" :src="faviconUrl"/>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { getProxiedImageUrlNullable } from '@/scripts/media-proxy.js';
const props = defineProps<{
	instance?: {
		faviconUrl?: string | null
	}
}>();
const faviconUrl = computed(() => getProxiedImageUrlNullable(props.instance?.faviconUrl, 'preview') ?? '/favicon.ico');
</script>

<style lang="scss" module>
.leftLogo {
	width: 25px;
	height: 25px;
	border-radius: 50%;
	opacity: 0.7;
	background: var(--panel);
	box-shadow: 0 0 0 2px var(--panel);
}

@container (max-width: 580px) {
	.leftLogo {
		width: 21px;
		height: 21px;
	}
}

@container (max-width: 450px) {
	.leftLogo {
		width: 19px;
		height: 19px;
	}
}

@container (max-width: 300px) {
	.leftLogo {
		width: 17px;
		height: 17px;
	}
}
</style>
