<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- eslint-disable vue/no-v-html -->
<template>
<code v-if="inline" :class="`language-${prismLang}`" style="overflow-wrap: anywhere;" v-html="html"></code>
<pre v-else :class="`language-${prismLang}`"><code :class="`language-${prismLang}`" data-prismjs-copy="Copy" v-html="html"></code></pre>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import Prism from 'prismjs';
import 'prismjs/themes/prism-okaidia.css';
import 'prismjs/plugins/toolbar/prism-toolbar.min';
import 'prismjs/plugins/toolbar/prism-toolbar.min.css';
import 'prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard.min';
const props = defineProps<{
	code: string;
	lang?: string;
	inline?: boolean;
}>();

const prismLang = computed(() => Prism.languages[props.lang] ? props.lang : 'js');
const html = computed(() => Prism.highlight(props.code, Prism.languages[prismLang.value], prismLang.value));
</script>
