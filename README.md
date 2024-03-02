<div align="center">
<a href="https://misskey-hub.net">
	<img src="./assets/title_float.svg" alt="Misskey logo" style="border-radius:50%" width="400"/>
</a>

**🌎 **[Misskey](https://misskey-hub.net/)** is an open source, decentralized social media platform that's free forever! 🚀**

---

<a href="https://misskey-hub.net/servers/">
		<img src="https://custom-icon-badges.herokuapp.com/badge/find_an-instance-acea31?logoColor=acea31&style=for-the-badge&logo=misskey&labelColor=363B40" alt="find an instance"/></a>

<a href="https://misskey-hub.net/docs/for-admin/install/guides/">
		<img src="https://custom-icon-badges.herokuapp.com/badge/create_an-instance-FBD53C?logoColor=FBD53C&style=for-the-badge&logo=server&labelColor=363B40" alt="create an instance"/></a>

<a href="./CONTRIBUTING.md">
		<img src="https://custom-icon-badges.herokuapp.com/badge/become_a-contributor-A371F7?logoColor=A371F7&style=for-the-badge&logo=git-merge&labelColor=363B40" alt="become a contributor"/></a>

<a href="https://discord.gg/Wp8gVStHW3">
		<img src="https://custom-icon-badges.herokuapp.com/badge/join_the-community-5865F2?logoColor=5865F2&style=for-the-badge&logo=discord&labelColor=363B40" alt="join the community"/></a>

<a href="https://www.patreon.com/syuilo">
		<img src="https://custom-icon-badges.herokuapp.com/badge/become_a-patron-F96854?logoColor=F96854&style=for-the-badge&logo=patreon&labelColor=363B40" alt="become a patron"/></a>

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
