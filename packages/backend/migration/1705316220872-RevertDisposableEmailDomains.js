export class RevertDisposableEmailDomains1705316220872 {
	name = 'RevertDisposableEmailDomains1705316220872'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "disposable_email_domain"`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" ADD "disposableEmailDomains" character varying(280) array NOT NULL DEFAULT '{}'`);
	}
}
