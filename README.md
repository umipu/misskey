<div align="center">

<h1>🦐 Ebisskey-Focalorus</h1>

---

</div>

[Misskey](https://github.com/misskey-dev/misskey) は、ActivityPubによるサーバー間連合をサポートした、多機能で楽しいSNSです。

Ebisskeyは、Misskeyの最新版に追従しながら、いくつかの追加機能と改善をもたらしています。

[本家 Misskey との違い](DIFFERENCE.md) にて違いを確認できます。

Ebisskey固有のリリースノートは [CHANGELOG-EBISSKEY.md](CHANGELOG-EBISSKEY.md)を参照。

Ebisskey-FocalorusはEbisskeyにさらなる追加機能をもたらしています。

基本的にEbisskeyに追従しています。
## サーバー構築方法

基本的に[Misskey Hubの手順](https://misskey-hub.net/docs/install/manual.html)が適用できます。
ただし、cloneする場合は `https://github.com/umipu/misskey.git` をURLに指定してください。

### 本家 Misskeyから移行する

1. リモートブランチのURLを変更する
  `git remote set-url origin https://github.com/umipu/misskey.git`
2. `git pull`
3. `pnpm install && pnpm build`
4. `pnpm migrate`

###　ブランチについて

本リポジトリは主に3つのブランチがあります

* Master
	* EbisskeyのMasterブランチになります。
* focalorus
	* Ebisskeyに追加機能をもたらしたブランチになります。
* focalorus-dev
	* focalorusブランチのdevelopブランチになります。
