import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDesignations1759470292189 implements MigrationInterface {
    name = 'AddDesignations1759470292189'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "cip_schema"."designations" (
              "id" SERIAL NOT NULL,
              "name" VARCHAR(100) NOT NULL,
              "created_at" TIMESTAMP NOT NULL DEFAULT now(),
              "updated_at" TIMESTAMP,
              "deleted_at" TIMESTAMP,
              CONSTRAINT "PK_designation_id" PRIMARY KEY ("id")
            );
        `); 
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
