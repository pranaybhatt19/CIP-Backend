import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCommunications1759501230182 implements MigrationInterface {
    name = 'UpdateCommunications1759501230182'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cip_schema"."communications" ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
