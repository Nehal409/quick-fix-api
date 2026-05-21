import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAgenticTables1779092802372 implements MigrationInterface {
    name = 'CreateAgenticTables1779092802372';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."service_requests_status_enum" AS ENUM('pending', 'needs_clarification', 'ready', 'failed')`,
        );
        await queryRunner.query(
            `CREATE TABLE "service_requests" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" integer NOT NULL, "raw_input" text NOT NULL, "language" character varying(16), "location_hint" jsonb, "parsed_intent" jsonb, "clarifications" jsonb, "clarification_answers" jsonb, "confidence" real, "status" "public"."service_requests_status_enum" NOT NULL DEFAULT 'pending', "ranked_candidates" jsonb, "ranking_summary" text, "pricing_quote" jsonb, "trace_id" character varying(64), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2ef9a5be940be9d41bdc526ccfa" UNIQUE ("uuid"), CONSTRAINT "PK_ee60bcd826b7e130bfbd97daf66" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_c38549a33af09d8cf92e9878a1" ON "service_requests" ("user_id") `,
        );
        await queryRunner.query(
            `CREATE TABLE "providers" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" integer NOT NULL, "display_name" character varying NOT NULL, "service_categories" text array NOT NULL, "specialization_tags" text array NOT NULL DEFAULT '{}', "service_areas" text array NOT NULL, "home_sector" character varying NOT NULL, "home_city" character varying NOT NULL, "home_lat" double precision, "home_lng" double precision, "experience_years" integer NOT NULL, "rating" real NOT NULL DEFAULT '0', "review_count" integer NOT NULL DEFAULT '0', "on_time_percent" real NOT NULL DEFAULT '0', "cancel_rate" real NOT NULL DEFAULT '0', "completed_jobs_30d" integer NOT NULL DEFAULT '0', "base_visit_fee" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_83c3cd1e464e41f9c94071f1bce" UNIQUE ("uuid"), CONSTRAINT "UQ_842a46f6b0079a69520561eeb62" UNIQUE ("user_id"), CONSTRAINT "REL_842a46f6b0079a69520561eeb6" UNIQUE ("user_id"), CONSTRAINT "PK_af13fc2ebf382fe0dad2e4793aa" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."bookings_status_enum" AS ENUM('pending', 'confirmed', 'en_route', 'in_progress', 'completed', 'cancelled_by_customer', 'cancelled_by_provider', 'rescheduled', 'disputed')`,
        );
        await queryRunner.query(
            `CREATE TABLE "bookings" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "booking_code" character varying(24) NOT NULL, "request_id" integer NOT NULL, "customer_id" integer NOT NULL, "provider_id" integer NOT NULL, "scheduled_at" TIMESTAMP NOT NULL, "address" jsonb NOT NULL, "service" jsonb NOT NULL, "provider_snapshot" jsonb NOT NULL, "customer_snapshot" jsonb NOT NULL, "quoted_total" integer NOT NULL, "final_total" integer, "pricing_quote" jsonb NOT NULL, "payment_method" character varying(16) NOT NULL DEFAULT 'cash', "status" "public"."bookings_status_enum" NOT NULL DEFAULT 'confirmed', "status_timeline" jsonb NOT NULL DEFAULT '[]', "cancel_reason" character varying(32), "cancelled_by" character varying(16), "cancel_note" text, "trace_id" character varying(64), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_3a5b02cbe556f2f6bea8f06f0b1" UNIQUE ("uuid"), CONSTRAINT "UQ_796e0227e4beff186bdd72ac53b" UNIQUE ("booking_code"), CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_796e0227e4beff186bdd72ac53" ON "bookings" ("booking_code") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_1059fbd660c42c0bb119c177ac" ON "bookings" ("request_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_8e21b7ae33e7b0673270de4146" ON "bookings" ("customer_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_aae90d7b26a7414deb4029ca1b" ON "bookings" ("provider_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_48b267d894e32a25ebde4b207a" ON "bookings" ("status") `,
        );
        await queryRunner.query(
            `ALTER TABLE "service_requests" ADD CONSTRAINT "FK_c38549a33af09d8cf92e9878a17" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "providers" ADD CONSTRAINT "FK_842a46f6b0079a69520561eeb62" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "bookings" ADD CONSTRAINT "FK_1059fbd660c42c0bb119c177ac2" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "bookings" ADD CONSTRAINT "FK_8e21b7ae33e7b0673270de4146f" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "bookings" ADD CONSTRAINT "FK_aae90d7b26a7414deb4029ca1b3" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "bookings" DROP CONSTRAINT "FK_aae90d7b26a7414deb4029ca1b3"`,
        );
        await queryRunner.query(
            `ALTER TABLE "bookings" DROP CONSTRAINT "FK_8e21b7ae33e7b0673270de4146f"`,
        );
        await queryRunner.query(
            `ALTER TABLE "bookings" DROP CONSTRAINT "FK_1059fbd660c42c0bb119c177ac2"`,
        );
        await queryRunner.query(
            `ALTER TABLE "providers" DROP CONSTRAINT "FK_842a46f6b0079a69520561eeb62"`,
        );
        await queryRunner.query(
            `ALTER TABLE "service_requests" DROP CONSTRAINT "FK_c38549a33af09d8cf92e9878a17"`,
        );
        await queryRunner.query(`DROP INDEX "public"."IDX_48b267d894e32a25ebde4b207a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aae90d7b26a7414deb4029ca1b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8e21b7ae33e7b0673270de4146"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1059fbd660c42c0bb119c177ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_796e0227e4beff186bdd72ac53"`);
        await queryRunner.query(`DROP TABLE "bookings"`);
        await queryRunner.query(`DROP TYPE "public"."bookings_status_enum"`);
        await queryRunner.query(`DROP TABLE "providers"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c38549a33af09d8cf92e9878a1"`);
        await queryRunner.query(`DROP TABLE "service_requests"`);
        await queryRunner.query(`DROP TYPE "public"."service_requests_status_enum"`);
    }
}
