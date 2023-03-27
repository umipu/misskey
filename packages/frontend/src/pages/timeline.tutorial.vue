<template>
<div :class="$style.container">
	<div :class="$style.title">
		<div :class="$style.titleText"><i class="ti ti-info-circle"></i> {{ i18n.ts._tutorial.title }}</div>
		<div :class="$style.step">
			<button class="_button" :class="$style.stepArrow" :disabled="tutorial === 0" @click="tutorial--">
				<i class="ti ti-chevron-left"></i>
			</button>
			<span :class="$style.stepNumber">{{ tutorial + 1 }} / {{ tutorialsNumber }}</span>
			<button class="_button" :class="$style.stepArrow" :disabled="tutorial === tutorialsNumber - 1" @click="tutorial++">
				<i class="ti ti-chevron-right"></i>
			</button>
		</div>
	</div>
	<div v-if="tutorial === 0" :class="$style.body">
		<div>{{ i18n.ts._tutorial.step1_1 }}</div>
		<div>{{ i18n.ts._tutorial.step1_2 }}</div>
		<div>{{ i18n.ts._tutorial.step1_3 }}</div>
	</div>
	<div v-else-if="tutorial === 1" :class="$style.body">
		<div>{{ i18n.ts._tutorial.step2_1 }}</div>
		<div>{{ i18n.ts._tutorial.step2_2 }}</div>
		<div>
			<div class="llvierxe" :style="{ backgroundImage: $i.bannerUrl ? `url(${ $i.bannerUrl })` : null }">
				<div class="avatar">
					<MkAvatar class="avatar" :user="$i" @click="changeAvatar"/>
					<MkButton primary rounded class="avatarEdit" @click="changeAvatar">{{ i18n.ts._profile.changeAvatar }}</MkButton>
				</div>
				<MkButton primary rounded class="bannerEdit" @click="changeBanner">{{ i18n.ts._profile.changeBanner }}</MkButton>
				<MkSpacer>
					<MkInput v-model="profile.name" :max="30" manual-save>
						<template #label>{{ i18n.ts._profile.name }}</template>
					</MkInput>

					<MkTextarea v-model="profile.description" :max="200" manual-save>
						<template #label>{{ i18n.ts._profile.description }}</template>
						<template #caption>{{ i18n.ts._profile.youCanIncludeHashtags }}</template>
					</MkTextarea>

					<MkInput v-model="profile.birthday" type="date" manual-save>
						<template #label>{{ i18n.ts.birthday }}</template>
						<template #prefix><i class="ti ti-cake"></i></template>
					</MkInput>

					<MkSwitch v-model="profile.isCat">
						{{ i18n.ts.flagAsCat }}
						<template #caption>
							{{ i18n.ts.flagAsCatDescription }}
						</template>
					</MkSwitch>
				</MkSpacer>
			</div>
		</div>
	</div>
	<div v-else-if="tutorial === 2" :class="$style.body">
		<div>{{ i18n.ts._tutorial.step3_1 }}</div>
		<div>{{ i18n.ts._tutorial.step3_2 }}</div>
		<div>{{ i18n.ts._tutorial.step3_3 }}</div>
		<small :class="$style.small">{{ i18n.ts._tutorial.step3_4 }}</small>
		<div class="llvierxe">
			<MkPostForm ref="form" style="margin: 5;" autofocus/>
		</div>
	</div>
	<div v-else-if="tutorial === 3" :class="$style.body">
		<div>{{ i18n.ts._tutorial.step4_1 }}</div>
		<div>{{ i18n.ts._tutorial.step4_2 }}</div>
	</div>
	<div v-else-if="tutorial === 4" :class="$style.body">
		<div>{{ i18n.ts._tutorial.step5_1 }}</div>
		<I18n :src="i18n.ts._tutorial.step5_2" tag="div">
			<template #featured>
				<div style="font-size: 15px;font-style: italic;">{{ i18n.ts.featured }}</div>
				<XFeatured/>
			</template>
			<template #explore>
				<br><div style="font-size: 15px;font-style: italic;">{{ i18n.ts.explore }}</div>
				<div>
					<MkFoldableSection class="_margin" persist-key="explore-pinned-users">
						<template #header><i class="ti ti-bookmark ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.pinnedUsers }}</template>
						<MkUserList :pagination="pinnedUsers"/>
					</MkFoldableSection>
					<MkFoldableSection class="_margin" persist-key="explore-popular-users">
						<template #header><i class="ti ti-chart-line ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.popularUsers }}</template>
						<MkUserList :pagination="popularUsers"/>
					</MkFoldableSection>
				</div>
			</template>
		</I18n>
		<div>{{ i18n.ts._tutorial.step5_3 }}</div>
		<small :class="$style.small">{{ i18n.ts._tutorial.step5_4 }}</small>
	</div>
	<div v-else-if="tutorial === 5" :class="$style.body">
		<div>{{ i18n.ts._tutorial.step6_1 }}</div>
		<div>{{ i18n.ts._tutorial.step6_2 }}</div>
		<div>{{ i18n.ts._tutorial.step6_3 }}</div>
	</div>
	<div v-else-if="tutorial === 6" :class="$style.body">
		<div>{{ i18n.ts._tutorial.step7_1 }}</div>
		<I18n :src="i18n.ts._tutorial.step7_2" tag="div">
			<template #help>
				<a href="https://misskey-hub.net/help.html" target="_blank" class="_link">{{ i18n.ts.help }}</a>
			</template>
		</I18n>
		<div>{{ i18n.ts._tutorial.step7_3 }}</div>
	</div>
	<div v-else-if="tutorial === 7" :class="$style.body">
		<div>{{ i18n.ts._tutorial.step8_1 }}</div>
		<div>{{ i18n.ts._tutorial.step8_2 }}</div>
		<small :class="$style.small">{{ i18n.ts._tutorial.step8_3 }}</small>
	</div>

	<div :class="$style.footer">
		<template v-if="tutorial === tutorialsNumber - 1">
			<MkPushNotificationAllowButton :class="$style.footerItem" primary show-only-to-register @click="tutorial = -1"/>
			<MkButton :class="$style.footerItem" :primary="false" @click="tutorial = -1">{{ i18n.ts.noThankYou }}</MkButton>
		</template>
		<template v-else>
			<MkButton :class="$style.footerItem" primary @click="tutorial++"><i class="ti ti-check"></i> {{ i18n.ts.next }}</MkButton>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, reactive, watch } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkPostForm from '@/components/MkPostForm.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import XFeatured from './explore.featured.vue';
import { selectFile } from '@/scripts/select-file';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { $i } from '@/account';
import { definePageMetadata } from '@/scripts/page-metadata';
import { claimAchievement } from '@/scripts/achievements';
import { defaultStore } from '@/store';

const tutorialsNumber = 8;

const profile = reactive({
	name: $i.name,
	description: $i.description,
	birthday: $i.birthday,
	isCat: $i.isCat,
});

const pinnedUsers = { endpoint: 'pinned-users' };
const popularUsers = { endpoint: 'users', limit: 5, noPaging: true, params: {
	state: 'alive',
	origin: 'local',
	sort: '+follower',
} };

const tutorial = computed({
	get() { return defaultStore.reactiveState.tutorial.value || 0; },
	set(value) { defaultStore.set('tutorial', value); },
});

watch(() => profile, () => {
	save();
}, {
	deep: true,
});

function save() {
	os.apiWithDialog('i/update', {
		// 空文字列をnullにしたいので??は使うな
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		name: profile.name || null,
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		description: profile.description || null,
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		location: profile.location || null,
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		birthday: profile.birthday || null,
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		lang: profile.lang || null,
		isBot: !!profile.isBot,
		isCat: !!profile.isCat,
		showTimelineReplies: !!profile.showTimelineReplies,
	});
	claimAchievement('profileFilled');
	if (profile.name === 'syuilo' || profile.name === 'しゅいろ') {
		claimAchievement('setNameToSyuilo');
	}
	if (profile.isCat) {
		claimAchievement('markedAsCat');
	}
}

function changeAvatar(ev) {
	selectFile(ev.currentTarget ?? ev.target, i18n.ts.avatar).then(async (file) => {
		let originalOrCropped = file;

		const { canceled } = await os.confirm({
			type: 'question',
			text: i18n.t('cropImageAsk'),
			okText: i18n.ts.cropYes,
			cancelText: i18n.ts.cropNo,
		});

		if (!canceled) {
			originalOrCropped = await os.cropImage(file, {
				aspectRatio: 1,
			});
		}

		const i = await os.apiWithDialog('i/update', {
			avatarId: originalOrCropped.id,
		});
		$i.avatarId = i.avatarId;
		$i.avatarUrl = i.avatarUrl;
		claimAchievement('profileFilled');
	});
}

function changeBanner(ev) {
	selectFile(ev.currentTarget ?? ev.target, i18n.ts.banner).then(async (file) => {
		let originalOrCropped = file;

		const { canceled } = await os.confirm({
			type: 'question',
			text: i18n.t('cropImageAsk'),
			okText: i18n.ts.cropYes,
			cancelText: i18n.ts.cropNo,
		});

		if (!canceled) {
			originalOrCropped = await os.cropImage(file, {
				aspectRatio: 2,
			});
		}

		const i = await os.apiWithDialog('i/update', {
			bannerId: originalOrCropped.id,
		});
		$i.bannerId = i.bannerId;
		$i.bannerUrl = i.bannerUrl;
	});
}

const fields = reactive($i.fields.map(field => ({ name: field.name, value: field.value })));

function addField() {
	fields.push({
		name: '',
		value: '',
	});
}

while (fields.length < 4) {
	addField();
}

function saveFields() {
	os.apiWithDialog('i/update', {
		fields: fields.filter(field => field.name !== '' && field.value !== ''),
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.profile,
	icon: 'ti ti-user',
});
</script>

<style lang="scss" module>
.small {
	opacity: 0.7;
}

.container {
	border: solid 2px var(--accent);
}

.title {
	display: flex;
	flex-wrap: wrap;
	padding: 22px 32px;
	font-weight: bold;

	&Text {
		margin: 4px 0;
		padding-right: 4px;
	}
}

.step {
	margin-left: auto;

	&Arrow {
		padding: 4px;
		&:disabled {
			opacity: 0.5;
		}
		&:first-child {
			padding-right: 8px;
		}
		&:last-child {
			padding-left: 8px;
		}
	}

	&Number {
		font-weight: normal;
		margin: 4px;
	}
}

.body {
	padding: 0 32px;
}

.footer {
	display: flex;
	flex-wrap: wrap;
	flex-direction: row;
	justify-content: right;
	padding: 22px 32px;

	&Item {
		margin: 4px;
	}
}
</style>
<style lang="scss" scoped>
.llvierxe {
	position: relative;
	background-size: cover;
	background-position: center;
	border: solid 1px var(--divider);
	border-radius: 10px;
	overflow: clip;

	> .avatar {
		display: inline-block;
		text-align: center;
		padding: 16px;

		> .avatar {
			display: inline-block;
			width: 72px;
			height: 72px;
			margin: 0 auto 16px auto;
		}
	}

	> .bannerEdit {
		position: absolute;
		top: 16px;
		right: 16px;
	}
}
</style>
