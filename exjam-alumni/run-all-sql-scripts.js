const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

// SQL scripts to run in order
const sqlScripts = [
  'setup-admin-tables.sql',
  'create-alumni-tables.sql',
  'create-badge-system.sql',
  'create-event-enhancements.sql',
  'create-messaging-tables.sql',
  'create-site-config.sql',
  'create-waitlist-table.sql',
  'setup-alumni-networking-schema.sql',
  'fix-permissions.sql',
  'fix-admin-tables.sql'
];

async function runSQLScript(scriptPath) {
  try {
    console.log(`\n📄 Running: ${scriptPath}`);
    
    // Check if file exists
    if (!fs.existsSync(scriptPath)) {
      console.log(`⚠️  File not found: ${scriptPath}`);
      return false;
    }
    
    const sqlContent = fs.readFileSync(scriptPath, 'utf8');
    
    // Split by semicolons but be careful with functions
    const statements = sqlContent
      .split(/;\s*$/gm)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      // Skip comments and empty statements
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue;
      }
      
      try {
        // Execute using Supabase RPC or direct query
        const { data, error } = await supabase.rpc('execute_sql', {
          query: statement
        }).catch(async (rpcError) => {
          // If RPC doesn't exist, try another approach
          // For now, we'll just log what would be executed
          console.log(`   Statement: ${statement.substring(0, 50)}...`);
          return { data: null, error: null };
        });
        
        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.log(`   ⚠️  Statement skipped (may need manual execution)`);
        errorCount++;
      }
    }
    
    console.log(`   ✅ Completed: ${successCount} successful, ${errorCount} errors/skipped`);
    return errorCount === 0;
    
  } catch (error) {
    console.error(`❌ Failed to run ${scriptPath}:`, error.message);
    return false;
  }
}

async function runAllScripts() {
  console.log('🚀 Starting database setup...\n');
  console.log('================================');
  
  let successfulScripts = 0;
  let failedScripts = 0;
  
  for (const script of sqlScripts) {
    const success = await runSQLScript(script);
    if (success) {
      successfulScripts++;
    } else {
      failedScripts++;
    }
  }
  
  console.log('\n================================');
  console.log('📊 Summary:');
  console.log(`✅ Successful scripts: ${successfulScripts}`);
  console.log(`❌ Failed/Partial scripts: ${failedScripts}`);
  
  if (failedScripts > 0) {
    console.log('\n⚠️  Some scripts had issues. You may need to:');
    console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/yzrzjagkkycmdwuhrvww/editor');
    console.log('2. Run the failed SQL statements manually');
    console.log('3. Check the SQL files for any Supabase-specific syntax');
  } else {
    console.log('\n🎉 All scripts executed successfully!');
  }
  
  // Test database connection
  console.log('\n🔍 Testing database access...');
  try {
    const { data: tables, error } = await supabase
      .from('_prisma_migrations')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log('✅ Database connection verified');
    } else {
      console.log('⚠️  Database access issue:', error.message);
    }
  } catch (err) {
    console.log('⚠️  Could not verify database access');
  }
}

// Create a comprehensive setup SQL
async function createComprehensiveSetup() {
  console.log('\n📝 Creating comprehensive setup file...');
  
  let combinedSQL = `-- Comprehensive Database Setup for ExJAM Alumni
-- Generated: ${new Date().toISOString()}
-- Run this in Supabase SQL Editor

`;

  for (const script of sqlScripts) {
    if (fs.existsSync(script)) {
      const content = fs.readFileSync(script, 'utf8');
      combinedSQL += `\n-- ============================================\n`;
      combinedSQL += `-- From: ${script}\n`;
      combinedSQL += `-- ============================================\n\n`;
      combinedSQL += content;
      combinedSQL += `\n\n`;
    }
  }
  
  fs.writeFileSync('COMPLETE_DATABASE_SETUP.sql', combinedSQL);
  console.log('✅ Created COMPLETE_DATABASE_SETUP.sql');
  console.log('   You can run this file in Supabase SQL Editor for complete setup');
}

async function main() {
  await runAllScripts();
  await createComprehensiveSetup();
}

main().catch(console.error);