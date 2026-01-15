-- Create clinic_invitations table for email-based team invitations
-- Enables clinic owners/admins to invite new users via email
-- Users receive a link with a unique token to join the clinic

-- ============================================================================
-- CLINIC_INVITATIONS TABLE
-- ============================================================================
CREATE TABLE clinic_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Invitation target
  email text NOT NULL,                                    -- Email address invited
  token uuid NOT NULL DEFAULT gen_random_uuid(),          -- Unique token for invitation link
  role text NOT NULL DEFAULT 'member',                    -- Role to assign: 'admin', 'member', 'viewer'

  -- Status tracking
  status text NOT NULL DEFAULT 'pending',                 -- 'pending', 'accepted', 'expired', 'revoked'
  accepted_by uuid REFERENCES auth.users(id),             -- User who accepted (may differ from invited email)
  accepted_at timestamptz,

  -- Lifecycle
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),

  -- Audit
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_invitation_role CHECK (role IN ('admin', 'member', 'viewer')),
  CONSTRAINT valid_invitation_status CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'))
);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Find all invitations for a clinic
CREATE INDEX idx_clinic_invitations_clinic ON clinic_invitations(clinic_id);

-- Find invitations by email (case-insensitive)
CREATE INDEX idx_clinic_invitations_email ON clinic_invitations(lower(email));

-- Token lookup for validation (only pending invitations)
CREATE UNIQUE INDEX idx_clinic_invitations_token ON clinic_invitations(token) WHERE status = 'pending';

-- Find pending invitations for a clinic
CREATE INDEX idx_clinic_invitations_pending ON clinic_invitations(clinic_id, status) WHERE status = 'pending';

-- Invitations sent by a specific user
CREATE INDEX idx_clinic_invitations_invited_by ON clinic_invitations(invited_by);

-- ============================================================================
-- UNIQUE CONSTRAINT FOR PENDING INVITATIONS
-- ============================================================================
-- Prevent duplicate pending invitations for the same email to the same clinic
CREATE UNIQUE INDEX idx_clinic_invitations_unique_pending
  ON clinic_invitations(clinic_id, lower(email))
  WHERE status = 'pending';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE clinic_invitations ENABLE ROW LEVEL SECURITY;

-- Clinic owners and admins can manage invitations for their clinics
CREATE POLICY "Clinic admins can manage invitations"
  ON clinic_invitations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_clinic_access uca
      WHERE uca.user_id = auth.uid()
        AND uca.clinic_id = clinic_invitations.clinic_id
        AND uca.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_clinic_access uca
      WHERE uca.user_id = auth.uid()
        AND uca.clinic_id = clinic_invitations.clinic_id
        AND uca.role IN ('owner', 'admin')
    )
  );

-- Users can view pending invitations sent to their email (to accept them)
CREATE POLICY "Users can view invitations to their email"
  ON clinic_invitations
  FOR SELECT
  USING (
    status = 'pending'
    AND lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Service role can manage all invitations (for background jobs, webhooks)
CREATE POLICY "Service role can manage all invitations"
  ON clinic_invitations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- FUNCTION TO ACCEPT INVITATION
-- ============================================================================
-- Accepts an invitation and creates user_clinic_access record
CREATE OR REPLACE FUNCTION accept_clinic_invitation(
  p_token uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation clinic_invitations%ROWTYPE;
  v_clinic_name text;
  v_is_first_clinic boolean;
BEGIN
  -- Find the pending invitation
  SELECT * INTO v_invitation
  FROM clinic_invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired invitation'
    );
  END IF;

  -- Check if user already has access to this clinic
  IF EXISTS (
    SELECT 1 FROM user_clinic_access
    WHERE user_id = p_user_id AND clinic_id = v_invitation.clinic_id
  ) THEN
    -- Mark invitation as accepted anyway (idempotent)
    UPDATE clinic_invitations
    SET status = 'accepted',
        accepted_by = p_user_id,
        accepted_at = now()
    WHERE id = v_invitation.id;

    SELECT name INTO v_clinic_name FROM clinics WHERE id = v_invitation.clinic_id;

    RETURN jsonb_build_object(
      'success', true,
      'clinic_id', v_invitation.clinic_id,
      'clinic_name', v_clinic_name,
      'role', v_invitation.role,
      'already_member', true
    );
  END IF;

  -- Check if this is the user's first clinic
  SELECT NOT EXISTS (
    SELECT 1 FROM user_clinic_access WHERE user_id = p_user_id
  ) INTO v_is_first_clinic;

  -- Create clinic access record
  INSERT INTO user_clinic_access (user_id, clinic_id, role, is_primary, granted_by, granted_at)
  VALUES (
    p_user_id,
    v_invitation.clinic_id,
    v_invitation.role,
    v_is_first_clinic,  -- First clinic becomes primary
    v_invitation.invited_by,
    now()
  );

  -- Mark invitation as accepted
  UPDATE clinic_invitations
  SET status = 'accepted',
      accepted_by = p_user_id,
      accepted_at = now()
  WHERE id = v_invitation.id;

  -- Get clinic name for response
  SELECT name INTO v_clinic_name FROM clinics WHERE id = v_invitation.clinic_id;

  RETURN jsonb_build_object(
    'success', true,
    'clinic_id', v_invitation.clinic_id,
    'clinic_name', v_clinic_name,
    'role', v_invitation.role,
    'is_primary', v_is_first_clinic
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION accept_clinic_invitation(uuid, uuid) TO authenticated;

-- ============================================================================
-- FUNCTION TO EXPIRE OLD INVITATIONS
-- ============================================================================
-- Can be called by a cron job to mark expired invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE clinic_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================================
-- TABLE AND COLUMN COMMENTS
-- ============================================================================
COMMENT ON TABLE clinic_invitations IS 'Email-based invitations for users to join clinics. Admins invite by email, users click a link with a token to join.';
COMMENT ON COLUMN clinic_invitations.email IS 'Email address the invitation was sent to';
COMMENT ON COLUMN clinic_invitations.token IS 'Unique token used in the invitation link. Only one pending invitation per token.';
COMMENT ON COLUMN clinic_invitations.role IS 'Role to assign when invitation is accepted: admin, member, or viewer';
COMMENT ON COLUMN clinic_invitations.status IS 'Invitation status: pending (awaiting response), accepted, expired, or revoked';
COMMENT ON COLUMN clinic_invitations.accepted_by IS 'User who accepted the invitation. May differ from invited email if user signed up with different email.';
COMMENT ON COLUMN clinic_invitations.expires_at IS 'When the invitation expires. Default is 7 days from creation.';
COMMENT ON COLUMN clinic_invitations.invited_by IS 'Clinic admin/owner who created the invitation';
