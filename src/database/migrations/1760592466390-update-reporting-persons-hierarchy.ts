import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateReportingPersonsHierarchy1760592466390
  implements MigrationInterface
{
  name = "UpdateReportingPersonsHierarchy1760592466390";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DROP FUNCTION IF EXISTS cip_schema.get_reporting_persons_hierarchy(integer);
        `);
  }

  public async down(): Promise<void> {}
}
