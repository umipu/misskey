<template>
<div :class="[$style.root, { [$style.cover]: cover }]" :title="title ?? ''">
	<img v-if="!loaded && src && !forceBlurhash" :class="$style.loader" :src="src" @load="onLoad"/>
	<Transition
		mode="in-out"
		:enter-active-class="defaultStore.state.animation && (props.transition?.enterActiveClass ?? $style['transition_toggle_enterActive']) || undefined"
		:leave-active-class="defaultStore.state.animation && (props.transition?.leaveActiveClass ?? $style['transition_toggle_leaveActive']) || undefined"
		:enter-from-class="defaultStore.state.animation && props.transition?.enterFromClass || undefined"
		:leave-to-class="defaultStore.state.animation && props.transition?.leaveToClass || undefined"
		:enter-to-class="defaultStore.state.animation && (props.transition?.enterToClass ?? $style['transition_toggle_enterTo']) || undefined"
		:leave-from-class="defaultStore.state.animation && (props.transition?.leaveFromClass ?? $style['transition_toggle_leaveFrom']) || undefined"
	>
		<canvas v-if="!loaded || forceBlurhash" ref="canvas" :class="$style.canvas" :width="width" :height="height" :title="title ?? undefined"/>
		<img v-else :class="$style.img" :src="src ?? undefined" :title="title ?? undefined" :alt="alt ?? undefined"/>
	</Transition>
</div>
</template>

<script lang="ts" setup>
import { onMounted, shallowRef, useCssModule, watch } from 'vue';
import { decode } from 'blurhash';
import { defaultStore } from '@/store';

const $style = useCssModule();

const props = withDefaults(defineProps<{
	transition?: {
		enterActiveClass?: string;
		leaveActiveClass?: string;
		enterFromClass?: string;
		leaveToClass?: string;
		enterToClass?: string;
		leaveFromClass?: string;
	} | null;
	src?: string | null;
	hash?: string;
	alt?: string;
	title?: string | null;
	size?: number;
	cover?: boolean;
}>(), {
	transition: null,
	src: null,
	alt: '',
	title: null,
	size: 64,
	cover: true,
});

const canvas = shallowRef<HTMLCanvasElement>();
let loaded = $ref(false);

function draw() {
	if (props.hash == null || !canvas.value) return;
	const pixels = decode(props.hash, width, height);
	const ctx = canvas.value.getContext('2d');
	const imageData = ctx!.createImageData(width, height);
	imageData.data.set(pixels);
	ctx!.putImageData(imageData, 0, 0);
}

watch([() => props.hash, canvas], () => {
	draw();
});

onMounted(() => {
	draw();
});
</script>

<style lang="scss" module>
.transition_toggle_enterActive,
.transition_toggle_leaveActive {
	position: absolute;
	top: 0;
	left: 0;
}

.transition_toggle_enterTo,
.transition_toggle_leaveFrom {
	opacity: 0;
}

.loader {
	position: absolute;
	top: 0;
	left: 0;
	width: 0;
	height: 0;
}

.root {
	position: relative;
	width: 100%;
	height: 100%;

	&.cover {
		> .img {
			object-fit: cover;
		}
	}
}

.canvas,
.img {
	display: block;
	width: 100%;
	height: 100%;
}

.canvas {
	position: absolute;
	object-fit: cover;
}

.img {
	object-fit: contain;
}
</style>
