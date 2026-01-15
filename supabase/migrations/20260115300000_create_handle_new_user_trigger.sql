-- Create trigger to automatically create user profile in public.users
-- when a new user signs up via Supabase Auth

-- ============================================================================
-- HANDLE NEW USER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new user profile record when auth.users gets a new entry
  INSERT INTO public.users (
    id,
    email,
    onboarding_completed,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    false,
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block the signup
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER ON AUTH.USERS
-- ============================================================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates a user profile in public.users when a new user signs up via Supabase Auth';
