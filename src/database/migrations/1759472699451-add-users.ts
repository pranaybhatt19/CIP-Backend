import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsers1759472699451 implements MigrationInterface {
    name = 'AddUsers1759472699451'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "cip_schema"."users" (
                "id" SERIAL NOT NULL,
                "fullname" varchar(100) NOT NULL,
                "first_name" varchar(50) NOT NULL,
                "middle_name" varchar(50) NOT NULL,
                "last_name" varchar(50) NOT NULL,
                "experience" TIMESTAMP,
                "email" VARCHAR(100) NOT NULL UNIQUE,
                "password" VARCHAR(255) NOT NULL,
                "designation_id" INT,
                "reporting_person_id" INT,
                "is_active" BOOLEAN NOT NULL DEFAULT true,
                "is_reset_token_used" boolean DEFAULT false,
                "password_set_token" varchar(255),
                "password_set_expires_at" timestamptz,
                "otp" varchar(10),
                "otp_expiration_time" timestamptz,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP,
                "deleted_at" TIMESTAMP,
                CONSTRAINT "PK_user_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_user_designation_id" FOREIGN KEY ("designation_id") REFERENCES "cip_schema"."designations"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_user_reporting_person_id" FOREIGN KEY ("reporting_person_id") REFERENCES "cip_schema"."users"("id") ON DELETE CASCADE
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
