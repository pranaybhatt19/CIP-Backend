import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDesignations1759477646014 implements MigrationInterface {
    name = 'AddDesignations1759477646014'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "cip_schema"."designations" ("name", "created_at")
            VALUES 
                ('PM', now()), 
                ('APM', now()),
                ('STL', now()),
                ('TL', now()),
                ('SSE', now()),
                ('SE', now()),
                ('ASE', now()),
                ('TSE', now());
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
