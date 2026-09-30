import http from 'http';
import prisma from './backend/src/config/db.js';

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

function request(method, path, body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`);
    const headers = {};
    if (body) {
      headers['Content-Type'] = 'application/json';
    }
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    const req = http.request(url, { method, headers }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(responseBody);
        } catch (e) {
          json = responseBody;
        }

        const setCookieHeader = res.headers['set-cookie'];
        let extractedCookie = null;
        if (setCookieHeader) {
          extractedCookie = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
          if (extractedCookie.includes(';')) {
            extractedCookie = extractedCookie.split(';')[0];
          }
        }

        resolve({
          status: res.statusCode,
          headers: res.headers,
          cookie: extractedCookie,
          body: json
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runAuthIntegrationTests() {
  console.log('==================================================');
  console.log('🧪 SKILLHUB STEP 8B — FRONTEND AUTH INTEGRATION TESTS');
  console.log('==================================================\n');

  let testUserId = null;
  const newStudentEmail = `step8b_test_${Date.now()}@example.com`;
  let activeCookie = null;

  try {
    // 1. Initial Session Check (Logged Out) -> Expected 401
    console.log('1️⃣ Checking session status while logged out...');
    const res1 = await request('GET', '/users/profile');
    console.log(`   Status: ${res1.status}, Message: "${res1.body.message}"`);
    if (res1.status !== 401) throw new Error('Expected 401 Unauthorized when logged out.');

    // 2. Login as Demo Student
    console.log('\n2️⃣ Logging in as Demo Student (alex@skillhub.com)...');
    const res2 = await request('POST', '/auth/login', { email: 'alex@skillhub.com', password: 'password123' });
    console.log(`   Status: ${res2.status}, Cookie: ${res2.cookie}`);
    if (res2.status !== 200 || !res2.cookie) throw new Error('Demo student login failed.');
    activeCookie = res2.cookie;

    // 3. Verify Session Persistence (getProfile with cookie)
    console.log('\n3️⃣ Verifying session persistence via GET /users/profile...');
    const res3 = await request('GET', '/users/profile', null, activeCookie);
    console.log(`   Status: ${res3.status}, Logged In User: "${res3.body.user?.name}"`);
    if (res3.status !== 200 || res3.body.user?.email !== 'alex@skillhub.com') {
      throw new Error('Profile session verification failed.');
    }

    // 4. Update Profile
    console.log('\n4️⃣ Testing PUT /users/profile...');
    const updatedBio = `Updated Bio at ${new Date().toISOString()}`;
    const res4 = await request('PUT', '/users/profile', {
      name: 'Alex Johnson',
      email: 'alex@skillhub.com',
      phone: '+91 9876543210',
      bio: updatedBio
    }, activeCookie);
    console.log(`   Status: ${res4.status}, Message: "${res4.body.message}"`);
    if (res4.status !== 200 || res4.body.user?.bio !== updatedBio) {
      throw new Error('Update profile failed.');
    }

    // 5. Change Password & Revert
    console.log('\n5️⃣ Testing PUT /users/change-password...');
    const res5 = await request('PUT', '/users/change-password', {
      currentPassword: 'password123',
      newPassword: 'newPassword123!'
    }, activeCookie);
    console.log(`   Status: ${res5.status}, Message: "${res5.body.message}"`);
    if (res5.status !== 200) throw new Error('Change password failed.');

    // Revert password back to password123
    console.log('   Reverting password back to password123...');
    const res5b = await request('PUT', '/users/change-password', {
      currentPassword: 'newPassword123!',
      newPassword: 'password123'
    }, activeCookie);
    if (res5b.status !== 200) throw new Error('Reverting password failed.');
    console.log('   ✅ Password reverted successfully.');

    // 6. Logout
    console.log('\n6️⃣ Testing POST /auth/logout...');
    const res6 = await request('POST', '/auth/logout', null, activeCookie);
    console.log(`   Status: ${res6.status}, Cookie cleared.`);
    activeCookie = null; // Browser clears cookie upon logout

    // 7. Verify session cleared after logout -> Expected 401
    console.log('   Verifying session is destroyed after logout...');
    const res7 = await request('GET', '/users/profile', null, activeCookie);
    console.log(`   Status: ${res7.status}, Message: "${res7.body.message}"`);
    if (res7.status !== 401) throw new Error('Expected 401 Unauthorized after logout.');

    // 8. Register a new student account
    console.log(`\n7️⃣ Registering new student account (${newStudentEmail})...`);
    const res8 = await request('POST', '/auth/register', {
      name: 'Step 8B New Student',
      email: newStudentEmail,
      password: 'password123'
    });
    console.log(`   Status: ${res8.status}, Registered User ID: ${res8.body.user?.id}`);
    if (res8.status !== 201 || !res8.body.user?.id) throw new Error('Registration failed.');
    testUserId = res8.body.user.id;

    // 9. Duplicate Registration Check -> Expected 409
    console.log('\n8️⃣ Testing duplicate email registration (409 Conflict)...');
    const res9 = await request('POST', '/auth/register', {
      name: 'Duplicate Student',
      email: newStudentEmail,
      password: 'password123'
    });
    console.log(`   Status: ${res9.status}, Message: "${res9.body.message}"`);
    if (res9.status !== 409) throw new Error('Expected 409 Conflict for duplicate email.');

    // 10. Login with newly created student account
    console.log('\n9️⃣ Logging in with newly created student account...');
    const res10 = await request('POST', '/auth/login', {
      email: newStudentEmail,
      password: 'password123'
    });
    console.log(`   Status: ${res10.status}, User Name: "${res10.body.user?.name}"`);
    if (res10.status !== 200) throw new Error('Login with new account failed.');

    // Clean up session & test user
    await request('POST', '/auth/logout', null, res10.cookie);

    if (testUserId) {
      console.log('\n🔟 Cleaning up temporary test user...');
      await prisma.user.delete({ where: { id: testUserId } });
      console.log(`   Successfully deleted test user ID: ${testUserId}`);
    }

    console.log('\n==================================================');
    console.log('🎉 ALL STEP 8B FRONTEND AUTH TESTS PASSED SUCCESSFULLY!');
    console.log('==================================================\n');

  } catch (err) {
    console.error('\n❌ FRONTEND AUTH TEST FAILED WITH ERROR:');
    console.error(err);

    if (testUserId) {
      try { await prisma.user.delete({ where: { id: testUserId } }); } catch (e) {}
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAuthIntegrationTests();
