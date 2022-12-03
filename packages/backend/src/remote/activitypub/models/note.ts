import promiseLimit from 'promise-limit';

import config from '@/config/index.js';
import post from '@/services/note/create.js';
import type { CacheableRemoteUser } from '@/models/entities/user.js';
import { unique, toArray, toSingle } from '@/prelude/array.js';
import vote from '@/services/note/polls/vote.js';
import type { DriveFile } from '@/models/entities/drive-file.js';
import { deliverQuestionUpdate } from '@/services/note/polls/update.js';
import { extractDbHost, toPuny } from '@/misc/convert-host.js';
import { Emojis, Polls, MessagingMessages } from '@/models/index.js';
import type { Note } from '@/models/entities/note.js';
import type { Emoji } from '@/models/entities/emoji.js';
import { genId } from '@/misc/gen-id.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { getApLock } from '@/misc/app-lock.js';
import { createMessage } from '@/services/messages/create.js';
import DbResolver from '../db-resolver.js';
import { StatusError } from '@/misc/fetch.js';
import { getOneApId, getApId, getOneApHrefNullable, validPost, isEmoji, getApType } from '../type.js';
import { parseAudience } from '../audience.js';
import { apLogger } from '../logger.js';
import { htmlToMfm } from '../misc/html-to-mfm.js';
import Resolver from '../resolver.js';
import { extractApMentions } from './mention.js';
import { extractPollFromQuestion } from './question.js';
import { extractApHashtags } from './tag.js';
import { resolveImage } from './image.js';
import { resolvePerson } from './person.js';
import type { IObject, IPost } from '../type.js';

const logger = apLogger;

export function validateNote(object: any, uri: string) {
	const expectHost = extractDbHost(uri);

	if (object == null) {
		return new Error('invalid Note: object is null');
	}

	if (!validPost.includes(getApType(object))) {
		return new Error(`invalid Note: invalid object type ${getApType(object)}`);
	}

	if (object.id && extractDbHost(object.id) !== expectHost) {
		return new Error(`invalid Note: id has different host. expected: ${expectHost}, actual: ${extractDbHost(object.id)}`);
	}

	if (object.attributedTo && extractDbHost(getOneApId(object.attributedTo)) !== expectHost) {
		return new Error(`invalid Note: attributedTo has different host. expected: ${expectHost}, actual: ${extractDbHost(object.attributedTo)}`);
	}

	return null;
}

/**
 * Noteをフェッチします。
 *
 * Misskeyに対象のNoteが登録されていればそれを返します。
 */
export async function fetchNote(object: string | IObject): Promise<Note | null> {
	const dbResolver = new DbResolver();
	return await dbResolver.getNoteFromApId(object);
}

/**
 * Noteを作成します。
 */
export async function createNote(value: string | IObject, resolver?: Resolver, silent = false): Promise<Note | null> {
	if (resolver == null) resolver = new Resolver();

	const object: any = await resolver.resolve(value);

	const entryUri = getApId(value);
	const err = validateNote(object, entryUri);
	if (err) {
		logger.error(`${err.message}`, {
			resolver: {
				history: resolver.getHistory(),
			},
			value: value,
			object: object,
		});
		throw new Error('invalid note');
	}

	const note: IPost = object;

	logger.debug(`Note fetched: ${JSON.stringify(note, null, 2)}`);

	logger.info(`Creating the Note: ${note.id}`);

	// 投稿者をフェッチ
	const actor = await resolvePerson(getOneApId(note.attributedTo), resolver) as CacheableRemoteUser;

	// 投稿者が凍結されていたらスキップ
	if (actor.isSuspended) {
		throw new Error('actor has been suspended');
	}

	const noteAudience = await parseAudience(actor, note.to, note.cc, resolver);
	let visibility = noteAudience.visibility;
	const visibleUsers = noteAudience.visibleUsers;

	// Audience (to, cc) が指定されてなかった場合
	if (visibility === 'specified' && visibleUsers.length === 0) {
		if (typeof value === 'string') {	// 入力がstringならばresolverでGETが発生している
			// こちらから匿名GET出来たものならばpublic
			visibility = 'public';
		}
	}

	const apMentions = await extractApMentions(note.tag, resolver);
	const apHashtags = await extractApHashtags(note.tag);

	// 添付ファイル
	// TODO: attachmentは必ずしもImageではない
	// TODO: attachmentは必ずしも配列ではない
	// Noteがsensitiveなら添付もsensitiveにする
	const limit = promiseLimit(2);

	note.attachment = Array.isArray(note.attachment) ? note.attachment : note.attachment ? [note.attachment] : [];
	const files = note.attachment
		.map(attach => attach.sensitive = note.sensitive)
		? (await Promise.all(note.attachment.map(x => limit(() => resolveImage(actor, x)) as Promise<DriveFile>)))
			.filter(image => image != null)
		: [];

	// リプライ
	const reply: Note | null = note.inReplyTo
		? await resolveNote(note.inReplyTo, resolver).then(x => {
			if (x == null) {
				logger.warn('Specified inReplyTo, but nout found');
				throw new Error('inReplyTo not found');
			} else {
				return x;
			}
		}).catch(async e => {
			// トークだったらinReplyToのエラーは無視
			const uri = getApId(note.inReplyTo);
			if (uri.startsWith(config.url + '/')) {
				const id = uri.split('/').pop();
				const talk = await MessagingMessages.findOneBy({ id });
				if (talk) {
					return null;
				}
			}

			logger.warn(`Error in inReplyTo ${note.inReplyTo} - ${e.statusCode || e}`);
			throw e;
		})
		: null;

	// 引用
	let quote: Note | undefined | null;

	if (note._misskey_quote || note.quoteUrl) {
		const tryResolveNote = async (uri: string): Promise<{
			status: 'ok';
			res: Note | null;
		} | {
			status: 'permerror' | 'temperror';
		}> => {
			if (typeof uri !== 'string' || !uri.match(/^https?:/)) return { status: 'permerror' };
			try {
				const res = await resolveNote(uri);
				if (res) {
					return {
						status: 'ok',
						res,
					};
				} else {
					return {
						status: 'permerror',
					};
				}
			} catch (e) {
				return {
					status: (e instanceof StatusError && e.isClientError) ? 'permerror' : 'temperror',
				};
			}
		};

		const uris = unique([note._misskey_quote, note.quoteUrl].filter((x): x is string => typeof x === 'string'));
		const results = await Promise.all(uris.map(uri => tryResolveNote(uri)));

		quote = results.filter((x): x is { status: 'ok', res: Note | null } => x.status === 'ok').map(x => x.res).find(x => x);
		if (!quote) {
			if (results.some(x => x.status === 'temperror')) {
				throw 'quote resolve failed';
			}
		}
	}

	const cw = note.summary === '' ? null : note.summary;

	// テキストのパース
	let text: string | null = null;
	if (note.source?.mediaType === 'text/x.misskeymarkdown' && typeof note.source.content === 'string') {
		text = note.source.content;
	} else if (typeof note._misskey_content !== 'undefined') {
		text = note._misskey_content;
	} else if (typeof note.content === 'string') {
		text = htmlToMfm(note.content, note.tag);
	}

	// vote
	if (reply && reply.hasPoll) {
		const poll = await Polls.findOneByOrFail({ noteId: reply.id });

		const tryCreateVote = async (name: string, index: number): Promise<null> => {
			if (poll.expiresAt && Date.now() > new Date(poll.expiresAt).getTime()) {
				logger.warn(`vote to expired poll from AP: actor=${actor.username}@${actor.host}, note=${note.id}, choice=${name}`);
			} else if (index >= 0) {
				logger.info(`vote from AP: actor=${actor.username}@${actor.host}, note=${note.id}, choice=${name}`);
				await vote(actor, reply, index);

				// リモートフォロワーにUpdate配信
				deliverQuestionUpdate(reply.id);
			}
			return null;
		};

		if (note.name) {
			return await tryCreateVote(note.name, poll.choices.findIndex(x => x === note.name));
		}
	}

	const emojis = await extractEmojis(note.tag || [], actor.host).catch(e => {
		logger.info(`extractEmojis: ${e}`);
		return [] as Emoji[];
	});

	const apEmojis = emojis.map(emoji => emoji.name);

	const poll = await extractPollFromQuestion(note, resolver).catch(() => undefined);

	return await post(actor, {
		createdAt: note.published ? new Date(note.published) : null,
		files,
		reply,
		renote: quote,
		name: note.name,
		cw,
		text,
		localOnly: false,
		visibility,
		visibleUsers,
		apMentions,
		apHashtags,
		apEmojis,
		poll,
		uri: note.id,
		url: getOneApHrefNullable(note.url),
	}, silent);
}

/**
 * Noteを解決します。
 *
 * Misskeyに対象のNoteが登録されていればそれを返し、そうでなければ
 * リモートサーバーからフェッチしてMisskeyに登録しそれを返します。
 */
export async function resolveNote(value: string | IObject, resolver?: Resolver): Promise<Note | null> {
	const uri = typeof value === 'string' ? value : value.id;
	if (uri == null) throw new Error('missing uri');

	// ブロックしてたら中断
	const meta = await fetchMeta();
	if (meta.blockedHosts.includes(extractDbHost(uri))) throw { statusCode: 451 };

	const unlock = await getApLock(uri);

	try {
		//#region このサーバーに既に登録されていたらそれを返す
		const exist = await fetchNote(uri);

		if (exist) {
			return exist;
		}
		//#endregion

		if (uri.startsWith(config.url)) {
			throw new StatusError('cannot resolve local note', 400, 'cannot resolve local note');
		}

		// リモートサーバーからフェッチしてきて登録
		// ここでuriの代わりに添付されてきたNote Objectが指定されていると、サーバーフェッチを経ずにノートが生成されるが
		// 添付されてきたNote Objectは偽装されている可能性があるため、常にuriを指定してサーバーフェッチを行う。
		return await createNote(uri, resolver, true);
	} finally {
		unlock();
	}
}

export async function extractEmojis(tags: IObject | IObject[], host: string): Promise<Emoji[]> {
	host = toPuny(host);

	if (!tags) return [];

	const eomjiTags = toArray(tags).filter(isEmoji);

	return await Promise.all(eomjiTags.map(async tag => {
		const name = tag.name!.replace(/^:/, '').replace(/:$/, '');
		tag.icon = toSingle(tag.icon);

		const exists = await Emojis.findOneBy({
			host,
			name,
		});

		if (exists) {
			if ((tag.updated != null && exists.updatedAt == null)
				|| (tag.id != null && exists.uri == null)
				|| (tag.updated != null && exists.updatedAt != null && new Date(tag.updated) > exists.updatedAt)
				|| (tag.icon!.url !== exists.originalUrl)
			) {
				await Emojis.update({
					host,
					name,
				}, {
					uri: tag.id,
					originalUrl: tag.icon!.url,
					publicUrl: tag.icon!.url,
					updatedAt: new Date(),
				});

				return await Emojis.findOneBy({
					host,
					name,
				}) as Emoji;
			}

			return exists;
		}

		logger.info(`register emoji host=${host}, name=${name}`);

		return await Emojis.insert({
			id: genId(),
			host,
			name,
			uri: tag.id,
			originalUrl: tag.icon!.url,
			publicUrl: tag.icon!.url,
			updatedAt: new Date(),
			aliases: [],
		} as Partial<Emoji>).then(x => Emojis.findOneByOrFail(x.identifiers[0]));
	}));
}
