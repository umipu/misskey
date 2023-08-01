/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class PlayVisibility1689102832143 {
		name = 'PlayVisibility1690796169261'

		async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "public"."flash" ADD "visibility" "page_visibility_enum" NOT NULL DEFAULT 'public'`, undefined);
			await queryRunner.query(`ALTER TABLE "public"."flash" ADD "visibleUserIds" character varying(32) array NOT NULL DEFAULT '{}'::varchar[]`)
		}
		async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "public"."flash" DROP COLUMN "visibility"`, undefined);
			await queryRunner.query(`ALTER TABLE "public"."flash" DROP COLUMN "visibleUserIds"`, undefined);
		}
}
