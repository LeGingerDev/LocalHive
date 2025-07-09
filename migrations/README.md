# Supabase Database Migrations

This directory contains SQL migrations for the Supabase database.

## Setting Up the Profiles Table

To fix the "Unknown User" and "No Email Provided" issue in the profile box, you need to create a `profiles` table in your Supabase database that will store user profile information.

### Existing Profiles Table Structure

Your Supabase database already has a profiles table with the following structure:

- `id` (UUID): Primary key, references auth.users(id)
- `full_name` (text): User's full name
- `email` (text): User's email address
- `bio` (text): User's bio/description
- `created_at` (timestamptz): Timestamp when the profile was created
- `updated_at` (timestamptz): Timestamp when the profile was last updated
- `theme_preference` (text): User's theme preference (light/dark)
- `use_system_theme` (boolean): Whether to use system theme settings
- `avatar_url` (text): URL to the user's avatar image

### What Our Code Does

The code in this project:

1. Creates a profile record for new users when they sign up with Google
2. Updates the profile when user information changes
3. Displays the correct user name and email in the profile box

### Troubleshooting

If you're still seeing "Unknown User" or "No Email Provided" after setting up the profiles table:

1. Make sure you sign out and sign back in to trigger the profile creation
2. Check the browser console for any errors
3. Verify that the profiles table was created correctly in the Supabase dashboard
4. Check that the Row Level Security policies are set up correctly

### Manual Profile Creation

If you need to manually create a profile for an existing user:

```sql
INSERT INTO public.profiles (id, email, full_name, avatar_url, bio, theme_preference, use_system_theme)
VALUES 
('USER_ID_FROM_AUTH_USERS', 'user@example.com', 'User Name', 'https://example.com/avatar.jpg', 'User bio', 'light', true);
```

Replace the values with the actual user information. 