import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsersLocationColumns1779264164878 implements MigrationInterface {
    name = 'AddUsersLocationColumns1779264164878';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "city" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "sector" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "sector"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "city"`);
    }
}
