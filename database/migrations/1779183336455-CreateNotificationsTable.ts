import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable1779183336455 implements MigrationInterface {
    name = 'CreateNotificationsTable1779183336455';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "notifications" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" integer NOT NULL, "booking_id" integer, "request_id" integer, "type" character varying(16) NOT NULL, "tone" character varying(16) NOT NULL, "icon" character varying(32) NOT NULL, "title" character varying(160) NOT NULL, "body" text NOT NULL, "cta" jsonb, "metadata" jsonb, "read_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_84989adc90ebf9f1c9b7ba66f0a" UNIQUE ("uuid"), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_9a8a82462cab47c73d25f49261" ON "notifications" ("user_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_8d19d2ba2fddbaca8c227048d5" ON "notifications" ("read_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_77ee7b06d6f802000c0846f3a5" ON "notifications" ("created_at") `,
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" ADD CONSTRAINT "FK_3f5c2196c2b2af99a4697e51741" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" ADD CONSTRAINT "FK_405532c368aba2c29129e583830" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "notifications" DROP CONSTRAINT "FK_405532c368aba2c29129e583830"`,
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" DROP CONSTRAINT "FK_3f5c2196c2b2af99a4697e51741"`,
        );
        await queryRunner.query(
            `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
        );
        await queryRunner.query(`DROP INDEX "public"."IDX_77ee7b06d6f802000c0846f3a5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8d19d2ba2fddbaca8c227048d5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9a8a82462cab47c73d25f49261"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
    }
}
