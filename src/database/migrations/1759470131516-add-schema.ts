import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSchema1759470131516 implements MigrationInterface {
    name = 'AddSchema1759470131516'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE SCHEMA IF NOT EXISTS cip_schema;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
