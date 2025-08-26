const { Client } = require('pg');
require('dotenv').config();

// Direct connection to Supabase
const connectionString = 'postgresql://postgres:A7NT3Or3rANhdeqz@db.yzrzjagkkycmdwuhrvww.supabase.co:5432/postgres';

console.log('🚀 Executing Complete Database Setup...\n');

async function executeSQLCommands() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📡 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Read the complete SQL file
    const fs = require('fs');
    const sqlContent = fs.readFileSync('complete-database-setup.sql', 'utf8');
    
    console.log('📊 Executing SQL commands...\n');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      // Extract operation type for logging
      const operation = statement.match(/^(CREATE|INSERT|ALTER|GRANT|DROP)/i)?.[1] || 'EXECUTE';
      const target = statement.match(/(TABLE|POLICY|INTO)\s+"?(\w+)"?/i)?.[2] || '';
      
      try {
        await client.query(statement);
        console.log(`✅ ${operation} ${target}`);
        successCount++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  ${operation} ${target} - already exists`);
        } else if (error.message.includes('duplicate key')) {
          console.log(`⏭️  ${operation} ${target} - duplicate entry`);
        } else {
          console.log(`❌ ${operation} ${target} - ${error.message}`);
          errorCount++;
        }
      }
    }
    
    console.log('\n================================');
    console.log(`✅ Successful operations: ${successCount}`);
    if (errorCount > 0) {
      console.log(`❌ Failed operations: ${errorCount}`);
    }
    console.log('================================\n');
    
    // Verify tables exist
    console.log('🔍 Verifying database tables...\n');
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📊 Tables in database:');
    tableCheck.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    // Check for PG Conference
    console.log('\n🎯 Checking for PG Conference 2025...');
    const eventCheck = await client.query(`
      SELECT title, "startDate", venue, price 
      FROM "Event" 
      WHERE title LIKE '%PG Conference%'
      LIMIT 1
    `);
    
    if (eventCheck.rows.length > 0) {
      const event = eventCheck.rows[0];
      console.log(`✅ PG Conference found!`);
      console.log(`   Title: ${event.title}`);
      console.log(`   Date: ${new Date(event.startDate).toLocaleDateString()}`);
      console.log(`   Venue: ${event.venue}`);
      console.log(`   Price: ₦${event.price.toLocaleString()}`);
    } else {
      console.log('⚠️  PG Conference not found in database');
    }
    
    // Count all events
    const eventCount = await client.query(`SELECT COUNT(*) as count FROM "Event"`);
    console.log(`\n📅 Total events in database: ${eventCount.rows[0].count}`);
    
    console.log('\n✨ Database setup completed!');
    console.log('\n📱 Your application is ready at: http://localhost:3001');
    console.log('   View events: http://localhost:3001/events');
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('no route to host')) {
      console.log('\n⚠️  Cannot connect to database directly.');
      console.log('\n📋 Please use Supabase Dashboard instead:');
      console.log('1. Go to: https://supabase.com/dashboard/project/yzrzjagkkycmdwuhrvww/sql/new');
      console.log('2. Copy SQL from: complete-database-setup.sql');
      console.log('3. Click "Run"');
    }
  } finally {
    await client.end();
  }
}

executeSQLCommands();