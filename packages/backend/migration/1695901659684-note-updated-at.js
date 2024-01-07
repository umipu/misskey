export class NoteUpdatedAt1695901659684 {
    name = 'NoteUpdatedAt1695901659684'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" ADD "updatedAt" TIMESTAMP WITH TIME ZONE`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "updatedAt"`);
    }
}
