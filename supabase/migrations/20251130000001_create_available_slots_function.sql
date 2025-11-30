-- Create available_slots function for appointment booking
-- Implements ODIS-46: Build available_slots materialized view or function
-- 
-- This function computes available appointment slots for a clinic on a given date.
-- It generates 30-minute time slots and checks for conflicts with existing appointments.
--
-- Usage:
--   SELECT * FROM get_available_slots(
--     'clinic-uuid'::uuid,
--     '2025-12-01'::date
--   );
--
--   SELECT * FROM get_available_slots(
--     'clinic-uuid'::uuid,
--     '2025-12-01'::date,
--     'provider-uuid'::uuid  -- Optional: filter by specific provider
--   );

-- ============================================================================
-- FUNCTION: get_available_slots
-- ============================================================================
-- Computes available appointment slots for a clinic on a given date.
--
-- Parameters:
--   p_clinic_id UUID - Required: Clinic ID to check availability for
--   p_date DATE - Required: Date to check availability for
--   p_provider_id UUID - Optional: If provided, only return slots for this provider
--   p_slot_duration_minutes INTEGER - Optional: Slot duration in minutes (default: 30)
--   p_start_time TIME - Optional: Start time for slots (default: '08:00')
--   p_end_time TIME - Optional: End time for slots (default: '17:30')
--
-- Returns:
--   TABLE with columns:
--     clinic_id UUID - Clinic ID
--     provider_id UUID - Provider ID (NULL if checking all providers)
--     date DATE - Date of the slot
--     slot_start TIME - Start time of the slot
--     slot_end TIME - End time of the slot
--     is_available BOOLEAN - Whether the slot is available
--     conflicting_appointment_id UUID - ID of conflicting appointment (NULL if available)
--
-- Notes:
--   - Only active providers are considered
--   - Cancelled appointments do not block slots
--   - All other appointment statuses (scheduled, confirmed, completed, no_show) block slots
--   - Slots are generated in intervals specified by p_slot_duration_minutes
--   - Uses existing indexes on appointments table for performance
CREATE OR REPLACE FUNCTION get_available_slots(
  p_clinic_id UUID,
  p_date DATE,
  p_provider_id UUID DEFAULT NULL,
  p_slot_duration_minutes INTEGER DEFAULT 30,
  p_start_time TIME DEFAULT '08:00'::TIME,
  p_end_time TIME DEFAULT '17:30'::TIME
)
RETURNS TABLE (
  clinic_id UUID,
  provider_id UUID,
  date DATE,
  slot_start TIME,
  slot_end TIME,
  is_available BOOLEAN,
  conflicting_appointment_id UUID
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_slot_interval INTERVAL;
  v_clinic_exists BOOLEAN;
  v_provider_exists BOOLEAN;
BEGIN
  -- Validate clinic_id exists
  SELECT EXISTS(SELECT 1 FROM clinics WHERE id = p_clinic_id AND is_active = true)
  INTO v_clinic_exists;
  
  IF NOT v_clinic_exists THEN
    RAISE EXCEPTION 'Clinic with id % does not exist or is not active', p_clinic_id;
  END IF;
  
  -- Validate provider_id if provided
  IF p_provider_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 
      FROM providers p
      WHERE p.id = p_provider_id 
        AND p.clinic_id = p_clinic_id 
        AND p.is_active = true
    )
    INTO v_provider_exists;
    
    IF NOT v_provider_exists THEN
      RAISE EXCEPTION 'Provider with id % does not exist, is not active, or does not belong to clinic %', 
        p_provider_id, p_clinic_id;
    END IF;
  END IF;
  
  -- Validate slot duration
  IF p_slot_duration_minutes <= 0 OR p_slot_duration_minutes > 480 THEN
    RAISE EXCEPTION 'Slot duration must be between 1 and 480 minutes';
  END IF;
  
  -- Validate time range
  IF p_start_time >= p_end_time THEN
    RAISE EXCEPTION 'Start time must be before end time';
  END IF;
  
  -- Calculate slot interval
  v_slot_interval := (p_slot_duration_minutes || ' minutes')::INTERVAL;
  
  -- Generate time slots and check availability
  RETURN QUERY
  WITH time_slots AS (
    -- Generate all possible time slots for the day
    -- Use generate_series with timestamps, then extract time portion
    SELECT 
      (gs.slot_ts::time)::TIME AS slot_start
    FROM generate_series(
      (p_date + p_start_time)::timestamp,
      (p_date + p_end_time - v_slot_interval)::timestamp,
      v_slot_interval
    ) AS gs(slot_ts)
  ),
  provider_list AS (
    -- Get list of active providers for the clinic (or specific provider if provided)
    SELECT 
      p.id,
      p.clinic_id
    FROM providers p
    WHERE p.clinic_id = p_clinic_id
      AND p.is_active = true
      AND (p_provider_id IS NULL OR p.id = p_provider_id)
  ),
  all_slots AS (
    -- Cross join providers with time slots
    SELECT 
      pl.clinic_id,
      pl.id AS provider_id,
      p_date AS date,
      ts.slot_start,
      (ts.slot_start + v_slot_interval)::TIME AS slot_end
    FROM provider_list pl
    CROSS JOIN time_slots ts
  )
  SELECT 
    s.clinic_id,
    s.provider_id,
    s.date,
    s.slot_start,
    s.slot_end,
    -- Check if slot is available (no overlapping appointments except cancelled)
    NOT EXISTS (
      SELECT 1
      FROM appointments a
      WHERE a.clinic_id = s.clinic_id
        AND a.date = s.date
        AND a.status != 'cancelled'  -- Cancelled appointments don't block slots
        AND (
          -- Provider-specific check: if appointment has provider, check provider match
          (a.provider_id IS NULL OR a.provider_id = s.provider_id)
        )
        AND (
          -- Time overlap check: slot overlaps with appointment
          -- Two time ranges overlap if: slot_start < appointment.end_time AND slot_end > appointment.start_time
          s.slot_start < a.end_time
          AND s.slot_end > a.start_time
        )
    ) AS is_available,
    -- Get conflicting appointment ID for debugging (NULL if available)
    (
      SELECT a.id
      FROM appointments a
      WHERE a.clinic_id = s.clinic_id
        AND a.date = s.date
        AND a.status != 'cancelled'
        AND (
          a.provider_id IS NULL OR a.provider_id = s.provider_id
        )
        AND s.slot_start < a.end_time
        AND s.slot_end > a.start_time
      LIMIT 1
    ) AS conflicting_appointment_id
  FROM all_slots s
  ORDER BY s.provider_id, s.slot_start;
END;
$$;

-- ============================================================================
-- FUNCTION COMMENTS
-- ============================================================================
COMMENT ON FUNCTION get_available_slots IS 
'Computes available appointment slots for a clinic on a given date. Generates time slots in configurable intervals and checks for conflicts with existing appointments. Cancelled appointments do not block slots.';

COMMENT ON FUNCTION get_available_slots(UUID, DATE, UUID, INTEGER, TIME, TIME) IS 
'Parameters: clinic_id (required), date (required), provider_id (optional), slot_duration_minutes (default: 30), start_time (default: 08:00), end_time (default: 17:30)';

-- ============================================================================
-- EXAMPLE USAGE QUERIES
-- ============================================================================
-- 
-- Example 1: Get all available slots for a clinic on a specific date
-- SELECT * FROM get_available_slots(
--   '123e4567-e89b-12d3-a456-426614174000'::uuid,
--   CURRENT_DATE + 1
-- ) WHERE is_available = true;
--
-- Example 2: Get available slots for a specific provider
-- SELECT * FROM get_available_slots(
--   '123e4567-e89b-12d3-a456-426614174000'::uuid,
--   CURRENT_DATE + 1,
--   '456e7890-e89b-12d3-a456-426614174001'::uuid
-- ) WHERE is_available = true;
--
-- Example 3: Get all slots (available and unavailable) for debugging
-- SELECT 
--   slot_start,
--   slot_end,
--   is_available,
--   conflicting_appointment_id
-- FROM get_available_slots(
--   '123e4567-e89b-12d3-a456-426614174000'::uuid,
--   CURRENT_DATE + 1
-- )
-- ORDER BY slot_start;
--
-- Example 4: Count available slots per provider
-- SELECT 
--   provider_id,
--   COUNT(*) FILTER (WHERE is_available) AS available_count,
--   COUNT(*) FILTER (WHERE NOT is_available) AS unavailable_count
-- FROM get_available_slots(
--   '123e4567-e89b-12d3-a456-426614174000'::uuid,
--   CURRENT_DATE + 1
-- )
-- GROUP BY provider_id;
