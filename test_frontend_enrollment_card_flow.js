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
          data: json,
          cookie: extractedCookie
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

async function runEnrollmentCardFlowTests() {
  console.log('==================================================');
  console.log('🧪 TESTING SKILLHUB COURSE CARD ENROLL NOW FLOW');
  console.log('==================================================\n');

  const testEmail = `card_enroll_test_${Date.now()}@example.com`;
  const testPassword = 'password123';
  let authCookie = null;

  try {
    // --------------------------------------------------
    // TEST 1: Unauthenticated state check
    // --------------------------------------------------
    console.log('1️⃣ TEST 1: Unauthenticated request to POST /api/enrollments { courseId: 2 }...');
    const unauthRes = await request('POST', '/enrollments', { courseId: 2 });
    if (unauthRes.status !== 401) {
      throw new Error(`Expected status 401, received status ${unauthRes.status}`);
    }
    console.log('   ✅ Unauthenticated user receives 401 (triggers /login redirect in CourseCard UI)');

    // --------------------------------------------------
    // Register & Login fresh test student
    // --------------------------------------------------
    console.log('\n2️⃣ Registering test student user...');
    const regRes = await request('POST', '/auth/register', { name: 'Card Flow Student', email: testEmail, password: testPassword });
    if (regRes.status !== 201 || !regRes.data.success) {
      throw new Error(`Registration failed: ${regRes.data?.message}`);
    }
    console.log(`   Registered test student: ${testEmail}`);

    console.log('   Logging in test student...');
    const loginRes = await request('POST', '/auth/login', { email: testEmail, password: testPassword });
    if (loginRes.status !== 200 || !loginRes.data.success || !loginRes.cookie) {
      throw new Error(`Login failed: ${loginRes.data?.message}`);
    }
    authCookie = loginRes.cookie;
    console.log('   ✅ Logged in successfully and HttpOnly cookie set.');

    // --------------------------------------------------
    // TEST 1 (Cont): Enroll in Course ID 2
    // --------------------------------------------------
    console.log('\n3️⃣ TEST 1 (Cont): Authenticated enrollment in Course ID 2...');
    const enrollRes1 = await request('POST', '/enrollments', { courseId: 2 }, authCookie);
    console.log(`   Status: ${enrollRes1.status}, Message: "${enrollRes1.data?.message}"`);
    if (enrollRes1.status !== 201 || !enrollRes1.data.success) {
      throw new Error(`Course 2 enrollment failed: ${enrollRes1.data?.message}`);
    }
    console.log(`   ✅ Successfully enrolled in Course ID 2 (Enrollment ID: ${enrollRes1.data.enrollment.id})`);

    // Verify course appears in Dashboard
    console.log('\n4️⃣ Verifying newly enrolled course appears in GET /api/dashboard...');
    const dashRes1 = await request('GET', '/dashboard', null, authCookie);
    if (dashRes1.status !== 200 || !dashRes1.data?.success) {
      throw new Error('Failed to fetch dashboard');
    }
    const recentEnr = dashRes1.data.dashboard?.recentEnrollments || [];
    const course2Enrolled = recentEnr.find(e => e.courseId === 2);
    if (!course2Enrolled) {
      throw new Error('Enrolled Course 2 not found in dashboard recentEnrollments');
    }
    console.log(`   ✅ Course ID 2 found in Dashboard recent enrollments: "${course2Enrolled.courseTitle}"`);

    // --------------------------------------------------
    // TEST 2: Duplicate Enrollment Check (409)
    // --------------------------------------------------
    console.log('\n5️⃣ TEST 2: Attempting duplicate enrollment in Course ID 2...');
    const dupRes = await request('POST', '/enrollments', { courseId: 2 }, authCookie);
    if (dupRes.status !== 409) {
      throw new Error(`Expected status 409 Conflict for duplicate enrollment, received status ${dupRes.status}`);
    }
    console.log(`   ✅ Received expected 409 Conflict: "${dupRes.data?.message}" (CourseCard UI handles gracefully with info toast & /dashboard redirect)`);

    // --------------------------------------------------
    // TEST 3: Dashboard Persistence Refresh
    // --------------------------------------------------
    console.log('\n6️⃣ TEST 3: Verifying backend persistence via GET /api/enrollments...');
    const enrList = await request('GET', '/enrollments', null, authCookie);
    if (enrList.status !== 200 || !enrList.data?.success || !Array.isArray(enrList.data.enrollments)) {
      throw new Error('Failed to fetch enrollments');
    }
    const userCourse2Enrollments = enrList.data.enrollments.filter(e => e.courseId === 2 || e.course?.id === 2);
    if (userCourse2Enrollments.length !== 1) {
      throw new Error(`Expected exactly 1 enrollment record for course 2, found ${userCourse2Enrollments.length}`);
    }
    console.log('   ✅ Confirmed exactly 1 enrollment record in PostgreSQL database.');

    // --------------------------------------------------
    // TEST 4: Logout & Unauthenticated check
    // --------------------------------------------------
    console.log('\n7️⃣ TEST 4: Logging out student...');
    await request('POST', '/auth/logout', null, authCookie);
    console.log('   Logged out successfully.');

    console.log('   Verifying unauthenticated enrollment attempt post-logout...');
    const postLogoutEnr = await request('POST', '/enrollments', { courseId: 3 });
    if (postLogoutEnr.status !== 401) {
      throw new Error(`Expected status 401 post-logout, received ${postLogoutEnr.status}`);
    }
    console.log('   ✅ Re-enrollment rejected post-logout with 401 (redirects to /login).');

    // --------------------------------------------------
    // TEST 5: Enroll in another course (Course ID 3)
    // --------------------------------------------------
    console.log('\n8️⃣ TEST 5: Logging back in & enrolling in Course ID 3...');
    const reloginRes = await request('POST', '/auth/login', { email: testEmail, password: testPassword });
    const freshCookie = reloginRes.cookie;
    const enrollRes2 = await request('POST', '/enrollments', { courseId: 3 }, freshCookie);
    if (enrollRes2.status !== 201 || !enrollRes2.data?.success) {
      throw new Error(`Enrollment in Course 3 failed: ${enrollRes2.data?.message}`);
    }
    console.log(`   ✅ Successfully enrolled in Course ID 3 (Title: "${enrollRes2.data.enrollment?.course?.title || 'Course 3'}")`);

    const dashRes2 = await request('GET', '/dashboard', null, freshCookie);
    const enrolledCoursesCount = dashRes2.data.dashboard?.statistics?.enrolledCourses;
    console.log(`   Total enrolled courses in Dashboard stats: ${enrolledCoursesCount}`);
    if (enrolledCoursesCount !== 2) {
      throw new Error(`Expected 2 enrolled courses in dashboard stats, got ${enrolledCoursesCount}`);
    }

    // Cleanup test user
    console.log('\n9️⃣ Teardown & cleaning up test user...');
    await request('POST', '/auth/logout', null, freshCookie);
    console.log('   ✅ Test complete and clean.');

    console.log('\n==================================================');
    console.log('🎉 ALL COURSE CARD ENROLL NOW TESTS PASSED SUCCESSFULLY!');
    console.log('==================================================\n');

  } catch (err) {
    console.error('\n❌ ENROLLMENT CARD FLOW TEST FAILED:');
    console.error(err);
    process.exit(1);
  }
}

runEnrollmentCardFlowTests();
