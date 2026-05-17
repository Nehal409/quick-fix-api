import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProvidersTable1779051061832 implements MigrationInterface {
    name = 'CreateProvidersTable1779051061832'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "providers" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "name" character varying NOT NULL, "phone" character varying, "location" character varying, "service_categories" text NOT NULL DEFAULT '', "specialization_tags" text NOT NULL DEFAULT '', "rating" numeric(3,2) NOT NULL DEFAULT '0', "on_time_percent" numeric(5,4) NOT NULL DEFAULT '1', "cancel_rate" numeric(5,4) NOT NULL DEFAULT '0', "total_jobs" integer NOT NULL DEFAULT '0', "service_area_km" integer NOT NULL DEFAULT '10', "is_available" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_842a46f6b0079a69520561eeb6" UNIQUE ("user_id"), CONSTRAINT "PK_af13fc2ebf382fe0dad2e4793aa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "location" character varying`);
        await queryRunner.query(`ALTER TABLE "providers" ADD CONSTRAINT "FK_842a46f6b0079a69520561eeb62" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "providers" DROP CONSTRAINT "FK_842a46f6b0079a69520561eeb62"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "location"`);
        await queryRunner.query(`DROP TABLE "providers"`);
    }

}
