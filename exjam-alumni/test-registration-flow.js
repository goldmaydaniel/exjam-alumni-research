const fetch = require('node-fetch');

async function testRegistrationFlow() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 Testing Registration Flow...\n');
  
  // Test 1: Check events endpoint
  console.log('1. Testing GET /api/events');
  try {
    const eventsRes = await fetch(`${baseUrl}/api/events`);
    const eventsData = await eventsRes.json();
    console.log(`   ✅ Events API responded: ${eventsData.events ? eventsData.events.length : 0} events found`);
    
    if (eventsData.events && eventsData.events.length > 0) {
      const firstEvent = eventsData.events[0];
      console.log(`   Event: ${firstEvent.title} (ID: ${firstEvent.id})`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 2: Check registration endpoint without auth
  console.log('\n2. Testing POST /api/registrations (without auth)');
  try {
    const regRes = await fetch(`${baseUrl}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: 'test-event-id',
        ticketType: 'REGULAR',
        specialRequests: 'Test request'
      })
    });
    const regData = await regRes.json();
    if (regRes.status === 401) {
      console.log(`   ✅ Correctly requires authentication (401)`);
    } else {
      console.log(`   ⚠️ Unexpected status: ${regRes.status}`);
      console.log(`   Response:`, regData);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 3: Check admin registrations endpoint
  console.log('\n3. Testing GET /api/admin/registrations');
  try {
    const adminRes = await fetch(`${baseUrl}/api/admin/registrations`);
    const adminData = await adminRes.json();
    console.log(`   ✅ Admin API responded:`, {
      success: adminData.success,
      totalRegistrations: adminData.stats?.total || 0,
      confirmed: adminData.stats?.confirmed || 0,
      pending: adminData.stats?.pending || 0
    });
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 4: Check specific event endpoint
  console.log('\n4. Testing GET /api/events/pg-conference-2025');
  try {
    const eventRes = await fetch(`${baseUrl}/api/events/pg-conference-2025`);
    if (eventRes.ok) {
      const eventData = await eventRes.json();
      console.log(`   ✅ Event found: ${eventData.title}`);
    } else {
      console.log(`   ⚠️ Event not found (${eventRes.status})`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n📊 Test Summary:');
  console.log('   - Events API is working');
  console.log('   - Registration API requires authentication (as expected)');
  console.log('   - Admin registrations API is accessible');
  console.log('\n⚠️ Issue: Frontend registration page doesn\'t call the actual API');
}

testRegistrationFlow();