DROP FUNCTION IF EXISTS cip_schema.get_user_hierarchy(
      integer, text, integer[], integer[], text, numeric, text, numeric, integer, integer, text, text
      );

      CREATE FUNCTION cip_schema.get_user_hierarchy(
          root_user_id integer,
          name_filter text,
          designation_ids integer[],
          reporting_person_ids integer[],
          experience_type text,
          experience_value numeric,
          attempts_type text,
          attempts_value numeric,
          last_comm_exact timestamp,
          last_comm_from timestamp,
          last_comm_to timestamp,
          limit_val integer,
          offset_val integer,
          order_field text,
          order_direction text
      )
      RETURNS TABLE(
          total_count bigint,
          user_id integer,
          full_name text,
          email text,
          reporting_person json,
          designation json,
          experience_years numeric,
          attempts_count bigint,
          last_communication_date timestamp
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
          RETURN QUERY
          WITH RECURSIVE user_hierarchy AS (
              SELECT 
                  u.id,
                  u.full_name::text,
                  u.email::text,
                  u.reporting_person_id,
                  rp.full_name::text AS reporting_person_name,
                  u.designation_id,
                  d.name::text AS designation_name,
                  u.is_active,
                  (DATE_PART('year', AGE(NOW(), u.experience)) 
                      + DATE_PART('month', AGE(NOW(), u.experience)) / 100)::numeric AS experience_years
              FROM cip_schema.users u
              LEFT JOIN cip_schema.users rp ON rp.id = u.reporting_person_id
              LEFT JOIN cip_schema.designations d ON d.id = u.designation_id
              WHERE u.id = root_user_id

              UNION ALL

              SELECT
                  u.id,
                  u.full_name::text,
                  u.email::text,
                  u.reporting_person_id,
                  rp.full_name::text AS reporting_person_name,
                  u.designation_id,
                  d.name::text AS designation_name,
                  u.is_active,
                  (DATE_PART('year', AGE(NOW(), u.experience)) 
                      + DATE_PART('month', AGE(NOW(), u.experience)) / 100)::numeric AS experience_years
              FROM cip_schema.users u
              INNER JOIN user_hierarchy h ON u.reporting_person_id = h.id
              LEFT JOIN cip_schema.users rp ON rp.id = u.reporting_person_id
              LEFT JOIN cip_schema.designations d ON d.id = u.designation_id
          ),

          user_with_comms AS (
              SELECT
                  uh.*,
                  COALESCE(COUNT(cm.user_id), 0)::bigint AS attempts_count,
                  MAX(cm.date)::timestamp AS last_communication_date
              FROM user_hierarchy uh
              LEFT JOIN cip_schema.communications cm ON cm.user_id = uh.id AND cm.is_deleted = false
              GROUP BY 
                  uh.id, uh.full_name, uh.email, uh.reporting_person_id,
                  uh.reporting_person_name, uh.designation_id, uh.designation_name,
                  uh.is_active, uh.experience_years
          ),

          filtered_hierarchy AS (
              SELECT *
              FROM user_with_comms uh
              WHERE
                  (name_filter IS NULL OR uh.full_name ILIKE '%' || name_filter || '%')
                  AND (designation_ids IS NULL OR uh.designation_id = ANY(designation_ids))
                  AND (reporting_person_ids IS NULL OR uh.reporting_person_id = ANY(reporting_person_ids))
                  AND (
                      experience_type IS NULL OR experience_value IS NULL OR
                      (experience_type = 'LESS_THAN' AND uh.experience_years < experience_value) OR
                      (experience_type = 'GREATER_THAN' AND uh.experience_years > experience_value) OR
                      (experience_type = 'EQUALS' AND uh.experience_years = experience_value)
                  )
                  AND (
                      attempts_type IS NULL OR attempts_value IS NULL OR
                      (attempts_type = 'LESS_THAN' AND uh.attempts_count < attempts_value) OR
                      (attempts_type = 'GREATER_THAN' AND uh.attempts_count > attempts_value) OR
                      (attempts_type = 'EQUALS' AND uh.attempts_count = attempts_value)
                  )
                  AND (
                    (last_comm_exact IS NULL AND last_comm_from IS NULL AND last_comm_to IS NULL)
                    OR (last_comm_exact IS NOT NULL AND DATE(uh.last_communication_date) = DATE(last_comm_exact))
                    OR (last_comm_from IS NOT NULL AND last_comm_to IS NOT NULL 
                        AND uh.last_communication_date BETWEEN last_comm_from AND last_comm_to)
                  )
                  AND uh.is_active = true 
                  AND uh.reporting_person_id IS NOT NULL
                  OR (uh.id = root_user_id AND uh.reporting_person_id IS NOT NULL)
          )
          SELECT
              (SELECT COUNT(*) FROM filtered_hierarchy) AS total_count,
              fh.id AS user_id,
              fh.full_name,
              fh.email,
              json_build_object('id', fh.reporting_person_id, 'name', fh.reporting_person_name) AS reporting_person,
              json_build_object('id', fh.designation_id, 'name', fh.designation_name) AS designation,
              fh.experience_years,
              fh.attempts_count,
              fh.last_communication_date
          FROM filtered_hierarchy fh
          ORDER BY
              CASE WHEN order_field = 'full_name' AND order_direction = 'ASC' THEN fh.full_name END ASC,
              CASE WHEN order_field = 'full_name' AND order_direction = 'DESC' THEN fh.full_name END DESC,
              CASE WHEN order_field = 'experience_years' AND order_direction = 'ASC' THEN fh.experience_years END ASC,
              CASE WHEN order_field = 'experience_years' AND order_direction = 'DESC' THEN fh.experience_years END DESC,
              CASE WHEN order_field = 'designation_name' AND order_direction = 'ASC' THEN fh.designation_name END ASC,
              CASE WHEN order_field = 'designation_name' AND order_direction = 'DESC' THEN fh.designation_name END DESC,
              CASE WHEN order_field = 'reporting_person_name' AND order_direction = 'ASC' THEN fh.reporting_person_name END ASC,
              CASE WHEN order_field = 'reporting_person_name' AND order_direction = 'DESC' THEN fh.reporting_person_name END DESC,
              CASE WHEN order_field = 'attempts_count' AND order_direction = 'ASC' THEN fh.attempts_count END ASC,
              CASE WHEN order_field = 'attempts_count' AND order_direction = 'DESC' THEN fh.attempts_count END DESC,
              CASE WHEN order_field = 'last_communication_date' AND order_direction = 'ASC' THEN fh.last_communication_date END ASC,
              CASE WHEN order_field = 'last_communication_date' AND order_direction = 'DESC' THEN fh.last_communication_date END DESC
          LIMIT limit_val
          OFFSET offset_val;
      END;
      $$;