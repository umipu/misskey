/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import type { MiUser, NotesRepository, UserPublickeysRepository, UsersRepository } from '@/models/_.js';
import type { Config } from '@/config.js';
import { MemoryKVCache } from '@/misc/cache.js';
import type { MiUserPublickey } from '@/models/UserPublickey.js';
import { CacheService } from '@/core/CacheService.js';
import type { MiNote } from '@/models/Note.js';
import { bindThis } from '@/decorators.js';
import { MiLocalUser, MiRemoteUser } from '@/models/User.js';
import Logger from '@/logger.js';
import { UtilityService } from '@/core/UtilityService.js';
import { getApId } from './type.js';
import { ApPersonService } from './models/ApPersonService.js';
import { ApLoggerService } from './ApLoggerService.js';
import type { IObject } from './type.js';
import { GlobalEvents } from '@/core/GlobalEventService.js';

export type UriParseResult = {
	/** wether the URI was generated by us */
	local: true;
	/** id in DB */
	id: string;
	/** hint of type, e.g. "notes", "users" */
	type: string;
	/** any remaining text after type and id, not including the slash after id. undefined if empty */
	rest?: string;
} | {
	/** wether the URI was generated by us */
	local: false;
	/** uri in DB */
	uri: string;
};

@Injectable()
export class ApDbResolverService implements OnApplicationShutdown {
	private publicKeyByUserIdCache: MemoryKVCache<MiUserPublickey[] | null>;
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.userPublickeysRepository)
		private userPublickeysRepository: UserPublickeysRepository,

		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,

		private cacheService: CacheService,
		private apPersonService: ApPersonService,
		private apLoggerService: ApLoggerService,
		private utilityService: UtilityService,
	) {
		this.publicKeyByUserIdCache = new MemoryKVCache<MiUserPublickey[] | null>(Infinity);
		this.logger = this.apLoggerService.logger.createSubLogger('db-resolver');
		this.redisForSub.on('message', this.onMessage);
	}

	private punyHost(url: string): string {
		const urlObj = new URL(url);
		const host = `${this.utilityService.toPuny(urlObj.hostname)}${urlObj.port.length > 0 ? ':' + urlObj.port : ''}`;
		return host;
	}

	@bindThis
	public parseUri(value: string | IObject): UriParseResult {
		const separator = '/';

		const uri = new URL(getApId(value));
		if (uri.origin !== this.config.url) return { local: false, uri: uri.href };

		const [, type, id, ...rest] = uri.pathname.split(separator);
		return {
			local: true,
			type,
			id,
			rest: rest.length === 0 ? undefined : rest.join(separator),
		};
	}

	/**
	 * AP Note => Misskey Note in DB
	 */
	@bindThis
	public async getNoteFromApId(value: string | IObject): Promise<MiNote | null> {
		const parsed = this.parseUri(value);

		if (parsed.local) {
			if (parsed.type !== 'notes') return null;

			return await this.notesRepository.findOneBy({
				id: parsed.id,
			});
		} else {
			return await this.notesRepository.findOneBy({
				uri: parsed.uri,
			});
		}
	}

	/**
	 * AP Person => Misskey User in DB
	 */
	@bindThis
	public async getUserFromApId(value: string | IObject): Promise<MiLocalUser | MiRemoteUser | null> {
		const parsed = this.parseUri(value);

		if (parsed.local) {
			if (parsed.type !== 'users') return null;

			return await this.cacheService.userByIdCache.fetchMaybe(
				parsed.id,
				() => this.usersRepository.findOneBy({ id: parsed.id, isDeleted: false }).then(x => x ?? undefined),
			) as MiLocalUser | undefined ?? null;
		} else {
			return await this.cacheService.uriPersonCache.fetch(
				parsed.uri,
				() => this.usersRepository.findOneBy({ uri: parsed.uri, isDeleted: false }),
			) as MiRemoteUser | null;
		}
	}

	@bindThis
	private async refreshAndFindKey(userId: MiUser['id'], keyId: string): Promise<MiUserPublickey | null> {
		this.refreshCacheByUserId(userId);
		const keys = await this.getPublicKeyByUserId(userId);
		if (keys == null || !Array.isArray(keys) || keys.length === 0) {
			this.logger.warn(`No key found (refreshAndFindKey) userId=${userId} keyId=${keyId} keys=${JSON.stringify(keys)}`);
			return null;
		}
		const exactKey = keys.find(x => x.keyId === keyId);
		if (exactKey) return exactKey;
		this.logger.warn(`No exact key found (refreshAndFindKey) userId=${userId} keyId=${keyId} keys=${JSON.stringify(keys)}`);
		return null;
	}

	/**
	 * AP Actor id => Misskey User and Key
	 * @param uri AP Actor id
	 * @param keyId Key id to find. If not specified, main key will be selected.
	 * @returns
	 *	1. `null` if the user and key host do not match
	 *	2. `{ user: null, key: null }` if the user is not found
	 *	3. `{ user: MiRemoteUser, key: null }` if key is not found
	 *  4. `{ user: MiRemoteUser, key: MiUserPublickey }` if both are found
	 */
	@bindThis
	public async getAuthUserFromApId(uri: string, keyId?: string): Promise<{
		user: MiRemoteUser;
		key: MiUserPublickey | null;
	} | {
		user: null;
		key: null;
	} |
	null> {
		if (keyId) {
			if (this.punyHost(uri) !== this.punyHost(keyId)) {
				/**
				 * keyIdはURL形式かつkeyIdのホストはuriのホストと一致するはず
				 * （ApPersonService.validateActorに由来）
				 *
				 * ただ、Mastodonはリプライ関連で他人のトゥートをHTTP Signature署名して送ってくることがある
				 * そのような署名は有効性に疑問があるので無視することにする
				 * ここではuriとkeyIdのホストが一致しない場合は無視する
				 * ハッシュをなくしたkeyIdとuriの同一性を比べてみてもいいが、`uri#*-key`というkeyIdを設定するのが
				 * 決まりごとというわけでもないため幅を持たせることにする
				 *
				 *
				 * The keyId should be in URL format and its host should match the host of the uri
				 * (derived from ApPersonService.validateActor)
				 *
				 * However, Mastodon sometimes sends toots from other users with HTTP Signature signing for reply-related purposes
				 * Such signatures are of questionable validity, so we choose to ignore them
				 * Here, we ignore cases where the hosts of uri and keyId do not match
				 * We could also compare the equality of keyId without the hash and uri, but since setting a keyId like `uri#*-key`
				 * is not a strict rule, we decide to allow for some flexibility
				 */
				this.logger.warn(`actor uri and keyId are not matched uri=${uri} keyId=${keyId}`);
				return null;
			}
		}

		const user = await this.apPersonService.resolvePerson(uri, undefined, true) as MiRemoteUser;
		if (user.isDeleted) return { user: null, key: null };

		const keys = await this.getPublicKeyByUserId(user.id);

		if (keys == null || !Array.isArray(keys) || keys.length === 0) {
			this.logger.warn(`No key found uri=${uri} userId=${user.id} keys=${JSON.stringify(keys)}`);
			return { user, key: null };
		}

		if (!keyId) {
			// Choose the main-like
			const mainKey = keys.find(x => {
				try {
					const url = new URL(x.keyId);
					const path = url.pathname.split('/').pop()?.toLowerCase();
					if (url.hash) {
						if (url.hash.toLowerCase().includes('main')) {
							return true;
						}
					} else if (path?.includes('main') || path === 'publickey') {
						return true;
					}
				} catch { /* noop */ }

				return false;
			});
			return { user, key: mainKey ?? keys[0] };
		}

		const exactKey = keys.find(x => x.keyId === keyId);
		if (exactKey) return { user, key: exactKey };

		/**
		 * keyIdで見つからない場合、まずはキャッシュを更新して再取得
		 * If not found with keyId, update cache and reacquire
		 */
		const cacheRaw = this.publicKeyByUserIdCache.cache.get(user.id);
		if (cacheRaw && cacheRaw.date > Date.now() - 1000 * 60 * 12) {
			const exactKey = await this.refreshAndFindKey(user.id, keyId);
			if (exactKey) return { user, key: exactKey };
		}

		/**
		 * lastFetchedAtでの更新制限を弱めて再取得
		 * Reacquisition with weakened update limit at lastFetchedAt
		 */
		if (user.lastFetchedAt == null || user.lastFetchedAt < new Date(Date.now() - 1000 * 60 * 12)) {
			this.logger.info(`Fetching user to find public key uri=${uri} userId=${user.id} keyId=${keyId}`);
			const renewed = await this.apPersonService.fetchPersonWithRenewal(uri, 0);
			if (renewed == null || renewed.isDeleted) return null;

			return { user, key: await this.refreshAndFindKey(user.id, keyId) };
		}

		this.logger.warn(`No key found uri=${uri} userId=${user.id} keyId=${keyId}`);
		return { user, key: null };
	}

	@bindThis
	public async getPublicKeyByUserId(userId: MiUser['id']): Promise<MiUserPublickey[] | null> {
		return await this.publicKeyByUserIdCache.fetch(
			userId,
			() => this.userPublickeysRepository.find({ where: { userId } }),
			v => v != null,
		);
	}

	@bindThis
	public refreshCacheByUserId(userId: MiUser['id']): void {
		this.publicKeyByUserIdCache.delete(userId);
		for (const [k, v] of this.publicKeyCache.cache.entries()) {
			if (v.value?.userId === userId) {
				this.publicKeyCache.delete(k);
			}
		}
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);
		if (obj.channel === 'internal') {
			const { type, body } = obj.message as GlobalEvents['internal']['payload'];
			switch (type) {
				case 'remoteUserUpdated': {
					this.refreshCacheByUserId(body.id);
					break;
				}
				default:
					break;
			}
		}
	}

	@bindThis
	public dispose(): void {
		this.publicKeyByUserIdCache.dispose();
		this.redisForSub.off('message', this.onMessage);
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
