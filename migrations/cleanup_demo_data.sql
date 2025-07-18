-- Clean up demo data - remove hardcoded groups and items
-- Keep only the demo user for a clean demo experience

-- Delete demo items first (due to foreign key constraints)
DELETE FROM items 
WHERE profile_id = (SELECT id FROM profiles WHERE email = 'demo@localhive.com');

-- Delete demo groups
DELETE FROM groups 
WHERE created_by = (SELECT id FROM profiles WHERE email = 'demo@localhive.com');

-- Verify cleanup
SELECT 
    'Demo user exists' as status,
    COUNT(*) as count 
FROM profiles 
WHERE email = 'demo@localhive.com'
UNION ALL
SELECT 
    'Demo groups remaining' as status,
    COUNT(*) as count 
FROM groups 
WHERE created_by = (SELECT id FROM profiles WHERE email = 'demo@localhive.com')
UNION ALL
SELECT 
    'Demo items remaining' as status,
    COUNT(*) as count 
FROM items 
WHERE profile_id = (SELECT id FROM profiles WHERE email = 'demo@localhive.com'); 