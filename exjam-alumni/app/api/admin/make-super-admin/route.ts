import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('✅ User found!');
      console.log('📧 Current email:', existingUser.email);
      console.log('👤 Current role:', existingUser.role);
      
      // Update to ADMIN role
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { 
          role: 'ADMIN',
          emailVerified: true // Ensure email is verified
        },
      });
      
      console.log('🎉 Successfully updated user to ADMIN role!');
      
      return NextResponse.json({ 
        success: true, 
        message: 'User successfully made admin',
        user: {
          email: updatedUser.email,
          role: updatedUser.role,
          emailVerified: updatedUser.emailVerified
        }
      });
      
    } else {
      console.log('❌ User not found with email:', email);
      
      // List all users to see what's available
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true
        },
        take: 10
      });
      
      return NextResponse.json({ 
        success: false, 
        message: 'User not found. User needs to register first.',
        availableUsers: allUsers
      });
    }
    
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Allow GET for testing
export async function GET() {
  return NextResponse.json({ message: 'Make Super Admin endpoint is ready' });
}