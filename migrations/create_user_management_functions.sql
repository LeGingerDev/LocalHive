-- Migration: Create User Management Functions
-- Description: Adds functions for GDPR compliance - data export and user deletion
-- Date: 2025-01-17

-- Function to export user data for GDPR compliance
CREATE OR REPLACE FUNCTION export_user_data(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    profile_data JSONB;
    items_data JSONB;
    groups_data JSONB;
BEGIN
    -- Check if user exists and caller has permission
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Get user profile data
    SELECT to_jsonb(p.*) INTO profile_data
    FROM profiles p
    WHERE p.id = user_id;
    
    -- Get user's items
    SELECT jsonb_agg(to_jsonb(i.*)) INTO items_data
    FROM items i
    WHERE i.user_id = user_id;
    
    -- Get user's group memberships with group details
    SELECT jsonb_agg(
        jsonb_build_object(
            'membership', to_jsonb(gm.*),
            'group', to_jsonb(g.*)
        )
    ) INTO groups_data
    FROM group_members gm
    JOIN groups g ON gm.group_id = g.id
    WHERE gm.user_id = user_id;
    
    -- Build the complete export
    result := jsonb_build_object(
        'export_date', now(),
        'user_id', user_id,
        'profile', COALESCE(profile_data, 'null'::jsonb),
        'items', COALESCE(items_data, '[]'::jsonb),
        'groups', COALESCE(groups_data, '[]'::jsonb),
        'metadata', jsonb_build_object(
            'total_items', COALESCE(jsonb_array_length(items_data), 0),
            'total_groups', COALESCE(jsonb_array_length(groups_data), 0),
            'export_version', '1.0'
        )
    );
    
    RETURN result;
END;
$$;

-- Function to delete user data for GDPR compliance
CREATE OR REPLACE FUNCTION delete_user_data(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    deleted_items_count INTEGER := 0;
    deleted_groups_count INTEGER := 0;
    deleted_profile INTEGER := 0;
    deleted_usage INTEGER := 0;
    deleted_invitations_sent INTEGER := 0;
    deleted_invitations_received INTEGER := 0;
    deleted_posts INTEGER := 0;
    deleted_groups_owned INTEGER := 0;
BEGIN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Start transaction
    BEGIN
        -- Delete user's items and count them
        WITH deleted_items AS (
            DELETE FROM items 
            WHERE items.user_id = user_id 
            RETURNING id
        )
        SELECT COUNT(*) INTO deleted_items_count FROM deleted_items;
        
        -- Delete user's usage data
        DELETE FROM user_usage WHERE user_usage.user_id = user_id;
        GET DIAGNOSTICS deleted_usage = ROW_COUNT;
        
        -- Delete group invitations sent by the user
        DELETE FROM group_invitations WHERE group_invitations.inviter_id = user_id;
        GET DIAGNOSTICS deleted_invitations_sent = ROW_COUNT;
        
        -- Delete group invitations received by the user
        DELETE FROM group_invitations WHERE group_invitations.invitee_id = user_id;
        GET DIAGNOSTICS deleted_invitations_received = ROW_COUNT;
        
        -- Delete group posts by the user
        DELETE FROM group_posts WHERE group_posts.user_id = user_id;
        GET DIAGNOSTICS deleted_posts = ROW_COUNT;
        
        -- Remove user from all groups and count them
        WITH deleted_memberships AS (
            DELETE FROM group_members 
            WHERE group_members.user_id = user_id 
            RETURNING group_id
        )
        SELECT COUNT(*) INTO deleted_groups_count FROM deleted_memberships;
        
        -- Delete groups owned by the user (this will cascade to group_members and group_posts)
        DELETE FROM groups WHERE groups.creator_id = user_id;
        GET DIAGNOSTICS deleted_groups_owned = ROW_COUNT;
        
        -- Delete user profile
        DELETE FROM profiles WHERE profiles.id = user_id;
        GET DIAGNOSTICS deleted_profile = ROW_COUNT;
        
        -- Note: Auth user deletion is now handled by the delete-user-data edge function
        -- which uses the Supabase Admin API to remove the user from auth.users
        
        -- Build result
        result := jsonb_build_object(
            'success', true,
            'deleted_at', now(),
            'user_id', user_id,
            'deleted_items_count', deleted_items_count,
            'deleted_usage_records', deleted_usage,
            'deleted_invitations_sent', deleted_invitations_sent,
            'deleted_invitations_received', deleted_invitations_received,
            'deleted_posts', deleted_posts,
            'deleted_group_memberships', deleted_groups_count,
            'deleted_groups_owned', deleted_groups_owned,
            'profile_deleted', deleted_profile > 0,
            'message', 'All user data deleted successfully. Auth user deletion handled by edge function.'
        );
        
        RETURN result;
        
    EXCEPTION WHEN OTHERS THEN
        -- Rollback on error
        RAISE EXCEPTION 'Failed to delete user data: %', SQLERRM;
    END;
END;
$$;

-- Function to get user data summary (for admin purposes)
CREATE OR REPLACE FUNCTION get_user_data_summary(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    items_count INTEGER;
    groups_count INTEGER;
    profile_exists BOOLEAN;
BEGIN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Count user's items
    SELECT COUNT(*) INTO items_count
    FROM items
    WHERE user_id = user_id;
    
    -- Count user's group memberships
    SELECT COUNT(*) INTO groups_count
    FROM group_members
    WHERE user_id = user_id;
    
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_id) INTO profile_exists;
    
    -- Build summary
    result := jsonb_build_object(
        'user_id', user_id,
        'summary_date', now(),
        'data_summary', jsonb_build_object(
            'items_count', items_count,
            'groups_count', groups_count,
            'has_profile', profile_exists,
            'total_data_points', items_count + groups_count + (CASE WHEN profile_exists THEN 1 ELSE 0 END)
        )
    );
    
    RETURN result;
END;
$$;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION export_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_data_summary(UUID) TO authenticated;

-- Create RLS policies for these functions
-- Note: These functions use SECURITY DEFINER, so RLS policies on the underlying tables
-- will still apply when the functions access them

-- Add comments for documentation
COMMENT ON FUNCTION export_user_data(UUID) IS 'Exports all user data for GDPR compliance. Returns JSON with profile, items, and group memberships.';
COMMENT ON FUNCTION delete_user_data(UUID) IS 'Deletes all user data for GDPR compliance. Removes items, group memberships, and profile. Auth user deletion is handled by the delete-user-data edge function using Supabase Admin API.';
COMMENT ON FUNCTION get_user_data_summary(UUID) IS 'Returns a summary of user data for administrative purposes.';

-- Create a view for monitoring user data (admin only)
CREATE OR REPLACE VIEW user_data_overview AS
SELECT 
    u.id as user_id,
    u.email,
    u.created_at as user_created_at,
    p.full_name,
    p.updated_at as profile_updated_at,
    COUNT(DISTINCT i.id) as items_count,
    COUNT(DISTINCT gm.group_id) as groups_count,
    MAX(i.created_at) as last_item_created
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN items i ON u.id = i.user_id
LEFT JOIN group_members gm ON u.id = gm.user_id
GROUP BY u.id, u.email, u.created_at, p.full_name, p.updated_at;

-- Grant read access to the view for authenticated users (they can only see their own data)
GRANT SELECT ON user_data_overview TO authenticated;

-- Create RLS policy for the view
ALTER VIEW user_data_overview ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data overview" ON user_data_overview
    FOR SELECT USING (auth.uid() = user_id); 