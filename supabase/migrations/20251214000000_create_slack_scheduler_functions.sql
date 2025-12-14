-- Migration: Create Slack scheduler database functions
-- Description: Functions to support daily reminder scheduling
-- Created: 2025-12-14

-- Function to get channels with tasks due in a time window
-- Used by the daily reminder cron job
CREATE OR REPLACE FUNCTION get_channels_with_due_tasks(
  p_start_time TIME,
  p_end_time TIME
)
RETURNS TABLE (
  -- Channel fields
  channel_db_id UUID,
  workspace_id UUID,
  channel_id TEXT,
  channel_name TEXT,
  channel_reminder_time TIME,
  timezone TEXT,
  channel_is_active BOOLEAN,
  added_by_user_id TEXT,
  channel_created_at TIMESTAMPTZ,
  team_id TEXT,
  -- Task fields
  task_id UUID,
  task_title TEXT,
  task_description TEXT,
  task_reminder_time TIME,
  task_is_active BOOLEAN,
  task_created_by_user_id TEXT,
  task_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS channel_db_id,
    c.workspace_id,
    c.channel_id,
    c.channel_name,
    c.reminder_time AS channel_reminder_time,
    c.timezone,
    c.is_active AS channel_is_active,
    c.added_by_user_id,
    c.created_at AS channel_created_at,
    w.team_id,
    t.id AS task_id,
    t.title AS task_title,
    t.description AS task_description,
    t.reminder_time AS task_reminder_time,
    t.is_active AS task_is_active,
    t.created_by_user_id AS task_created_by_user_id,
    t.created_at AS task_created_at
  FROM slack_reminder_channels c
  INNER JOIN slack_workspaces w ON w.id = c.workspace_id
  INNER JOIN slack_tasks t ON t.channel_id = c.id
  WHERE
    c.is_active = true
    AND t.is_active = true
    AND t.reminder_time >= p_start_time
    AND t.reminder_time <= p_end_time
  ORDER BY c.id, t.reminder_time;
END;
$$;

COMMENT ON FUNCTION get_channels_with_due_tasks IS
'Returns channels with tasks scheduled in the given time window (UTC). Called by daily reminder cron job.';
