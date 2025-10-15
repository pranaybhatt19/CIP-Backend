import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTags1760526637212 implements MigrationInterface {
    name = 'AddTags1760526637212'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "cip_schema"."tags" (
              "id" SERIAL NOT NULL,
              "user_id" integer,
              "tag" VARCHAR(200) NOT NULL,
              "created_at" TIMESTAMP NOT NULL DEFAULT now(),
              "updated_at" TIMESTAMP,
              "deleted_at" TIMESTAMP,
              CONSTRAINT "PK_tags_id" PRIMARY KEY ("id"),
              CONSTRAINT "FK_tags_user" FOREIGN KEY ("user_id") REFERENCES "cip_schema"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
