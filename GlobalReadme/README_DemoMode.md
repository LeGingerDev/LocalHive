# Demo Mode Management

This document explains how to manage demo mode for Google Play/App Store review purposes.

## Overview

Demo mode allows reviewers to test the app without requiring Google/Apple sign-in. When enabled, a demo login button appears on the authentication screen.

## Demo Mode Commands

### Enable Demo Mode
```sql
UPDATE demo_mode 
SET is_enabled = true 
WHERE id = 1;
```

### Disable Demo Mode
```sql
UPDATE demo_mode 
SET is_enabled = false 
WHERE id = 1;
```

### Check Demo Mode Status
```sql
SELECT is_enabled FROM demo_mode WHERE id = 1;
```

## Demo User Credentials

When demo mode is enabled, reviewers can log in with:
- **Email**: demo@localhive.com
- **Password**: demo123456

## Demo User Details

The demo user starts with a clean account and can:
- Create new groups
- Add items to groups
- Test search functionality
- Experience the full app flow

## Important Notes

- Demo mode should only be enabled during review periods
- The demo user has no pre-existing data - reviewers create their own content
- All new items get proper embeddings through the normal flow
- Demo mode can be toggled on/off without affecting production users

## Cleanup Commands

If you need to clean up demo data (groups/items created by reviewers):

```sql
-- Remove demo items
DELETE FROM items 
WHERE profile_id = (SELECT id FROM profiles WHERE email = 'demo@localhive.com');

-- Remove demo groups
DELETE FROM groups 
WHERE created_by = (SELECT id FROM profiles WHERE email = 'demo@localhive.com');
``` 