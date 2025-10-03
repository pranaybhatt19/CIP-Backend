import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInitialUser1759478959842 implements MigrationInterface {
    name = 'AddInitialUser1759478959842'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "cip_schema"."users" 
              ("full_name", "first_name", "middle_name", "last_name", "experience", "email", "password", "reporting_person_id", "designation_id", "is_active", "created_at") 
            VALUES 
              ('Dipal Mukeshbhai Patel', 'Dipal', 'Mukeshbhai', 'Patel', '10/1/2010', 'dipal.patel@tatvasoft.com', 'Test@1234', null, 1, true, now());
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
