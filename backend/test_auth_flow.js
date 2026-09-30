import http from 'http';
import app from './src/app.js';

let server;
const PORT = 5002;
const BASE_URL = `http://localhost:${PORT}`;

function request(method, path, body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
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

async function runTests() {
  console.log('🧪 Starting SkillHub Authentication & Profile API End-to-End Tests...\n');

  server = app.listen(PORT, async () => {
    try {
      // 1. Health Check Test
      console.log('1️⃣ Testing GET /api/health...');
      const res1 = await request('GET', '/api/health');
      console.log(` Status: ${res1.status}, Body:`, res1.body);
      if (res1.status !== 200 || !res1.body.success) throw new Error('Health check failed');

      // 2. Register New Student Test
      const testEmail = `student_${Date.now()}@example.com`;
      console.log(`\n2️⃣ Testing POST /api/auth/register (${testEmail})...`);
      const res2 = await request('POST', '/api/auth/register', {
        name: 'Test Student',
        email: testEmail,
        password: 'Password123!',
        phone: '+91 9999988888',
        bio: 'Automated test bio'
      });
      console.log(` Status: ${res2.status}, Body:`, res2.body);
      if (res2.status !== 201 || !res2.body.user || res2.body.user.passwordHash) {
        throw new Error('Register new student failed or leaked passwordHash');
      }

      // 3. Register Duplicate Email Test (Should fail with 409 Conflict)
      console.log('\n3️⃣ Testing POST /api/auth/register with duplicate email...');
      const res3 = await request('POST', '/api/auth/register', {
        name: 'Duplicate Student',
        email: testEmail,
        password: 'Password123!'
      });
      console.log(` Status: ${res3.status} (Expected 409), Body:`, res3.body);
      if (res3.status !== 409) throw new Error('Duplicate email should return 409');

      // 4. Login with Wrong Password (Should fail with 401 Unauthorized)
      console.log('\n4️⃣ Testing POST /api/auth/login with wrong password...');
      const res4 = await request('POST', '/api/auth/login', {
        email: testEmail,
        password: 'WrongPassword999'
      });
      console.log(` Status: ${res4.status} (Expected 401), Body:`, res4.body);
      if (res4.status !== 401) throw new Error('Wrong password should return 401');

      // 5. Login with Valid Credentials (Demo Student: alex@skillhub.com)
      console.log('\n5️⃣ Testing POST /api/auth/login (alex@skillhub.com / password123)...');
      const res5 = await request('POST', '/api/auth/login', {
        email: 'alex@skillhub.com',
        password: 'password123'
      });
      console.log(` Status: ${res5.status}, Cookie: ${res5.cookie}, Body:`, res5.body);
      if (res5.status !== 200 || !res5.cookie || !res5.cookie.includes('skillhub_token=')) {
        throw new Error('Login failed or did not return HttpOnly cookie');
      }
      const sessionCookie = res5.cookie;

      // 6. Access Profile Without Authentication Cookie (Should fail with 401)
      console.log('\n6️⃣ Testing GET /api/users/profile without cookie...');
      const res6 = await request('GET', '/api/users/profile');
      console.log(` Status: ${res6.status} (Expected 401), Body:`, res6.body);
      if (res6.status !== 401) throw new Error('Unauthenticated profile request should return 401');

      // 7. Access Profile With Valid Authentication Cookie
      console.log('\n7️⃣ Testing GET /api/users/profile with valid cookie...');
      const res7 = await request('GET', '/api/users/profile', null, sessionCookie);
      console.log(` Status: ${res7.status}, User Name: "${res7.body.user?.name}", Email: "${res7.body.user?.email}"`);
      if (res7.status !== 200 || res7.body.user?.email !== 'alex@skillhub.com' || res7.body.user?.passwordHash) {
        throw new Error('Get profile failed or leaked passwordHash');
      }

      // 8. Update Profile Info
      console.log('\n8️⃣ Testing PUT /api/users/profile (Updating bio & phone)...');
      const res8 = await request('PUT', '/api/users/profile', {
        phone: '+91 9123456789',
        bio: 'Updated Bio via Automated API Test'
      }, sessionCookie);
      console.log(` Status: ${res8.status}, Updated Bio: "${res8.body.user?.bio}"`);
      if (res8.status !== 200 || res8.body.user?.bio !== 'Updated Bio via Automated API Test') {
        throw new Error('Update profile failed');
      }

      // 9. Change Password with Wrong Current Password (Should fail with 400)
      console.log('\n9️⃣ Testing PUT /api/users/change-password with wrong current password...');
      const res9 = await request('PUT', '/api/users/change-password', {
        currentPassword: 'IncorrectPassword',
        newPassword: 'BrandNewPassword123'
      }, sessionCookie);
      console.log(` Status: ${res9.status} (Expected 400), Body:`, res9.body);
      if (res9.status !== 400) throw new Error('Wrong current password should return 400');

      // 10. Change Password with Correct Password for newly created user
      console.log('\n🔟 Testing POST /api/auth/login for test user & changing password...');
      const loginTestUser = await request('POST', '/api/auth/login', {
        email: testEmail,
        password: 'Password123!'
      });
      const testUserCookie = loginTestUser.cookie;

      const res10 = await request('PUT', '/api/users/change-password', {
        currentPassword: 'Password123!',
        newPassword: 'BrandNewPassword123!'
      }, testUserCookie);
      console.log(` Status: ${res10.status}, Message: "${res10.body.message}"`);
      if (res10.status !== 200) throw new Error('Change password failed');

      // Verify login with NEW password works
      console.log('\n11️⃣ Testing POST /api/auth/login with newly changed password...');
      const res11 = await request('POST', '/api/auth/login', {
        email: testEmail,
        password: 'BrandNewPassword123!'
      });
      console.log(` Status: ${res11.status}, User: ${res11.body.user?.email}`);
      if (res11.status !== 200) throw new Error('Login with new password failed');

      // 12. Logout Test
      console.log('\n12️⃣ Testing POST /api/auth/logout...');
      const res12 = await request('POST', '/api/auth/logout', null, res11.cookie);
      console.log(` Status: ${res12.status}, Set-Cookie Header:`, res12.headers['set-cookie']);
      if (res12.status !== 200) throw new Error('Logout failed');

      // 13. Verify Accessing Profile After Logout Fails (401)
      console.log('\n13️⃣ Testing GET /api/users/profile after logout...');
      const res13 = await request('GET', '/api/users/profile');
      console.log(` Status: ${res13.status} (Expected 401)`);
      if (res13.status !== 401) throw new Error('Profile access after logout should be 401');

      console.log('\n🎉 ALL 13 AUTHENTICATION & USER PROFILE API TESTS PASSED SUCCESSFULLY! 🎉\n');
    } catch (err) {
      console.error('❌ Test Failure:', err);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
}

runTests();
