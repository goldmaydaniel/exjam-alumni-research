const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function makeAdmin() {
  const client = await pool.connect();
  try {
    const email = 'goldmay@gmail.com';
    
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Check if user exists
    const userQuery = 'SELECT email, role, "emailVerified" FROM "User" WHERE email = $1';
    const userResult = await client.query(userQuery, [email]);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('✅ User found!');
      console.log('📧 Current email:', user.email);
      console.log('👤 Current role:', user.role);
      console.log('✉️  Email verified:', user.emailVerified);
      
      // Update to ADMIN role
      const updateQuery = 'UPDATE "User" SET role = $1, "emailVerified" = $2 WHERE email = $3 RETURNING email, role, "emailVerified"';
      const updateResult = await client.query(updateQuery, ['ADMIN', true, email]);
      
      if (updateResult.rows.length > 0) {
        const updatedUser = updateResult.rows[0];
        console.log('🎉 Successfully updated user to ADMIN role!');
        console.log('📊 Updated role:', updatedUser.role);
        console.log('✉️  Email verified:', updatedUser.emailVerified);
      }
      
    } else {
      console.log('❌ User not found with email:', email);
      console.log('💡 The user needs to register first before being made an admin');
      
      // List all users to see what's available
      const listQuery = 'SELECT email, "fullName", role FROM "User" ORDER BY "createdAt" DESC LIMIT 10';
      const listResult = await client.query(listQuery);
      
      console.log('\n📋 Current users in database:');
      listResult.rows.forEach(user => {
        console.log(`- ${user.email} (${user.fullName || 'No name'}) - Role: ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
makeAdmin();