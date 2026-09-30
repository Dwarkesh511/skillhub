import http from 'http';

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

async function runBookmarkEnrollmentIntegrationTests() {
  console.log('==================================================');
  console.log('🧪 SKILLHUB STEP 8D — BOOKMARKS & ENROLLMENTS API TESTS');
  console.log('==================================================\n');

  let studentCookie = null;

  try {
    // 1. Unauthenticated Bookmark Check -> Expected 401
    console.log('1️⃣ Testing GET /bookmarks WITHOUT authentication...');
    const res1 = await request('GET', '/bookmarks');
    console.log(`   Status: ${res1.status}, Message: "${res1.body.message}"`);
    if (res1.status !== 401) throw new Error('Expected 401 for unauthenticated bookmarks call');

    // 2. Unauthenticated Enrollment Check -> Expected 401
    console.log('\n2️⃣ Testing GET /enrollments WITHOUT authentication...');
    const res2 = await request('GET', '/enrollments');
    console.log(`   Status: ${res2.status}, Message: "${res2.body.message}"`);
    if (res2.status !== 401) throw new Error('Expected 401 for unauthenticated enrollments call');

    // 3. Login Demo Student
    console.log('\n3️⃣ Logging in Demo Student (alex@skillhub.com)...');
    const loginRes = await request('POST', '/auth/login', { email: 'alex@skillhub.com', password: 'password123' });
    console.log(`   Status: ${loginRes.status}, Cookie: ${loginRes.cookie}`);
    if (loginRes.status !== 200 || !loginRes.cookie) throw new Error('Login failed');
    studentCookie = loginRes.cookie;

    // 4. Get Initial Bookmarks
    console.log('\n4️⃣ Testing GET /bookmarks (Authenticated)...');
    const bmsRes = await request('GET', '/bookmarks', null, studentCookie);
    console.log(`   Status: ${bmsRes.status}, Bookmarks Count: ${bmsRes.body.count}`);
    if (bmsRes.status !== 200 || !Array.isArray(bmsRes.body.bookmarks)) throw new Error('GET /bookmarks failed');

    // 5. Add Bookmark for Course 1
    console.log('\n5️⃣ Testing POST /bookmarks (Course ID 1)...');
    const addBmRes = await request('POST', '/bookmarks', { courseId: 1 }, studentCookie);
    console.log(`   Status: ${addBmRes.status}, Message: "${addBmRes.body.message}"`);
    if (addBmRes.status !== 201 && addBmRes.status !== 409) throw new Error('POST /bookmarks failed');

    // 6. Duplicate Bookmark Check -> Expected 409
    console.log('\n6️⃣ Testing duplicate POST /bookmarks (Course ID 1)...');
    const dupBmRes = await request('POST', '/bookmarks', { courseId: 1 }, studentCookie);
    console.log(`   Status: ${dupBmRes.status}, Message: "${dupBmRes.body.message}"`);
    if (dupBmRes.status !== 409) throw new Error('Duplicate bookmark should return 409');

    // 7. Remove Bookmark for Course 1
    console.log('\n7️⃣ Testing DELETE /bookmarks/1...');
    const delBmRes = await request('DELETE', '/bookmarks/1', null, studentCookie);
    console.log(`   Status: ${delBmRes.status}, Message: "${delBmRes.body.message}"`);
    if (delBmRes.status !== 200) throw new Error('DELETE /bookmarks/1 failed');

    // 8. Get Enrollments
    console.log('\n8️⃣ Testing GET /enrollments (Authenticated)...');
    const enrsRes = await request('GET', '/enrollments', null, studentCookie);
    console.log(`   Status: ${enrsRes.status}, Enrollments Count: ${enrsRes.body.enrollments?.length}`);
    if (enrsRes.status !== 200 || !Array.isArray(enrsRes.body.enrollments)) throw new Error('GET /enrollments failed');

    // 9. Enroll in Course 1
    console.log('\n9️⃣ Testing POST /enrollments (Course ID 1)...');
    const enrollRes = await request('POST', '/enrollments', { courseId: 1 }, studentCookie);
    console.log(`   Status: ${enrollRes.status}, Message: "${enrollRes.body.message}"`);
    if (enrollRes.status !== 201 && enrollRes.status !== 409) throw new Error('POST /enrollments failed');

    // 10. Duplicate Enrollment Check -> Expected 409
    console.log('\n🔟 Testing duplicate POST /enrollments (Course ID 1)...');
    const dupEnrollRes = await request('POST', '/enrollments', { courseId: 1 }, studentCookie);
    console.log(`   Status: ${dupEnrollRes.status}, Message: "${dupEnrollRes.body.message}"`);
    if (dupEnrollRes.status !== 409) throw new Error('Duplicate enrollment should return 409');

    // 11. Get Enrollment by Course ID
    console.log('\n1️⃣1️⃣ Testing GET /enrollments/1...');
    const getEnrRes = await request('GET', '/enrollments/1', null, studentCookie);
    console.log(`   Status: ${getEnrRes.status}, Enrolled Course: "${getEnrRes.body.enrollment?.course?.title}"`);
    if (getEnrRes.status !== 200 || (getEnrRes.body.enrollment?.course?.id !== 1 && getEnrRes.body.enrollment?.courseId !== 1)) {
      throw new Error('GET /enrollments/1 failed');
    }

    // 12. Logout
    console.log('\n1️⃣2️⃣ Testing POST /auth/logout...');
    const logoutRes = await request('POST', '/auth/logout', null, studentCookie);
    console.log(`   Status: ${logoutRes.status}`);

    console.log('\n==================================================');
    console.log('🎉 ALL STEP 8D BOOKMARKS & ENROLLMENTS TESTS PASSED SUCCESSFULLY!');
    console.log('==================================================\n');

  } catch (err) {
    console.error('\n❌ FRONTEND BOOKMARK & ENROLLMENT TEST FAILED WITH ERROR:');
    console.error(err);
    process.exit(1);
  }
}

runBookmarkEnrollmentIntegrationTests();
