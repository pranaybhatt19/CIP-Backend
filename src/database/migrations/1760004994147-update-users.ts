import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUsers1760004994147 implements MigrationInterface {
    name = 'UpdateUsers1760004994147'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cip_schema"."users" ADD COLUMN IF NOT EXISTS medium_of_education varchar(100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
