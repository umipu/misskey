export class DisposableEmailDomains1688549569212 {
    name = 'DisposableEmailDomains1688549569212'

    async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" ADD "disposableEmailDomains" character varying(280) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "disposable_email_domain"`);
    }
}
