import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocationToUsers1779049958158 implements MigrationInterface {
    name = 'AddLocationToUsers1779049958158'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "location" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "location"`);
    }

}
