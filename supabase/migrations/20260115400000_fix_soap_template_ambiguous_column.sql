-- Migration: Fix ambiguous column reference in SOAP template trigger
-- Date: 2026-01-15
-- Purpose: Rename template_id variable to new_template_id to avoid ambiguity
--          with the template_id column in temp_soap_templates table
--
-- Issue: The function declares a variable named template_id which conflicts
--        with the column name template_id in the INSERT/SELECT statement,
--        causing PostgreSQL error: "column reference template_id is ambiguous"
--
-- Fix: Rename the local variable to new_template_id throughout the function

CREATE OR REPLACE FUNCTION public.create_default_soap_template_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_template_id UUID;  -- Renamed from template_id to avoid ambiguity
    new_user_id UUID;
    existing_system_template_id UUID;
BEGIN
    -- Get the user ID from the NEW record
    new_user_id := NEW.id;

    -- Check if a system default template exists (user_id = NULL and is_default = true)
    SELECT id INTO existing_system_template_id
    FROM public.temp_soap_templates
    WHERE user_id IS NULL
    AND is_default = true
    LIMIT 1;

    -- If system default template exists, copy it for the new user
    IF existing_system_template_id IS NOT NULL THEN
        new_template_id := extensions.uuid_generate_v4();

        INSERT INTO public.temp_soap_templates (
            id,
            user_id,
            person_name,
            template_name,
            subjective_template,
            objective_template,
            subjective_prompt,
            objective_prompt,
            assessment_prompt,
            plan_prompt,
            client_instructions_prompt,
            system_prompt_addition,
            template_id,
            display_name,
            icon_name,
            assessment_template,
            plan_template,
            client_instructions_template,
            is_default,
            created_at,
            updated_at
        )
        SELECT
            new_template_id,  -- id column (generated UUID)
            new_user_id,      -- user_id column (new user)
            person_name,
            template_name,
            subjective_template,
            objective_template,
            subjective_prompt,
            objective_prompt,
            assessment_prompt,
            plan_prompt,
            client_instructions_prompt,
            system_prompt_addition,
            'user_default_' || new_template_id::text, -- template_id column (unique identifier)
            display_name,
            icon_name,
            assessment_template,
            plan_template,
            client_instructions_template,
            true, -- Set as user's default
            NOW(),
            NOW()
        FROM public.temp_soap_templates
        WHERE id = existing_system_template_id;

        RAISE NOTICE 'Created default SOAP template for new user % by copying system template %',
            new_user_id, existing_system_template_id;
    ELSE
        -- No system template exists, create a minimal default template
        new_template_id := extensions.uuid_generate_v4();

        INSERT INTO public.temp_soap_templates (
            id,
            user_id,
            person_name,
            template_name,
            subjective_template,
            objective_template,
            subjective_prompt,
            objective_prompt,
            assessment_prompt,
            plan_prompt,
            client_instructions_prompt,
            system_prompt_addition,
            template_id,
            display_name,
            icon_name,
            is_default,
            created_at,
            updated_at
        ) VALUES (
            new_template_id,
            new_user_id,
            'Default Template',
            'Default SOAP Template',
            NULL, -- Use edge function defaults
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            'user_default_' || new_template_id::text,
            'Default SOAP',
            'stethoscope',
            true,
            NOW(),
            NOW()
        );

        RAISE NOTICE 'Created minimal default SOAP template for new user % (no system template found)',
            new_user_id;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log detailed error for debugging but allow signup to proceed
        RAISE WARNING 'Failed to create default SOAP template for user %: % (SQLSTATE: %)',
            new_user_id, SQLERRM, SQLSTATE;
        -- Return NEW to allow the transaction to complete
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog', 'extensions';

-- Add comment explaining the fix
COMMENT ON FUNCTION public.create_default_soap_template_for_new_user() IS
'Creates a default SOAP template for new users. Variable renamed from template_id to new_template_id to avoid ambiguity with the template_id column. Includes exception handling to allow signup even if template creation fails.';
