const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rqthqvxidzvaffgdyead.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxdGhxdnhpZHp2YWZmZ2R5ZWFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0OTcxODEsImV4cCI6MjA5OTA3MzE4MX0.bWVPlvgNcK25Jr23rwIGwwoDB83K-mGro1bmc68pQ10';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Logging in as david.c@vms.local...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'david.c@vms.local',
    password: 'Employee@123'
  });

  if (authErr) {
    console.error("Auth error:", authErr);
    return;
  }

  const userId = authData.user.id;
  console.log("Logged in successfully! User ID:", userId);

  // Get employee ID
  const { data: emp } = await supabase
    .from('Employee')
    .select('id')
    .eq('email', 'david.c@vms.local')
    .single();
  const employeeId = emp.id;
  console.log("Employee ID:", employeeId);

  // We need to temporarily allow inserting/selecting Visitor to test subsequent steps
  // Let's see if we can insert Invitation and Visit.
  // To bypass visitor select restriction for this test, let's use an existing visitor ID if any,
  // or let's create a visitor and see what happens.
  // Actually, let's try to insert the invitation directly first using a dummy UUID or existing visitor ID.
  const visitorId = '6be22737-4058-496d-a7fa-bd6d4a3bde25'; // from previous run

  console.log("Attempting to insert Invitation...");
  const { data: invite, error: inviteErr } = await supabase
    .from('Invitation')
    .insert({
      visitorId,
      hostEmployeeId: employeeId,
      qrToken: 'QR-TEST-TOKEN-1234',
      scheduledAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString()
    })
    .select('id')
    .single();

  if (inviteErr) {
    console.error("Invitation insert error:", inviteErr);
  } else {
    console.log("Invitation inserted! ID:", invite.id);

    console.log("Attempting to insert Visit...");
    const { data: visit, error: visitErr } = await supabase
      .from('Visit')
      .insert({
        visitorId,
        hostEmployeeId: employeeId,
        invitationId: invite.id,
        branchId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', // Bangalore HQ
        purpose: 'Test Purpose',
        status: 'Expected',
        scheduledAt: new Date().toISOString(),
        checkInCode: 'VMS-TEST-123',
        createdByUserId: userId
      })
      .select('id')
      .single();

    if (visitErr) {
      console.error("Visit insert error:", visitErr);
    } else {
      console.log("Visit inserted! ID:", visit.id);
      
      // Cleanup
      await supabase.from('Visit').delete().eq('id', visit.id);
    }
    await supabase.from('Invitation').delete().eq('id', invite.id);
  }
}

run();
