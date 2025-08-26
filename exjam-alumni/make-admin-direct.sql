-- Make goldmay@gmail.com a super admin
-- First, check if user exists
SELECT email, role, "emailVerified" FROM "User" WHERE email = 'goldmay@gmail.com';

-- Update user to admin role if exists
UPDATE "User" 
SET role = 'ADMIN', "emailVerified" = true 
WHERE email = 'goldmay@gmail.com';

-- Verify the update
SELECT email, role, "emailVerified", "createdAt" FROM "User" WHERE email = 'goldmay@gmail.com';

-- If user doesn't exist, show all existing users
SELECT email, "fullName", role FROM "User" ORDER BY "createdAt" DESC LIMIT 10;