import { MigrationInterface, QueryRunner } from "typeorm";

export class GetReportingPersonsHierarchy1759732751580
  implements MigrationInterface
{
  name = "GetReportingPersonsHierarchy1759732751580";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DROP FUNCTION IF EXISTS cip_schema.get_reporting_persons_hierarchy(integer);
  
        CREATE FUNCTION cip_schema.get_reporting_persons_hierarchy(
            root_user_id integer
        )
        RETURNS TABLE(
            user_id integer,
            name text
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
            RETURN QUERY
            WITH RECURSIVE user_hierarchy AS (
                SELECT 
                    u.id,
                    concat(u.first_name, ' ', u.last_name)::text AS name
                FROM cip_schema.users u
                WHERE u.id = root_user_id
  
                UNION ALL
  
                SELECT
                    u.id,
                    concat(u.first_name, ' ', u.last_name)::text AS name
                FROM cip_schema.users u
                INNER JOIN user_hierarchy h ON u.reporting_person_id = h.id
            )
            SELECT DISTINCT
                uh.id AS user_id,
                uh.name
            FROM user_hierarchy uh
            WHERE EXISTS (
                SELECT 1 
                FROM cip_schema.users u 
                WHERE u.reporting_person_id = uh.id
            )
            ORDER BY uh.name;
        END;
        $$;
  
      `);
  }

  public async down(): Promise<void> {}
}
