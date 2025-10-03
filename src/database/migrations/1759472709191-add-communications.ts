import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommunications1759472709191 implements MigrationInterface {
    name = 'AddCommunications1759472709191'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "cip_schema"."communications" (
              "id" SERIAL NOT NULL,
              "user_id" INT NOT NULL,
              "link" varchar(750) NOT NULL,
              "feedback" VARCHAR(1000),
              "date" TIMESTAMP NOT NULL,
              "created_at" TIMESTAMP NOT NULL DEFAULT now(),
              "updated_at" TIMESTAMP,
              "deleted_at" TIMESTAMP,
              CONSTRAINT "PK_communication_id" PRIMARY KEY ("id"),
              CONSTRAINT "FK_communication_user" FOREIGN KEY ("user_id") REFERENCES "cip_schema"."users"("id") ON DELETE CASCADE
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
