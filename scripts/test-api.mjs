#!/usr/bin/env node

/**
 * Test script for TwinkyMeet API endpoints
 * Tests local development server with D1 emulator
 */

const BASE_URL = 'http://localhost:4321';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  console.log(`\n${colors.blue}▶ Testing:${colors.reset} ${name}`);
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`  ⚠ ${message}`, 'yellow');
}

let testsPassed = 0;
let testsFailed = 0;
let sessionCookie = null;

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (sessionCookie && !options.noAuth) {
    headers['Cookie'] = sessionCookie;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Capture session cookie from response
    const setCookie = response.headers.get('set-cookie');
    if (setCookie && setCookie.includes('session=')) {
      sessionCookie = setCookie.split(';')[0];
    }

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return { response, data };
  } catch (error) {
    logError(`Request failed: ${error.message}`);
    testsFailed++;
    return null;
  }
}

async function test1_HomePage() {
  logTest('1. Home page loads');
  const result = await request('/', { method: 'GET' });

  if (!result) return;

  if (result.response.status === 200) {
    logSuccess('Home page loaded successfully');
    testsPassed++;
  } else {
    logError(`Expected status 200, got ${result.response.status}`);
    testsFailed++;
  }
}

async function test2_AdminLoginPage() {
  logTest('2. Admin login page loads');
  const result = await request('/admin/login', { method: 'GET' });

  if (!result) return;

  if (result.response.status === 200) {
    logSuccess('Admin login page loaded successfully');
    testsPassed++;
  } else {
    logError(`Expected status 200, got ${result.response.status}`);
    testsFailed++;
  }
}

async function test3_AdminLoginAuth() {
  logTest('3. Admin authentication');

  // Test with correct credentials
  const result = await request('/api/admin/auth', {
    method: 'POST',
    body: JSON.stringify({
      password: 'admin123',
    }),
    noAuth: true,
  });

  if (!result) return;

  if (result.response.status === 200 && result.data.success) {
    logSuccess('Admin login successful');
    logSuccess(`Session cookie set: ${sessionCookie ? 'Yes' : 'No'}`);
    testsPassed++;
  } else {
    logError(`Login failed: ${JSON.stringify(result.data)}`);
    testsFailed++;
  }
}

async function test4_AdminDashboard() {
  logTest('4. Admin dashboard access (authenticated)');

  if (!sessionCookie) {
    logWarning('No session cookie, skipping test');
    return;
  }

  const result = await request('/admin', { method: 'GET' });

  if (!result) return;

  if (result.response.status === 200) {
    logSuccess('Admin dashboard loaded successfully');
    testsPassed++;
  } else {
    logError(`Expected status 200, got ${result.response.status}`);
    testsFailed++;
  }
}

async function test5_SettingsAPI() {
  logTest('5. Settings API (enable RSVPs)');

  if (!sessionCookie) {
    logWarning('No session cookie, skipping test');
    return;
  }

  const result = await request('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify({
      rsvp_open: 'true',
      activity_submissions_open: 'true',
    }),
  });

  if (!result) return;

  if (result.response.status === 200 && result.data.success) {
    logSuccess('Settings updated successfully');
    testsPassed++;
  } else {
    logError(`Settings update failed: ${JSON.stringify(result.data)}`);
    testsFailed++;
  }
}

async function test6_RSVPSubmission() {
  logTest('6. RSVP submission');

  // Use unique email with timestamp to avoid duplicates
  const uniqueEmail = `test-${Date.now()}@example.com`;

  const result = await request('/api/rsvp', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Attendee',
      email: uniqueEmail,
      dietary_restrictions: 'Vegetarian',
      plus_one: true,
      arrival_time: 'Friday evening',
      departure_time: 'Sunday afternoon',
      excited_about: 'Meeting everyone!',
    }),
    noAuth: true,
  });

  if (!result) return;

  if (result.response.status === 201 && result.data.success) {
    logSuccess('RSVP submitted successfully');
    logSuccess(`Attendee ID: ${result.data.attendeeId}`);
    testsPassed++;
  } else {
    logError(`RSVP submission failed: ${JSON.stringify(result.data)}`);
    testsFailed++;
  }
}

async function test7_DuplicateRSVP() {
  logTest('7. Duplicate RSVP prevention');

  const result = await request('/api/rsvp', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Attendee 2',
      email: 'test@example.com', // Same email as test 6
      dietary_restrictions: 'None',
    }),
    noAuth: true,
  });

  if (!result) return;

  if (result.response.status === 409 && !result.data.success) {
    logSuccess('Duplicate RSVP correctly prevented');
    testsPassed++;
  } else {
    logError(`Expected duplicate prevention, got: ${JSON.stringify(result.data)}`);
    testsFailed++;
  }
}

async function test8_ActivitySubmission() {
  logTest('8. Activity submission');

  const result = await request('/api/activity', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Board Games Night',
      description: 'Bring your favorite board games!',
      host_name: 'Test Host',
      host_email: 'host@example.com',
      duration: 120,
      equipment_needed: 'Board games, tables',
      capacity: 10,
      time_preference: 'Evening',
      activity_type: 'Gaming',
    }),
    noAuth: true,
  });

  if (!result) return;

  if (result.response.status === 201 && result.data.success) {
    logSuccess('Activity submitted successfully');
    logSuccess(`Activity ID: ${result.data.activityId}`);
    testsPassed++;
  } else {
    logError(`Activity submission failed: ${JSON.stringify(result.data)}`);
    testsFailed++;
  }
}

async function test9_GetRSVPs() {
  logTest('9. Fetch RSVPs (admin API)');

  if (!sessionCookie) {
    logWarning('No session cookie, skipping test');
    return;
  }

  const result = await request('/api/admin/rsvps', { method: 'GET' });

  if (!result) return;

  if (
    result.response.status === 200 &&
    result.data.success &&
    Array.isArray(result.data.attendees)
  ) {
    logSuccess(`Fetched ${result.data.attendees.length} RSVPs`);
    if (result.data.attendees.length > 0) {
      logSuccess(
        `Sample RSVP: ${result.data.attendees[0].name} (${result.data.attendees[0].email})`
      );
    }
    testsPassed++;
  } else {
    logError(`Failed to fetch RSVPs: ${JSON.stringify(result.data)}`);
    testsFailed++;
  }
}

async function test10_GetActivities() {
  logTest('10. Fetch activities (admin API)');

  if (!sessionCookie) {
    logWarning('No session cookie, skipping test');
    return;
  }

  const result = await request('/api/admin/activities', { method: 'GET' });

  if (!result) return;

  if (
    result.response.status === 200 &&
    result.data.success &&
    Array.isArray(result.data.activities)
  ) {
    logSuccess(`Fetched ${result.data.activities.length} activities`);
    if (result.data.activities.length > 0) {
      logSuccess(
        `Sample activity: ${result.data.activities[0].title} (${result.data.activities[0].status})`
      );
    }
    testsPassed++;
  } else {
    logError(`Failed to fetch activities: ${JSON.stringify(result.data)}`);
    testsFailed++;
  }
}

async function test11_UnauthenticatedAdminAccess() {
  logTest('11. Unauthorized admin API access');

  const result = await request('/api/admin/rsvps', {
    method: 'GET',
    noAuth: true, // Don't send session cookie
  });

  if (!result) return;

  if (result.response.status === 401 && !result.data.success) {
    logSuccess('Unauthorized access correctly blocked');
    testsPassed++;
  } else {
    logError(`Expected 401 Unauthorized, got ${result.response.status}`);
    testsFailed++;
  }
}

async function test12_AdminLogout() {
  logTest('12. Admin logout');

  if (!sessionCookie) {
    logWarning('No session cookie, skipping test');
    return;
  }

  const result = await request('/api/admin/logout', { method: 'POST' });

  if (!result) return;

  if (result.response.status === 200 && result.data.success) {
    logSuccess('Logout successful');
    sessionCookie = null; // Clear session
    testsPassed++;
  } else {
    logError(`Logout failed: ${JSON.stringify(result.data)}`);
    testsFailed++;
  }
}

async function runTests() {
  log('\n═══════════════════════════════════════════', 'cyan');
  log('  TwinkyMeet API Test Suite', 'cyan');
  log('═══════════════════════════════════════════\n', 'cyan');

  // Run all tests in sequence
  await test1_HomePage();
  await test2_AdminLoginPage();
  await test3_AdminLoginAuth();
  await test4_AdminDashboard();
  await test5_SettingsAPI();
  await test6_RSVPSubmission();
  await test7_DuplicateRSVP();
  await test8_ActivitySubmission();
  await test9_GetRSVPs();
  await test10_GetActivities();
  await test11_UnauthenticatedAdminAccess();
  await test12_AdminLogout();

  // Print summary
  log('\n═══════════════════════════════════════════', 'cyan');
  log('  Test Summary', 'cyan');
  log('═══════════════════════════════════════════\n', 'cyan');

  const total = testsPassed + testsFailed;
  log(`Total Tests:  ${total}`, 'cyan');
  log(`Passed:       ${testsPassed}`, 'green');
  log(`Failed:       ${testsFailed}`, testsFailed > 0 ? 'red' : 'cyan');

  if (testsFailed === 0) {
    log('\n✨ All tests passed! ✨\n', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some tests failed\n', 'red');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  logError(`\nTest suite failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
