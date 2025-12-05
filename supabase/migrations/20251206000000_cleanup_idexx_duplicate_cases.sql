-- Migration: Clean up duplicate IDEXX cases for garrybath@hotmail.com (Alum Rock Animal Hospital)
-- This migration:
-- 1. Identifies duplicate case groups (same patient_name + owner_name from IDEXX)
-- 2. Keeps the most recent case per patient+owner combination
-- 3. Reassigns scheduled_discharge_calls from duplicate cases to kept case
-- 4. Deletes duplicate cases (cascade will handle patients, discharge_summaries, etc.)
-- 5. Cleans up orphaned patients not linked to any case

-- User ID for garrybath@hotmail.com
DO $$
DECLARE
    target_user_id UUID := 'c51bffe0-0f84-4560-8354-2fa65d646f28';
    duplicate_record RECORD;
    case_to_keep UUID;
    cases_to_delete UUID[];
    total_deleted INT := 0;
    calls_reassigned INT := 0;
BEGIN
    RAISE NOTICE 'Starting duplicate cleanup for user %', target_user_id;
    
    -- Create temp table of duplicate groups
    CREATE TEMP TABLE duplicate_groups AS
    WITH case_patient_info AS (
        SELECT 
            c.id as case_id,
            c.created_at,
            c.status,
            p.name as patient_name,
            p.owner_name
        FROM cases c
        INNER JOIN patients p ON p.case_id = c.id
        WHERE c.user_id = target_user_id
          AND (c.source = 'idexx_extension' OR c.source = 'idexx_neo')
          AND p.name IS NOT NULL
          AND p.owner_name IS NOT NULL
    )
    SELECT 
        UPPER(patient_name) as patient_name_upper,
        UPPER(owner_name) as owner_name_upper,
        array_agg(case_id ORDER BY created_at DESC) as case_ids,
        COUNT(*) as case_count
    FROM case_patient_info
    GROUP BY UPPER(patient_name), UPPER(owner_name)
    HAVING COUNT(*) > 1;
    
    RAISE NOTICE 'Found % duplicate groups', (SELECT COUNT(*) FROM duplicate_groups);
    
    -- Process each duplicate group
    FOR duplicate_record IN SELECT * FROM duplicate_groups
    LOOP
        -- First case_id is the most recent (to keep)
        case_to_keep := duplicate_record.case_ids[1];
        -- Rest are duplicates (to delete)
        cases_to_delete := duplicate_record.case_ids[2:array_length(duplicate_record.case_ids, 1)];
        
        -- Reassign scheduled_discharge_calls from duplicate cases to the kept case
        UPDATE scheduled_discharge_calls 
        SET case_id = case_to_keep,
            metadata = jsonb_set(
                COALESCE(metadata, '{}'::jsonb),
                '{migrated_from_duplicate}',
                to_jsonb(case_id::text)
            )
        WHERE case_id = ANY(cases_to_delete)
          AND case_id IS NOT NULL;
        
        GET DIAGNOSTICS calls_reassigned = ROW_COUNT;
        IF calls_reassigned > 0 THEN
            RAISE NOTICE 'Reassigned % calls from duplicates to case %', calls_reassigned, case_to_keep;
        END IF;
        
        -- Reassign scheduled_discharge_emails from duplicate cases to the kept case
        UPDATE scheduled_discharge_emails 
        SET case_id = case_to_keep
        WHERE case_id = ANY(cases_to_delete)
          AND case_id IS NOT NULL;
        
        -- Reassign discharge_batch_items from duplicate cases to the kept case
        UPDATE discharge_batch_items 
        SET case_id = case_to_keep
        WHERE case_id = ANY(cases_to_delete)
          AND case_id IS NOT NULL;
        
        -- Delete duplicate cases (cascade will handle patients, discharge_summaries, etc.)
        DELETE FROM cases 
        WHERE id = ANY(cases_to_delete);
        
        total_deleted := total_deleted + array_length(cases_to_delete, 1);
        
        RAISE NOTICE 'Kept case % for %/%, deleted % duplicates', 
            case_to_keep, 
            duplicate_record.patient_name_upper, 
            duplicate_record.owner_name_upper,
            array_length(cases_to_delete, 1);
    END LOOP;
    
    DROP TABLE duplicate_groups;
    
    RAISE NOTICE 'Total duplicate cases deleted: %', total_deleted;
    
    -- Clean up orphaned patients (patients with no case_id or case_id that doesn't exist)
    DELETE FROM patients 
    WHERE user_id = target_user_id
      AND (case_id IS NULL OR NOT EXISTS (
          SELECT 1 FROM cases WHERE cases.id = patients.case_id
      ));
    
    GET DIAGNOSTICS total_deleted = ROW_COUNT;
    RAISE NOTICE 'Cleaned up % orphaned patients', total_deleted;
    
END $$;

-- Verify the cleanup
DO $$
DECLARE
    remaining_duplicates INT;
    target_user_id UUID := 'c51bffe0-0f84-4560-8354-2fa65d646f28';
BEGIN
    SELECT COUNT(*) INTO remaining_duplicates
    FROM (
        SELECT UPPER(p.name), UPPER(p.owner_name), COUNT(*)
        FROM cases c
        INNER JOIN patients p ON p.case_id = c.id
        WHERE c.user_id = target_user_id
          AND (c.source = 'idexx_extension' OR c.source = 'idexx_neo')
          AND p.name IS NOT NULL
        GROUP BY UPPER(p.name), UPPER(p.owner_name)
        HAVING COUNT(*) > 1
    ) as remaining;
    
    IF remaining_duplicates > 0 THEN
        RAISE WARNING 'Still have % duplicate groups remaining', remaining_duplicates;
    ELSE
        RAISE NOTICE 'SUCCESS: All duplicates cleaned up for user %', target_user_id;
    END IF;
END $$;
