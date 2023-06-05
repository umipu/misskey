export class PreventAiLarning1683682889948 {
    name = 'PreventAiLarning1683682889948'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "preventAiLarning" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "preventAiLarning"`);
    }
}