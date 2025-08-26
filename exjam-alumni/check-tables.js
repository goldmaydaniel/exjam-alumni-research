const { PrismaClient } = require('@prisma/client');
const { withAccelerate } = require('@prisma/extension-accelerate');
require('dotenv').config();

async function checkTables() {
  const prisma = new PrismaClient().$extends(withAccelerate());

  try {
    console.log('Checking existing tables in the database...\n');
    
    // Get all table names
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    if (tables.length === 0) {
      console.log('❌ No tables found in the database');
    } else {
      console.log('✅ Found', tables.length, 'tables:');
      tables.forEach(table => {
        console.log('  -', table.table_name);
      });
    }
    
  } catch (error) {
    console.error('Error checking tables:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();