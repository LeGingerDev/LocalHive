-- Fix ambiguous column references in user management functions
-- This migration fixes the "column reference 'user_id' is ambiguous" error

-- Drop existing functions first (PostgreSQL doesn't allow changing parameter names)
DROP FUNCTION IF EXISTS get_user_data_summary(UUID);
DROP FUNCTION IF EXISTS export_user_data(UUID);
DROP FUNCTION IF EXISTS delete_user_data(UUID);

-- Fix the get_user_data_summary function
CREATE OR REPLACE FUNCTION get_user_data_summary(target_user_id UUID)
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
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Count user's items
    SELECT COUNT(*) INTO items_count
    FROM items
    WHERE items.user_id = target_user_id;
    
    -- Count user's group memberships
    SELECT COUNT(*) INTO groups_count
    FROM group_members
    WHERE group_members.user_id = target_user_id;
    
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE profiles.id = target_user_id) INTO profile_exists;
    
    -- Build summary
    result := jsonb_build_object(
        'user_id', target_user_id,
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

-- Fix the export_user_data function to be more explicit
CREATE OR REPLACE FUNCTION export_user_data(target_user_id UUID)
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
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Get profile data
    SELECT to_jsonb(p.*) INTO profile_data
    FROM profiles p
    WHERE p.id = target_user_id;
    
    -- Get items data
    SELECT COALESCE(jsonb_agg(to_jsonb(i.*)), '[]'::jsonb) INTO items_data
    FROM items i
    WHERE i.user_id = target_user_id;
    
    -- Get groups data
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'group_id', g.id,
            'group_name', g.name,
            'group_description', g.description,
            'created_at', g.created_at,
            'updated_at', g.updated_at,
            'is_creator', gm.user_id = g.creator_id,
            'joined_at', gm.created_at
        )
    ), '[]'::jsonb) INTO groups_data
    FROM group_members gm
    JOIN groups g ON gm.group_id = g.id
    WHERE gm.user_id = target_user_id;
    
    -- Build the complete export
    result := jsonb_build_object(
        'export_date', now(),
        'user_id', target_user_id,
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

-- Fix the delete_user_data function to be more explicit
CREATE OR REPLACE FUNCTION delete_user_data(target_user_id UUID)
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
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Start transaction
    BEGIN
        -- Delete user's items and count them
        WITH deleted_items AS (
            DELETE FROM items 
            WHERE items.user_id = target_user_id 
            RETURNING id
        )
        SELECT COUNT(*) INTO deleted_items_count FROM deleted_items;
        
        -- Delete user's usage data
        DELETE FROM user_usage WHERE user_usage.user_id = target_user_id;
        GET DIAGNOSTICS deleted_usage = ROW_COUNT;
        
        -- Delete group invitations sent by the user
        DELETE FROM group_invitations WHERE group_invitations.inviter_id = target_user_id;
        GET DIAGNOSTICS deleted_invitations_sent = ROW_COUNT;
        
        -- Delete group invitations received by the user
        DELETE FROM group_invitations WHERE group_invitations.invitee_id = target_user_id;
        GET DIAGNOSTICS deleted_invitations_received = ROW_COUNT;
        
        -- Delete group posts by the user
        DELETE FROM group_posts WHERE group_posts.user_id = target_user_id;
        GET DIAGNOSTICS deleted_posts = ROW_COUNT;
        
        -- Remove user from all groups and count them
        WITH deleted_memberships AS (
            DELETE FROM group_members 
            WHERE group_members.user_id = target_user_id 
            RETURNING group_id
        )
        SELECT COUNT(*) INTO deleted_groups_count FROM deleted_memberships;
        
        -- Delete groups owned by the user (this will cascade to group_members and group_posts)
        DELETE FROM groups WHERE groups.creator_id = target_user_id;
        GET DIAGNOSTICS deleted_groups_owned = ROW_COUNT;
        
        -- Delete user profile
        DELETE FROM profiles WHERE profiles.id = target_user_id;
        GET DIAGNOSTICS deleted_profile = ROW_COUNT;
        
        -- Note: Auth user deletion is now handled by the delete-user-data edge function
        -- which uses the Supabase Admin API to remove the user from auth.users
        
        -- Build result
        result := jsonb_build_object(
            'success', true,
            'deleted_at', now(),
            'user_id', target_user_id,
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

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION export_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_data_summary(UUID) TO authenticated;

-- Update comments for the fixed functions
COMMENT ON FUNCTION export_user_data(UUID) IS 'Exports all user data for GDPR compliance. Returns JSON with profile, items, and group memberships. Fixed to avoid ambiguous column references.';
COMMENT ON FUNCTION delete_user_data(UUID) IS 'Deletes all user data for GDPR compliance. Removes items, group memberships, and profile. Auth user deletion is handled by the delete-user-data edge function using Supabase Admin API. Fixed to avoid ambiguous column references.';
COMMENT ON FUNCTION get_user_data_summary(UUID) IS 'Returns a summary of user data for administrative purposes. Fixed to avoid ambiguous column references.'; 