DROP FUNCTION IF EXISTS cip_schema.get_user_tree_hierarchy(
    integer, text,text[], integer[], integer[], text, numeric, text, numeric, timestamp,timestamp,timestamp,integer, integer, text, text
);

CREATE FUNCTION cip_schema.get_user_tree_hierarchy(
    root_user_id integer,
    name_filter text,
    education_medium text[],
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
    order_direction text,
    tags_filter text[]
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
    medium_of_education text,
    last_communication_date timestamp,
    link text,
    tags text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE 
    forward_hierarchy AS (
        SELECT 
            u.id,
            u.full_name::text,
            u.email::text,
            u.reporting_person_id,
            rp.full_name::text AS reporting_person_name,
            u.designation_id,
            d.name::text AS designation_name,
            u.medium_of_education::text,
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
            u.medium_of_education::text,
            u.is_active,
            (DATE_PART('year', AGE(NOW(), u.experience)) 
                    + DATE_PART('month', AGE(NOW(), u.experience)) / 100)::numeric AS experience_years
        FROM cip_schema.users u
        INNER JOIN forward_hierarchy h ON u.reporting_person_id = h.id
        LEFT JOIN cip_schema.users rp ON rp.id = u.reporting_person_id
        LEFT JOIN cip_schema.designations d ON d.id = u.designation_id
    ),

    filtered_forward_hierarchy AS (
        SELECT
            fh.id,
            fh.full_name,
            fh.email,
            fh.reporting_person_id,
            fh.reporting_person_name,
            fh.designation_id,
            fh.designation_name,
            fh.medium_of_education::text,
            fh.experience_years,
            COUNT(cm.user_id)::bigint AS attempts_count,
            MAX(cm.date)::timestamp AS last_communication_date,
            (
            SELECT c2.link
            FROM cip_schema.communications c2
            WHERE c2.user_id = fh.id AND c2.is_deleted = false
            ORDER BY c2.date DESC NULLS LAST
            LIMIT 1
            )::text AS link,
            (ARRAY_REMOVE(ARRAY_AGG(DISTINCT tg.tag), NULL))::text[] AS tags
        FROM forward_hierarchy fh
        LEFT JOIN cip_schema.communications cm 
            ON cm.user_id = fh.id 
            AND cm.is_deleted = false
        LEFT JOIN cip_schema.tags tg
            ON tg.user_id = fh.id
        WHERE
            fh.is_active = true
            AND (name_filter IS NULL OR fh.full_name ILIKE '%' || name_filter || '%')
            AND (designation_ids IS NULL OR fh.designation_id = ANY(designation_ids))
            AND (reporting_person_ids IS NULL OR fh.reporting_person_id = ANY(reporting_person_ids))
            AND (
                experience_type IS NULL OR experience_value IS NULL OR
                (experience_type = 'LESS_THAN' AND fh.experience_years < experience_value) OR
                (experience_type = 'GREATER_THAN' AND fh.experience_years > experience_value) OR
                (experience_type = 'EQUALS' AND fh.experience_years = experience_value)
            )
            AND (
            fh.reporting_person_id IS NOT NULL OR 
            (fh.id = root_user_id AND fh.reporting_person_id IS NOT NULL)
            )
            AND (education_medium IS NULL OR fh.medium_of_education = ANY(education_medium))
        GROUP BY 
            fh.id, fh.full_name, fh.email, fh.reporting_person_id,
            fh.reporting_person_name, fh.designation_id, fh.designation_name,
            fh.is_active, fh.experience_years, fh.medium_of_education
        HAVING
            (attempts_type IS NULL OR attempts_value IS NULL OR
                (attempts_type = 'LESS_THAN' AND COUNT(cm.user_id) < attempts_value) OR
                (attempts_type = 'GREATER_THAN' AND COUNT(cm.user_id) > attempts_value) OR
                (attempts_type = 'EQUALS' AND COUNT(cm.user_id) = attempts_value)
            )
            AND (
            (last_comm_exact IS NULL AND last_comm_from IS NULL AND last_comm_to IS NULL)
            OR (last_comm_exact IS NOT NULL AND DATE(MAX(cm.date)) = DATE(last_comm_exact))
            OR (last_comm_from IS NOT NULL AND last_comm_to IS NOT NULL
                AND MAX(cm.date) BETWEEN last_comm_from AND last_comm_to)
            OR (last_comm_from IS NOT NULL AND last_comm_to IS NULL
                AND MAX(cm.date) BETWEEN last_comm_from AND NOW())
            OR (last_comm_from IS NULL AND last_comm_to IS NOT NULL
                AND MAX(cm.date) <= last_comm_to)
            )
            AND (
                tags_filter IS NULL
                OR (ARRAY_REMOVE(ARRAY_AGG(DISTINCT tg.tag), NULL) && tags_filter)
            )
    ),

    reverse_hierarchy AS (
        SELECT DISTINCT
            u.id,
            u.full_name::text,
            u.email::text,
            u.reporting_person_id,
            rp.full_name::text AS reporting_person_name,
            u.designation_id,
            d.name::text AS designation_name,
            u.medium_of_education::text,
            u.is_active,
            (DATE_PART('year', AGE(NOW(), u.experience)) 
                    + DATE_PART('month', AGE(NOW(), u.experience)) / 100)::numeric AS experience_years
        FROM cip_schema.users u
        LEFT JOIN cip_schema.users rp ON rp.id = u.reporting_person_id
        LEFT JOIN cip_schema.designations d ON d.id = u.designation_id
        WHERE u.id IN (
            SELECT DISTINCT reporting_person_id 
            FROM filtered_forward_hierarchy 
            WHERE reporting_person_id IS NOT NULL
        )
        AND u.id NOT IN (SELECT id FROM filtered_forward_hierarchy)
        AND u.reporting_person_id IS NOT NULL

        UNION ALL

        SELECT
            u.id,
            u.full_name::text,
            u.email::text,
            u.reporting_person_id,
            rp.full_name::text AS reporting_person_name,
            u.designation_id,
            d.name::text AS designation_name,
            u.medium_of_education::text,
            u.is_active,
            (DATE_PART('year', AGE(NOW(), u.experience)) 
                    + DATE_PART('month', AGE(NOW(), u.experience)) / 100)::numeric AS experience_years
        FROM cip_schema.users u
        INNER JOIN reverse_hierarchy rh ON u.id = rh.reporting_person_id
        LEFT JOIN cip_schema.users rp ON rp.id = u.reporting_person_id
        LEFT JOIN cip_schema.designations d ON d.id = u.designation_id
        WHERE u.id NOT IN (SELECT id FROM filtered_forward_hierarchy)
        AND u.reporting_person_id IS NOT NULL
    ),

    reverse_hierarchy_with_comms AS (
        SELECT
            rh.id,
            rh.full_name,
            rh.email,
            rh.reporting_person_id,
            rh.reporting_person_name,
            rh.designation_id,
            rh.designation_name,
            rh.medium_of_education::text,
            rh.experience_years,
            COUNT(cm.user_id)::bigint AS attempts_count,
            MAX(cm.date)::timestamp AS last_communication_date,
            (
            SELECT c2.link
            FROM cip_schema.communications c2
            WHERE c2.user_id = rh.id AND c2.is_deleted = false
            ORDER BY c2.date DESC NULLS LAST
            LIMIT 1
            )::text AS link,
            (ARRAY_REMOVE(ARRAY_AGG(DISTINCT tg.tag), NULL))::text[] AS tags
        FROM reverse_hierarchy rh
        LEFT JOIN cip_schema.communications cm 
            ON cm.user_id = rh.id 
            AND cm.is_deleted = false
        LEFT JOIN cip_schema.tags tg
            ON tg.user_id = rh.id
        GROUP BY 
            rh.id, rh.full_name, rh.email, rh.reporting_person_id,
            rh.reporting_person_name, rh.designation_id, rh.designation_name,
            rh.is_active, rh.experience_years, rh.medium_of_education
        HAVING
            (
                tags_filter IS NULL
                OR (ARRAY_REMOVE(ARRAY_AGG(DISTINCT tg.tag), NULL) && tags_filter)
            )
    ),

    combined_hierarchy AS (
        SELECT * FROM filtered_forward_hierarchy
        UNION
        SELECT * FROM reverse_hierarchy_with_comms
    ),

    total AS (
        SELECT COUNT(*)::bigint AS cnt FROM combined_hierarchy
    )

    SELECT
        t.cnt AS total_count,
        ch.id AS user_id,
        ch.full_name,
        ch.email,
        json_build_object('id', ch.reporting_person_id, 'name', ch.reporting_person_name) AS reporting_person,
        json_build_object('id', ch.designation_id, 'name', ch.designation_name) AS designation,
        ch.experience_years,
        ch.attempts_count,
        ch.medium_of_education::text,
        ch.last_communication_date,
        ch.link,
        ch.tags
    FROM combined_hierarchy ch
    CROSS JOIN total t
    ORDER BY
        CASE WHEN order_field = 'full_name' AND order_direction = 'ASC' THEN ch.full_name END ASC NULLS LAST,
        CASE WHEN order_field = 'full_name' AND order_direction = 'DESC' THEN ch.full_name END DESC NULLS LAST,
        CASE WHEN order_field = 'experience_years' AND order_direction = 'ASC' THEN ch.experience_years END ASC NULLS LAST,
        CASE WHEN order_field = 'experience_years' AND order_direction = 'DESC' THEN ch.experience_years END DESC NULLS LAST,
        CASE WHEN order_field = 'designation_name' AND order_direction = 'ASC' THEN ch.designation_name END ASC NULLS LAST,
        CASE WHEN order_field = 'designation_name' AND order_direction = 'DESC' THEN ch.designation_name END DESC NULLS LAST,
        CASE WHEN order_field = 'reporting_person_name' AND order_direction = 'ASC' THEN ch.reporting_person_name END ASC NULLS LAST,
        CASE WHEN order_field = 'reporting_person_name' AND order_direction = 'DESC' THEN ch.reporting_person_name END DESC NULLS LAST,
        CASE WHEN order_field = 'attempts_count' AND order_direction = 'ASC' THEN ch.attempts_count END ASC NULLS LAST,
        CASE WHEN order_field = 'attempts_count' AND order_direction = 'DESC' THEN ch.attempts_count END DESC NULLS LAST,
        CASE WHEN order_field = 'last_communication_date' AND order_direction = 'ASC' THEN ch.last_communication_date END ASC NULLS LAST,
        CASE WHEN order_field = 'last_communication_date' AND order_direction = 'DESC' THEN ch.last_communication_date END DESC NULLS LAST,
        CASE WHEN order_field = 'education_medium' AND order_direction = 'ASC' THEN ch.medium_of_education END ASC NULLS LAST,
        CASE WHEN order_field = 'education_medium' AND order_direction = 'DESC' THEN ch.medium_of_education END DESC NULLS LAST
    LIMIT limit_val
    OFFSET offset_val;
END;
$$;