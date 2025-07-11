-- Query to check the actual enum values for invitation_status
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'invitation_status'
ORDER BY e.enumsortorder;

-- Alternative query to see all enum types and their values
SELECT 
    t.typname AS enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%invitation%' OR t.typname LIKE '%status%'
GROUP BY t.typname;

-- Query to check the current invitation statuses in the database
SELECT DISTINCT status FROM group_invitations; 