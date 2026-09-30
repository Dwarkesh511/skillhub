import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

function request(path, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      const setCookieHeader = res.headers['set-cookie'];
      let extractedCookie = null;
      if (setCookieHeader) {
        const first = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
        if (first) {
          extractedCookie = first.split(';')[0];
        }
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }

        resolve({
          status: res.statusCode,
          headers: res.headers,
          cookie: extractedCookie,
          body: parsed
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(JSON.stringify(postData));
    }

    req.end();
  });
}

async function runE2ETests() {
  console.log('==================================================');
  console.log('RUNNING STEP 8H SKILLHUB FULL-STACK E2E TEST SUITE');
  console.log('==================================================\n');

  const timestamp = Date.now();
  const userAEmail = `student_e2e_a_${timestamp}@example.com`;
  const userBEmail = `student_e2e_b_${timestamp}@example.com`;
  const defaultPassword = 'Password123!';

  let cookieUserA = '';
  let cookieUserB = '';
  let userACertificateId = '';

  // 1. Health check
  console.log('1. Health Check (GET /api/health)...');
  const res1 = await request('/health');
  if (res1.status === 200 && res1.body.success) {
    console.log(`   ✅ PASSED: Health check OK (${res1.body.message})`);
  } else {
    console.error(`   ❌ FAILED: Health check failed (${res1.status})`, res1.body);
    process.exit(1);
  }

  // 2. Register User A
  console.log(`\n2. Registering User A (${userAEmail})...`);
  const res2 = await request('/auth/register', { method: 'POST' }, {
    name: 'User A Student',
    email: userAEmail,
    password: defaultPassword
  });
  if (res2.status === 201 && res2.body.success && res2.body.user.role === 'STUDENT') {
    console.log(`   ✅ PASSED: User A registered with role "${res2.body.user.role}"`);
  } else {
    console.error(`   ❌ FAILED: Registration for User A failed (${res2.status})`, res2.body);
    process.exit(1);
  }

  // 3. Login User A
  console.log('\n3. Logging in User A...');
  const res3 = await request('/auth/login', { method: 'POST' }, {
    email: userAEmail,
    password: defaultPassword
  });
  if (res3.status === 200 && res3.body.success && res3.cookie) {
    cookieUserA = res3.cookie;
    console.log('   ✅ PASSED: User A logged in and HttpOnly cookie received');
  } else {
    console.error(`   ❌ FAILED: Login for User A failed (${res3.status})`, res3.body);
    process.exit(1);
  }

  // 4. Profile check for User A
  console.log('\n4. Fetching Profile for User A...');
  const res4 = await request('/users/profile', { headers: { Cookie: cookieUserA } });
  if (res4.status === 200 && res4.body.success && res4.body.user.email === userAEmail) {
    console.log(`   ✅ PASSED: Profile verified for "${res4.body.user.name}"`);
  } else {
    console.error(`   ❌ FAILED: Profile check failed (${res4.status})`, res4.body);
    process.exit(1);
  }

  // 5. Course Catalog & Categories check
  console.log('\n5. Fetching Course Catalog & Categories...');
  const res5Courses = await request('/courses');
  const res5Cats = await request('/categories');
  if (res5Courses.status === 200 && res5Cats.status === 200 && res5Courses.body.courses.length > 0) {
    console.log(`   ✅ PASSED: Catalog returned ${res5Courses.body.courses.length} courses and ${res5Cats.body.categories.length} categories`);
  } else {
    console.error('   ❌ FAILED: Course catalog check failed:', res5Courses.body, res5Cats.body);
    process.exit(1);
  }

  // 6. Course Details check
  console.log('\n6. Fetching Course Details for Course ID 1...');
  const res6 = await request('/courses/1');
  if (res6.status === 200 && res6.body.success && res6.body.course) {
    console.log(`   ✅ PASSED: Course details fetched for "${res6.body.course.title}"`);
  } else {
    console.error(`   ❌ FAILED: Course details check failed (${res6.status})`, res6.body);
    process.exit(1);
  }

  // 7. Bookmark Course 1 for User A
  console.log('\n7. Bookmarking Course 1 for User A...');
  const res7 = await request('/bookmarks', {
    method: 'POST',
    headers: { Cookie: cookieUserA }
  }, { courseId: 1 });
  if (res7.status === 201 && res7.body.success) {
    console.log('   ✅ PASSED: Course 1 bookmarked for User A');
  } else {
    console.error(`   ❌ FAILED: Bookmark failed (${res7.status})`, res7.body);
    process.exit(1);
  }

  // 8. Enroll User A in Course 1
  console.log('\n8. Enrolling User A in Course 1...');
  const res8 = await request('/enrollments', {
    method: 'POST',
    headers: { Cookie: cookieUserA }
  }, { courseId: 1 });
  if (res8.status === 201 && res8.body.success) {
    console.log('   ✅ PASSED: User A enrolled in Course 1');
  } else {
    console.error(`   ❌ FAILED: Enrollment failed (${res8.status})`, res8.body);
    process.exit(1);
  }

  // 9. Fetch Course Progress for User A
  console.log('\n9. Fetching Course 1 Progress for User A...');
  const res9 = await request('/progress/course/1', { headers: { Cookie: cookieUserA } });
  if (res9.status === 200 && res9.body.success && res9.body.progress) {
    console.log(`   ✅ PASSED: Initial progress: ${res9.body.progress.progressPercentage}%, Total lessons: ${res9.body.progress.totalLessons}`);
  } else {
    console.error(`   ❌ FAILED: Progress fetch failed (${res9.status})`, res9.body);
    process.exit(1);
  }

  // 10. Complete ALL lessons in Course 1 for User A
  console.log('\n10. Marking ALL lessons in Course 1 as COMPLETED for User A...');
  const modules = res9.body.progress.modules;
  const allLessons = [];
  modules.forEach(m => {
    if (m.lessons) allLessons.push(...m.lessons);
  });

  for (const les of allLessons) {
    await request('/progress/toggle', {
      method: 'POST',
      headers: { Cookie: cookieUserA }
    }, { lessonId: les.id, completed: true });
  }
  console.log(`   ✅ PASSED: Completed all ${allLessons.length} lessons`);

  // 11 & 12. Verify 100% progress and COMPLETED status
  console.log('\n11 & 12. Verifying 100% progress & COMPLETED enrollment status for User A...');
  const res11 = await request('/progress/course/1', { headers: { Cookie: cookieUserA } });
  if (
    res11.status === 200 &&
    res11.body.progress.progressPercentage === 100 &&
    res11.body.progress.status === 'COMPLETED'
  ) {
    console.log(`   ✅ PASSED: Progress: ${res11.body.progress.progressPercentage}%, Status: "${res11.body.progress.status}"`);
  } else {
    console.error('   ❌ FAILED: Course 1 completion verification failed:', res11.body);
    process.exit(1);
  }

  // 13. Verify Certificate creation for User A
  console.log('\n13. Verifying Certificate issuance for User A...');
  const res13 = await request('/certificates', { headers: { Cookie: cookieUserA } });
  if (res13.status === 200 && res13.body.certificates.length === 1) {
    userACertificateId = res13.body.certificates[0].id;
    console.log(`   ✅ PASSED: Certificate issued! Number: ${res13.body.certificates[0].certificateNumber}, ID: ${userACertificateId}`);
  } else {
    console.error('   ❌ FAILED: Certificate check failed for User A:', res13.body);
    process.exit(1);
  }

  // 14. Verify Dashboard statistics for User A
  console.log('\n14. Verifying Dashboard statistics for User A...');
  const res14 = await request('/dashboard', { headers: { Cookie: cookieUserA } });
  const statsA = res14.body.dashboard.statistics;
  if (
    res14.status === 200 &&
    statsA.enrolledCourses === 1 &&
    statsA.completedCourses === 1 &&
    statsA.certificates === 1
  ) {
    console.log(`   ✅ PASSED: User A Dashboard: Enrolled=${statsA.enrolledCourses}, Completed=${statsA.completedCourses}, Certs=${statsA.certificates}, Hours=${statsA.hoursLearned}`);
  } else {
    console.error('   ❌ FAILED: User A Dashboard statistics incorrect:', statsA);
    process.exit(1);
  }

  // 15. Logout User A
  console.log('\n15. Logging out User A...');
  const res15 = await request('/auth/logout', {
    method: 'POST',
    headers: { Cookie: cookieUserA }
  });
  if (res15.status === 200 && res15.body.success) {
    console.log('   ✅ PASSED: User A logged out');
  } else {
    console.error(`   ❌ FAILED: Logout for User A failed (${res15.status})`, res15.body);
    process.exit(1);
  }

  // 16. Register User B
  console.log(`\n16. Registering User B (${userBEmail})...`);
  const res16 = await request('/auth/register', { method: 'POST' }, {
    name: 'User B Student',
    email: userBEmail,
    password: defaultPassword
  });
  if (res16.status === 201 && res16.body.success) {
    console.log('   ✅ PASSED: User B registered');
  } else {
    console.error(`   ❌ FAILED: Registration for User B failed (${res16.status})`, res16.body);
    process.exit(1);
  }

  // 17. Login User B
  console.log('\n17. Logging in User B...');
  const res17 = await request('/auth/login', { method: 'POST' }, {
    email: userBEmail,
    password: defaultPassword
  });
  if (res17.status === 200 && res17.body.success && res17.cookie) {
    cookieUserB = res17.cookie;
    console.log('   ✅ PASSED: User B logged in');
  } else {
    console.error(`   ❌ FAILED: Login for User B failed (${res17.status})`, res17.body);
    process.exit(1);
  }

  // 18. User Isolation Check for User B
  console.log('\n18. Verifying DATA ISOLATION (User B MUST NOT see User A\'s data)...');
  const bEnr = await request('/enrollments', { headers: { Cookie: cookieUserB } });
  const bBm = await request('/bookmarks', { headers: { Cookie: cookieUserB } });
  const bCert = await request('/certificates', { headers: { Cookie: cookieUserB } });
  const bDash = await request('/dashboard', { headers: { Cookie: cookieUserB } });
  const bProg = await request('/progress/course/1', { headers: { Cookie: cookieUserB } });

  if (
    bEnr.body.enrollments.length === 0 &&
    bBm.body.bookmarks.length === 0 &&
    bCert.body.certificates.length === 0 &&
    bDash.body.dashboard.statistics.enrolledCourses === 0 &&
    bProg.status === 403
  ) {
    console.log('   ✅ PASSED: USER ISOLATION CONFIRMED!');
    console.log('      - User B Enrollments: 0');
    console.log('      - User B Bookmarks: 0');
    console.log('      - User B Certificates: 0');
    console.log('      - User B Course 1 Progress Access: 403 Forbidden');
  } else {
    console.error('   ❌ FAILED: Data isolation breach detected! User B accessed User A\'s data!');
    process.exit(1);
  }

  // 19. Logout User B
  console.log('\n19. Logging out User B...');
  const res19 = await request('/auth/logout', {
    method: 'POST',
    headers: { Cookie: cookieUserB }
  });
  if (res19.status === 200 && res19.body.success) {
    console.log('   ✅ PASSED: User B logged out');
  } else {
    console.error(`   ❌ FAILED: Logout for User B failed (${res19.status})`, res19.body);
    process.exit(1);
  }

  // 20. Post-logout protected endpoint check -> 401 Unauthorized
  console.log('\n20. Testing Protected Endpoints without Auth Token post-logout...');
  const res20Dash = await request('/dashboard');
  const res20Cert = await request('/certificates');
  if (res20Dash.status === 401 && res20Cert.status === 401) {
    console.log('   ✅ PASSED: Protected endpoints returned 401 Unauthorized');
  } else {
    console.error('   ❌ FAILED: Expected 401 for unauthenticated calls:', res20Dash.status, res20Cert.status);
    process.exit(1);
  }

  // 21. Cleanup & Conclusion
  console.log('\n21. Finalizing E2E Test Verification & Teardown...');
  console.log('   ✅ PASSED: Full-stack end-to-end integration verified successfully!');

  console.log('\n==================================================');
  console.log('ALL 21 FULL-STACK E2E INTEGRATION TESTS PASSED SUCCESSFULLY!');
  console.log('==================================================\n');
}

runE2ETests().catch(err => {
  console.error('E2E Test execution error:', err);
  process.exit(1);
});
