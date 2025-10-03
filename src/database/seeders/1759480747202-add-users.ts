import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsers1759480747202 implements MigrationInterface {
    name = 'AddUsers1759480747202'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "cip_schema"."users" 
              ("full_name", "first_name", "middle_name", "last_name", "experience", "email", "password", "reporting_person_id", "designation_id", "is_active", "created_at") 
            VALUES 
              ('Harsh Himmatbhai Rathod', 'Harsh', 'Himmatbhai', 'Rathod', '7/1/2024', 'harshh.rathod@tatvasoft.com', 'Test@1234', 1, 2, true, now()),
              ('Pranay Vasantbhai Bhatt', 'Pranay', 'Vasantbhai', 'Bhatt', '7/1/2024', 'pranay.bhatt@tatvasoft.com', 'Test@1234', 2, 4, true, now()),
              ('Vinitkumar Hemantkumar Mehta', 'Vinitkumar', 'Hemantkumar', 'Mehta', '8/1/2024', 'vinit.mehta@tatvasoft.com', 'Test@1234', 3, 6, true, now());
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
