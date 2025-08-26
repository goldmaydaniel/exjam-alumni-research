const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^@]+@/, ':****@'));
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('✅ Database connection successful!');
    console.log('Current database time:', result[0].current_time);
    
    // Try to count users
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();