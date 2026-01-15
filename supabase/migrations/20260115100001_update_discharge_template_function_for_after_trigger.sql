-- Migration: Update discharge template function for AFTER trigger
-- Date: 2026-01-15
-- Purpose: Fix the create_default_discharge_template_for_new_user function
--          to work correctly as an AFTER INSERT trigger
--
-- Issue: The function tries to set NEW.default_discharge_template_id but that
--        doesn't work in AFTER INSERT triggers (NEW is read-only after insert completes)
--
-- Fix: Use UPDATE instead of setting NEW.default_discharge_template_id

CREATE OR REPLACE FUNCTION public.create_default_discharge_template_for_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog', 'extensions'
AS $function$
DECLARE
    template_id UUID;
    new_user_id UUID;
    default_content TEXT := 'Generate comprehensive, client-friendly discharge instructions based on the SOAP note and appointment details. Include:

1. MEDICATIONS:
   - List all prescribed medications with dosages, frequencies, and administration instructions
   - Explain the purpose of each medication in simple terms
   - Note any special instructions (e.g., "give with food", "complete full course")

2. HOME CARE INSTRUCTIONS:
   - Specific care routines the pet owner should follow
   - Activity restrictions or modifications (e.g., "limit jumping for 2 weeks")
   - Dietary recommendations or changes
   - Wound care or bandage management if applicable

3. MONITORING:
   - What symptoms or behaviors to watch for
   - Signs of improvement to expect
   - Timeline for expected recovery

4. WARNING SIGNS:
   - Specific symptoms that require immediate veterinary attention
   - Emergency contact information or after-hours guidance
   - When to call the clinic with concerns

5. FOLLOW-UP:
   - Scheduled recheck appointments
   - When to return for suture removal, bandage changes, etc.
   - Pending test results and how/when they will be communicated

6. ADDITIONAL INSTRUCTIONS:
   - Any other relevant care instructions specific to this case
   - Preventive care recommendations

Format the discharge summary in a clear, organized manner that pet owners can easily understand and reference. Use simple, non-technical language while maintaining medical accuracy. Structure the information with clear headings and bullet points for easy readability.';
BEGIN
    -- Get the user ID from the NEW record
    new_user_id := NEW.id;

    -- Generate UUID for the template using extensions schema
    template_id := extensions.uuid_generate_v4();

    -- Insert default discharge template for new user
    INSERT INTO public.temp_discharge_summary_templates (
        id,
        user_id,
        name,
        content,
        is_default,
        created_at,
        updated_at
    ) VALUES (
        template_id,
        new_user_id,
        'Default Discharge Instructions',
        default_content,
        true,
        NOW(),
        NOW()
    );

    -- Update the user record with default template reference
    -- Since this is an AFTER INSERT trigger, we need to use UPDATE instead of setting NEW
    UPDATE public.users
    SET default_discharge_template_id = template_id
    WHERE id = new_user_id;

    RETURN NEW;
END;
$function$;
